import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { currentLanguage, toggleLanguage, isTranslating } = useLanguage();

    return (
        <div className="language-switcher">
            <button 
                className={`lang-btn ${currentLanguage === 'vi' ? 'active' : ''}`}
                onClick={toggleLanguage}
                disabled={isTranslating}
                title={currentLanguage === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
            >
                <span className="flag-icon">
                    {currentLanguage === 'vi' ? '🇻🇳' : '🇬🇧'}
                </span>
                <span className="lang-code">
                    {currentLanguage.toUpperCase()}
                </span>
            </button>
            {isTranslating && (
                <div className="translating-indicator" title="Translating...">
                    <span className="spinner"></span>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
