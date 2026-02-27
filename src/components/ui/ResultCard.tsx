
import React, { useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp.ts';
import { CopyIcon, CheckIcon } from '../icons/index.tsx';

interface ResultCardProps {
    title: string;
    value: number;
    unit: string;
    icon?: React.ReactNode;
    delay?: number;
    colorClass?: string;
    isCopyable?: boolean;
    highlightClass?: string;
    className?: string;
    tooltipText?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
    title, 
    value, 
    unit, 
    icon, 
    delay = 0, 
    colorClass = 'text-slate-800 dark:text-slate-100', 
    isCopyable = false, 
    highlightClass = '',
    className = '',
    tooltipText
}) => {
  const animatedValue = useCountUp(value);
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    if (copied || !isCopyable) return;
    const valueToCopy = String(value).replace('.', ',');
    navigator.clipboard.writeText(valueToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  // Extract base color for background styles
  const baseColor = colorClass.split('-')[1] || 'slate';

  const containerClasses = [
    "group relative overflow-hidden",
    "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md",
    "border border-white dark:border-slate-800",
    "rounded-2xl p-4 shadow-sm hover:shadow-xl hover:shadow-blue-500/5",
    "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
    "animate-fade-in-up",
    highlightClass ? highlightClass : "",
    className,
    isCopyable ? "cursor-pointer active:scale-[0.98]" : ""
  ].join(' ');

  return (
    <div 
      className={containerClasses}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
      onClick={handleCopy}
      role={isCopyable ? "button" : "presentation"}
      title={tooltipText || (isCopyable ? "Clique para copiar" : "")}
    >
        <div className="flex items-start justify-between relative z-10">
            <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1.5">{title}</p>
                <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-black tracking-tighter ${colorClass} transition-transform duration-300 group-hover:scale-105 origin-left`}>
                        {animatedValue.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase">{unit}</span>
                </div>
            </div>
            
            {icon && (
                <div className={`
                    flex items-center justify-center h-10 w-10 rounded-xl
                    bg-${baseColor}-500/10 dark:bg-${baseColor}-500/10 
                    text-${baseColor}-600 dark:text-${baseColor}-400
                    transition-all group-hover:rotate-12 group-hover:scale-110 duration-500
                `}>
                    <div className="h-5 w-5">
                        {icon}
                    </div>
                </div>
            )}
        </div>

        {/* Decorative background blur */}
        <div className={`absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-${baseColor}-500/10 blur-2xl pointer-events-none transition-all duration-700 group-hover:scale-150 group-hover:opacity-100 opacity-40`}></div>
        <div className={`absolute -left-6 -top-6 h-16 w-16 rounded-full bg-${baseColor}-500/5 blur-xl pointer-events-none transition-all duration-700 group-hover:translate-x-4 group-hover:translate-y-4 opacity-0 group-hover:opacity-100`}></div>

        {isCopyable && (
            <div className="absolute top-2 right-2 transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                {copied ? 
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 p-1 rounded-md">
                        <CheckIcon className="h-3 w-3" />
                    </div> 
                    : 
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 p-1 rounded-md">
                        <CopyIcon className="h-3 w-3" />
                    </div>
                }
            </div>
        )}
    </div>
  );
};
