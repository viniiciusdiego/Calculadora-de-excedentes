import { useState, useEffect } from 'react';

export const useTheme = (): [string, (theme: string) => void] => {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') {
            return 'dark';
        }
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const setTheme = (newTheme: string) => {
        setThemeState(newTheme);
    };

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark';

        root.classList.toggle('dark', isDark);
        root.classList.toggle('light', !isDark);
        
        localStorage.setItem('theme', theme);
    }, [theme]);

    return [theme, setTheme];
};