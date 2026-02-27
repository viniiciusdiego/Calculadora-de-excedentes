import React from 'react';
import { SunIcon, MoonIcon } from '../icons/index.tsx';

interface ThemeToggleProps {
    theme: string;
    setTheme: (theme: string) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => (
    <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-300"
        aria-label="Toggle theme"
    >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
);
