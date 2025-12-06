import React from 'react';
import { useTranslatedText } from '../hooks/useTranslation';

const ProductCard = ({ product, onClick, badge, badgeColor, borderColor }) => {
    const translatedName = useTranslatedText(product.name);
    
    return (
        <div 
            className="product-card"
            onClick={onClick}
            style={{ position: 'relative', border: borderColor ? `2px solid ${borderColor}` : undefined, cursor: 'pointer' }}
        >
            {product.quantity === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2
                }}>
                    <div style={{
                        background: '#d32f2f',
                        color: 'white',
                        padding: '15px 30px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '24px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        SOLD OUT
                    </div>
                </div>
            )}
            
            {badge && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: badgeColor || 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    zIndex: 1
                }}>
                    {badge}
                </div>
            )}
            
            <div className="product-image" style={{ height: '280px' }}>
                <img 
                    src={product.image} 
                    alt={translatedName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => { e.target.src = '/LEAF.png'; }}
                />
            </div>
            
            <div className="product-info">
                <h3 style={{ fontSize: '16px', marginBottom: '8px', minHeight: '48px' }}>
                    {translatedName}
                </h3>
                <p className="product-price" style={{ 
                    color: borderColor || '#4CAF50',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    marginTop: '8px'
                }}>
                    {product.price}
                </p>
                <ProductStock quantity={product.quantity} />
            </div>
        </div>
    );
};

const ProductStock = ({ quantity }) => {
    const inStockText = useTranslatedText('Còn');
    const outOfStockText = useTranslatedText('Hết hàng');
    
    return (
        <p className="product-stock" style={{ 
            marginTop: 6, 
            color: quantity > 0 ? '#2a7a2a' : '#a00',
            fontSize: '14px'
        }}>
            {quantity > 0 ? `${inStockText} ${quantity}` : outOfStockText}
        </p>
    );
};

export default ProductCard;
