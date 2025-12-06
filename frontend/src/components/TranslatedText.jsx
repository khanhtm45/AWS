import React from 'react';
import { useTranslatedText } from '../hooks/useTranslation';

/**
 * Component tự động dịch text bằng AWS Translate khi ngôn ngữ thay đổi
 * Sử dụng AWS Translate API để dịch dynamic content
 */
const TranslatedText = ({ text, children, fallback = '', ...props }) => {
    const textToTranslate = text || children || fallback;
    const translatedText = useTranslatedText(textToTranslate);
    
    return <>{translatedText}</>;
};

export default TranslatedText;
