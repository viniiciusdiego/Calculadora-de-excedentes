import React from 'react';

interface ResultRowProps {
    label: string;
    value: string | number;
    isHighlighted?: boolean;
}

export const ResultRow: React.FC<ResultRowProps> = ({ label, value, isHighlighted = false }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
    <span className={`${isHighlighted ? 'text-lg font-black text-blue-600 dark:text-blue-400' : 'text-sm font-bold text-slate-800 dark:text-slate-100'}`}>
      {value}
    </span>
  </div>
);