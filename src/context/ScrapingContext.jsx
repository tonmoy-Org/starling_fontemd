import { createContext, useContext, useState, useEffect } from 'react';

const ScrapingContext = createContext();

export const ScrapingProvider = ({ children }) => {
    // ← Initialize from localStorage so reload restores the state
    const [loading, setLoadingState] = useState(() => {
        return localStorage.getItem('scraping_loading') === 'true';
    });

    // Wrap setLoading to always sync with localStorage
    const setLoading = (value) => {
        localStorage.setItem('scraping_loading', value);
        setLoadingState(value);
    };

    // ← Safety: if user reloads and scraping is "stuck", 
    //   clear it after 5 minutes automatically
    useEffect(() => {
        if (loading) {
            const timeout = setTimeout(() => {
                setLoading(false);
            }, 5 * 60 * 1000); // 5 minutes
            return () => clearTimeout(timeout);
        }
    }, [loading]);

    return (
        <ScrapingContext.Provider value={{ loading, setLoading }}>
            {children}
        </ScrapingContext.Provider>
    );
};

export const useScraping = () => {
    const context = useContext(ScrapingContext);
    if (!context) {
        throw new Error('useScraping must be used within a ScrapingProvider');
    }
    return context;
};