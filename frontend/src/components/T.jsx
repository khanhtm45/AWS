import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Component tự động dịch text khi ngôn ngữ thay đổi
 * Sử dụng hàm t() cho static translations (nhanh, không cần API)
 */
const T = ({ children, ...props }) => {
    const { t } = useLanguage();
    
    if (typeof children === 'string') {
        return <span {...props}>{t(children)}</span>;
    }
    
    return <>{children}</>;
};

export default T;
