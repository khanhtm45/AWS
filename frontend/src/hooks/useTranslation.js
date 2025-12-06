import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Custom hook to translate text automatically when language changes
 * @param {string} text - Original text to translate
 * @param {string} defaultText - Default text if translation fails
 * @returns {string} - Translated text
 */
export const useTranslatedText = (text, defaultText = '') => {
    const { currentLanguage, translate } = useLanguage();
    const [translatedText, setTranslatedText] = useState(text || defaultText);

    useEffect(() => {
        if (!text) {
            setTranslatedText(defaultText);
            return;
        }

        let isMounted = true;

        const performTranslation = async () => {
            try {
                const result = await translate(text);
                if (isMounted) {
                    setTranslatedText(result || text);
                }
            } catch (error) {
                console.error('Translation error:', error);
                if (isMounted) {
                    setTranslatedText(text);
                }
            }
        };

        performTranslation();

        return () => {
            isMounted = false;
        };
    }, [text, currentLanguage, translate, defaultText]);

    return translatedText;
};

/**
 * Custom hook to translate multiple texts
 * @param {Array<string>} texts - Array of texts to translate
 * @returns {Array<string>} - Array of translated texts
 */
export const useTranslatedTexts = (texts = []) => {
    const { currentLanguage, translateMultiple } = useLanguage();
    const [translatedTexts, setTranslatedTexts] = useState(texts);

    useEffect(() => {
        if (!texts || texts.length === 0) {
            setTranslatedTexts([]);
            return;
        }

        let isMounted = true;

        const performTranslation = async () => {
            try {
                const results = await translateMultiple(texts);
                if (isMounted) {
                    setTranslatedTexts(results);
                }
            } catch (error) {
                console.error('Translation error:', error);
                if (isMounted) {
                    setTranslatedTexts(texts);
                }
            }
        };

        performTranslation();

        return () => {
            isMounted = false;
        };
    }, [JSON.stringify(texts), currentLanguage, translateMultiple]);

    return translatedTexts;
};
