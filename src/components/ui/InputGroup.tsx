
import React from 'react';
import { InfoIcon } from '../icons/index.tsx';

type InputMode = "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";

interface InputGroupProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  type?: string;
  step?: string;
  inputMode?: InputMode;
  autoComplete?: string;
  tooltipText?: string;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(({ id, label, value, onChange, placeholder, icon, required = false, type = "text", step = "any", inputMode, autoComplete = "off", tooltipText, disabled = false, hasError = false, errorMessage }, ref) => {
    
    const containerClasses = [
        "relative flex items-center transition-all duration-200",
        "bg-white dark:bg-slate-900",
        "border rounded-xl overflow-hidden",
        hasError 
            ? "border-red-300 dark:border-red-900/50 ring-2 ring-red-100 dark:ring-red-900/20" 
            : "border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-500/20"
    ].join(' ');

    return (
        <div className="group">
            <div className="flex items-center justify-between mb-2">
                <label htmlFor={id} className={`text-sm font-medium transition-colors ${hasError ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                
                {tooltipText && (
                    <div className="relative group/tooltip">
                        <InfoIcon className="h-4 w-4 text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-60 p-3 bg-slate-800 text-slate-50 text-xs leading-relaxed rounded-xl shadow-xl opacity-0 translate-y-2 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all duration-200 pointer-events-none z-50">
                            {tooltipText}
                            <div className="absolute right-1 bottom-[-4px] w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className={containerClasses}>
                <div className="pl-3.5 text-slate-400 dark:text-slate-500">
                    {icon}
                </div>
                <input
                    ref={ref}
                    type={type}
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-800/50"
                    aria-label={label}
                    step={step}
                    inputMode={inputMode}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    aria-invalid={hasError}
                    aria-required={required}
                />
            </div>
            {hasError && errorMessage && (
                <p role="alert" className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1 animate-fade-in">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                    {errorMessage}
                </p>
            )}
        </div>
    )
});
