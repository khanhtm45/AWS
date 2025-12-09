import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// Translation cache to avoid repeated API calls
const translationCache = new Map();

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'vi';
    });

    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        localStorage.setItem('preferredLanguage', currentLanguage);
    }, [currentLanguage]);

    const toggleLanguage = () => {
        setCurrentLanguage(prev => prev === 'vi' ? 'en' : 'vi');
    };

    const switchToVietnamese = () => {
        setCurrentLanguage('vi');
    };

    const switchToEnglish = () => {
        setCurrentLanguage('en');
    };

    const translate = useCallback(async (text, targetLang = null) => {
        if (!text || typeof text !== 'string') return text;

        const target = targetLang || currentLanguage;
        
        // Return original text if target is Vietnamese and text seems to be in Vietnamese already
        // Or if target is English and text seems to be in English already
        if (target === 'vi' && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
            return text;
        }
        if (target === 'en' && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
            return text;
        }

        // Check cache
        const cacheKey = `${text}_${target}`;
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey);
        }

        try {
            setIsTranslating(true);
            const response = await axios.post(`${API_BASE_URL}/api/translate`, {
                text: text,
                sourceLanguage: 'auto',
                targetLanguage: target
            });

            let translatedText = response.data.translatedText;
            
            // Capitalize first letter if original text was capitalized
            if (text && text[0] === text[0].toUpperCase()) {
                translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
            }
            
            // Cache the result
            translationCache.set(cacheKey, translatedText);
            
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text on error
        } finally {
            setIsTranslating(false);
        }
    }, [currentLanguage]);

    const translateMultiple = useCallback(async (texts, targetLang = null) => {
        if (!Array.isArray(texts)) return [];

        const target = targetLang || currentLanguage;
        const promises = texts.map(text => translate(text, target));
        
        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error('Multiple translation error:', error);
            return texts;
        }
    }, [currentLanguage, translate]);

    // Static translations for common UI elements
    const t = useCallback((key) => {
        const translations = {
            // Common
            'home': { vi: 'Trang chủ', en: 'Home' },
            'about': { vi: 'Về chúng tôi', en: 'About' },
            'contact': { vi: 'Liên hệ', en: 'Contact' },
            'login': { vi: 'Đăng nhập', en: 'Login' },
            'logout': { vi: 'Đăng xuất', en: 'Logout' },
            'register': { vi: 'Đăng ký', en: 'Register' },
            'cart': { vi: 'Giỏ hàng', en: 'Cart' },
            'checkout': { vi: 'Thanh toán', en: 'Checkout' },
            'profile': { vi: 'Hồ sơ', en: 'Profile' },
            'dashboard': { vi: 'Bảng điều khiển', en: 'Dashboard' },
            'products': { vi: 'Sản phẩm', en: 'Products' },
            'categories': { vi: 'Danh mục', en: 'Categories' },
            'search': { vi: 'Tìm kiếm', en: 'Search' },
            'filter': { vi: 'Lọc', en: 'Filter' },
            'sort': { vi: 'Sắp xếp', en: 'Sort' },
            'price': { vi: 'Giá', en: 'Price' },
            'quantity': { vi: 'Số lượng', en: 'Quantity' },
            'total': { vi: 'Tổng cộng', en: 'Total' },
            'subtotal': { vi: 'Tạm tính', en: 'Subtotal' },
            'shipping': { vi: 'Vận chuyển', en: 'Shipping' },
            'discount': { vi: 'Giảm giá', en: 'Discount' },
            'apply': { vi: 'Áp dụng', en: 'Apply' },
            'cancel': { vi: 'Hủy', en: 'Cancel' },
            'confirm': { vi: 'Xác nhận', en: 'Confirm' },
            'save': { vi: 'Lưu', en: 'Save' },
            'edit': { vi: 'Chỉnh sửa', en: 'Edit' },
            'delete': { vi: 'Xóa', en: 'Delete' },
            'add': { vi: 'Thêm', en: 'Add' },
            'update': { vi: 'Cập nhật', en: 'Update' },
            'view': { vi: 'Xem', en: 'View' },
            'back': { vi: 'Quay lại', en: 'Back' },
            'next': { vi: 'Tiếp theo', en: 'Next' },
            'previous': { vi: 'Trước', en: 'Previous' },
            'loading': { vi: 'Đang tải...', en: 'Loading...' },
            'error': { vi: 'Lỗi', en: 'Error' },
            'success': { vi: 'Thành công', en: 'Success' },
            'warning': { vi: 'Cảnh báo', en: 'Warning' },
            'info': { vi: 'Thông tin', en: 'Info' },
            
            // Product related
            'add_to_cart': { vi: 'Thêm vào giỏ', en: 'Add to Cart' },
            'buy_now': { vi: 'Mua ngay', en: 'Buy Now' },
            'out_of_stock': { vi: 'Hết hàng', en: 'Out of Stock' },
            'in_stock': { vi: 'Còn hàng', en: 'In Stock' },
            'product_details': { vi: 'Chi tiết sản phẩm', en: 'Product Details' },
            'description': { vi: 'Mô tả', en: 'Description' },
            'reviews': { vi: 'Đánh giá', en: 'Reviews' },
            'rating': { vi: 'Xếp hạng', en: 'Rating' },
            
            // Order related
            'orders': { vi: 'Đơn hàng', en: 'Orders' },
            'order_history': { vi: 'Lịch sử đơn hàng', en: 'Order History' },
            'order_details': { vi: 'Chi tiết đơn hàng', en: 'Order Details' },
            'order_status': { vi: 'Trạng thái', en: 'Status' },
            'shipping_address': { vi: 'Địa chỉ giao hàng', en: 'Shipping Address' },
            'payment_method': { vi: 'Phương thức thanh toán', en: 'Payment Method' },
            
            // Messages
            'welcome': { vi: 'Chào mừng', en: 'Welcome' },
            'thank_you': { vi: 'Cảm ơn', en: 'Thank You' },
            'no_results': { vi: 'Không có kết quả', en: 'No Results' },
            'empty_cart': { vi: 'Giỏ hàng trống', en: 'Empty Cart' },
            
            // Footer translations
            'free_shipping': { vi: 'MIỄN PHÍ SHIP', en: 'FREE SHIPPING' },
            'nationwide': { vi: 'Toàn quốc', en: 'Nationwide' },
            'voucher_20': { vi: 'VOUCHER 20%', en: 'VOUCHER 20%' },
            'for_new_customers': { vi: 'Cho khách mới', en: 'For new customers' },
            'warranty': { vi: 'BẢO HÀNH', en: 'WARRANTY' },
            '365_days': { vi: '365 ngày', en: '365 days' },
            'address': { vi: 'ĐỊA CHỈ', en: 'ADDRESS' },
            'leaf_store': { vi: 'Cửa hàng Leaf VN', en: 'Leaf VN Store' },
            'shirt_products': { vi: 'Sản phẩm Áo', en: 'Shirt Products' },
            'pants_products': { vi: 'Sản phẩm Quần', en: 'Pants Products' },
            'about_leaf': { vi: 'Về Leaf', en: 'About Leaf' },
            'introduction': { vi: 'Giới Thiệu', en: 'Introduction' },
            'exchange_return': { vi: 'Đổi Trả', en: 'Exchange & Return' },
            'shipping': { vi: 'Vận Chuyển', en: 'Shipping' },
        };

        return translations[key]?.[currentLanguage] || key;
    }, [currentLanguage]);

    const value = {
        currentLanguage,
        isVietnamese: currentLanguage === 'vi',
        isEnglish: currentLanguage === 'en',
        toggleLanguage,
        switchToVietnamese,
        switchToEnglish,
        translate,
        translateMultiple,
        isTranslating,
        t, // Static translation function
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
