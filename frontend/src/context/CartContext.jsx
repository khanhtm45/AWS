import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// Minimal UUID generator for sessionId
const generateUuid = () => {
  // RFC4122 version 4 compliant simple implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Load cart from localStorage on initialization
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  // sessionId: persistent guest identifier stored in localStorage
  const [sessionId, setSessionId] = useState(() => {
    try {
      const s = localStorage.getItem('cartSessionId');
      if (s) return s;
      const newId = 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2,9);
      localStorage.setItem('cartSessionId', newId);
      return newId;
    } catch (e) {
      return null;
    }
  });

  const { user, accessToken } = useAuth();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Helper: get presigned URL for S3 key or return URL as-is
  const getPresignedUrl = async (s3KeyOrUrl) => {
    if (!s3KeyOrUrl) return '/LEAF.png';
    if (s3KeyOrUrl.startsWith('http')) return s3KeyOrUrl;
    try {
      const apiUrl = `${API_BASE}/api/s3/download-url?s3Key=${encodeURIComponent(s3KeyOrUrl)}&expirationMinutes=60`;
      const response = await fetch(apiUrl);
      if (!response.ok) return '/LEAF.png';
      const data = await response.json();
      return data.presignedUrl || data.url || data.downloadUrl || '/LEAF.png';
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      return '/LEAF.png';
    }
  };

  // Helper: map server CartResponse -> frontend cart item shape with full product data
  const mapServerCartToFrontend = async (serverCart) => {
    if (!serverCart || !Array.isArray(serverCart.items)) return [];
    
    // Fetch all products to get names and images
    const productIds = [...new Set(serverCart.items.map(it => 
      it.getProductId ? it.getProductId() : it.productId
    ))];
    
    const productsMap = {};
    try {
      const productsRes = await fetch(`${API_BASE}/api/products`);
      if (productsRes.ok) {
        const allProducts = await productsRes.json();
        allProducts.forEach(p => {
          productsMap[p.productId] = p;
        });
      }
    } catch (e) {
      console.debug('Failed to fetch products for cart enrichment', e);
    }

    // Map each cart item with enriched product data
    return await Promise.all(serverCart.items.map(async (it) => {
      const productId = it.getProductId ? it.getProductId() : it.productId;
      const product = productsMap[productId];
      
      let productName = it.getProductName ? it.getProductName() : it.productName || '';
      let imageUrl = '/LEAF.png';
      
      if (product) {
        productName = product.productName || product.name || productName;
        
        // Fetch media for this product
        try {
          const mediaRes = await fetch(`${API_BASE}/api/products/${productId}/media`);
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            let primaryImage = mediaData.find(m => m.isPrimary === true);
            if (!primaryImage && mediaData.length > 0) {
              const sortedMedia = mediaData.sort((a, b) => (a.mediaOrder || 0) - (b.mediaOrder || 0));
              primaryImage = sortedMedia[0];
            }
            if (primaryImage && primaryImage.s3Key) {
              imageUrl = await getPresignedUrl(primaryImage.s3Key);
            }
          }
        } catch (e) {
          console.debug(`Failed to fetch media for product ${productId}`, e);
        }
      }
      
      return {
        cartItemId: it.getItemId ? it.getItemId() : it.itemId || it.itemId,
        id: productId,
        quantity: it.getQuantity ? it.getQuantity() : it.quantity || 1,
        price: it.getUnitPrice ? it.getUnitPrice() : it.unitPrice || 0,
        name: productName,
        image: imageUrl,
        selectedSize: it.getSize ? it.getSize() : it.size || '',
        selectedColor: it.getColor ? it.getColor() : it.color || ''
      };
    }));
  };

  // On mount and when `user` or `sessionId` changes: fetch server-side cart and replace local cartItems
  useEffect(() => {
    const syncFromServer = async () => {
      try {
        const userId = user && (user.id || user.userId || user.userID) ? String(user.id || user.userId || user.userID) : null;
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (sessionId) params.append('sessionId', sessionId);

        const res = await fetch(`${API_BASE}/api/cart?${params.toString()}`);
        if (res.ok) {
          const serverCart = await res.json();
          const mapped = await mapServerCartToFrontend(serverCart);
          if (mapped.length > 0) setCartItems(mapped);
        }
      } catch (e) {
        // ignore network errors; keep local cart
        console.debug('Failed to sync cart from server', e);
      }
    };
    if (sessionId) syncFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user]);

  const addToCart = (product) => {
    // Try to persist to backend and update local state from server response
    (async () => {
      try {
        const userId = user && (user.id || user.userId || user.userID) ? (user.id || user.userId || user.userID) : null;
        const body = {
          userId: userId,
          sessionId: sessionId,
          productId: product.id,
          variantId: product.variantId || null,
          quantity: product.quantity || 1,
          size: product.selectedSize || null,
          color: product.selectedColor || null
        };
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const res = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const serverCart = await res.json();
          const mapped = await mapServerCartToFrontend(serverCart);
          setCartItems(mapped);
          return;
        }
      } catch (e) {
        console.debug('Failed to call addItem API', e);
      }

      // Fallback to local update if API fails
      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(
          item => item.id === product.id && 
                  item.selectedSize === product.selectedSize && 
                  item.selectedColor === product.selectedColor
        );

        if (existingItemIndex > -1) {
          const newItems = [...prevItems];
          newItems[existingItemIndex].quantity += product.quantity;
          return newItems;
        } else {
          return [...prevItems, { ...product, cartItemId: Date.now() }];
        }
      });
    })();
  };

  const removeFromCart = (cartItemId) => {
    (async () => {
      try {
        const userId = user && (user.id || user.userId || user.userID) ? (user.id || user.userId || user.userID) : null;
        const params = new URLSearchParams();
        if (userId) params.append('userId', String(userId));
        if (sessionId) params.append('sessionId', sessionId);
        const headers = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const res = await fetch(`${API_BASE}/api/cart/items/${encodeURIComponent(cartItemId)}?${params.toString()}`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) {
          const serverCart = await res.json();
          const mapped = await mapServerCartToFrontend(serverCart);
          setCartItems(mapped);
          return;
        }
      } catch (e) {
        console.debug('Failed to call deleteItem API', e);
      }

      // Fallback
      setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    })();
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    (async () => {
      try {
        const userId = user && (user.id || user.userId || user.userID) ? (user.id || user.userId || user.userID) : null;
        const params = new URLSearchParams();
        if (userId) params.append('userId', String(userId));
        if (sessionId) params.append('sessionId', sessionId);
        params.append('quantity', String(newQuantity));
        const headers = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const res = await fetch(`${API_BASE}/api/cart/items/${encodeURIComponent(cartItemId)}?${params.toString()}`, {
          method: 'PUT',
          headers
        });
        if (res.ok) {
          const serverCart = await res.json();
          const mapped = await mapServerCartToFrontend(serverCart);
          setCartItems(mapped);
          return;
        }
      } catch (e) {
        console.debug('Failed to call updateItem API', e);
      }

      // Fallback
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    })();
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      let priceNum = 0;
      if (typeof item.price === 'number') {
        priceNum = item.price;
      } else if (typeof item.price === 'string') {
        const cleaned = item.price.replace(/[^\d.-]/g, '');
        priceNum = parseFloat(cleaned) || 0;
      }
      return total + (priceNum * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartCount,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

