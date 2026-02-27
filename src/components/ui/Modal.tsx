import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children = null, footer = null, size = 'sm' }) => {
  if (!isOpen) return null;

    const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl', // Slightly larger than standard lg
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full ${sizeClasses[size] || sizeClasses.sm} m-auto animate-scale-up flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mr-2">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 bg-slate-100 dark:bg-slate-800 rounded-full"
            aria-label="Fechar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl shrink-0">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};