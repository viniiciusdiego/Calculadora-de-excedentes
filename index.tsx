import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './src/App.tsx';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}

const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in-up {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up { 
    animation: fade-in-up 0.5s ease-out forwards;
  }

  @keyframes value-update {
    0% { opacity: 0.2; transform: scale(0.9) translateY(5px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-value-update { animation: value-update 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

  @keyframes scale-up {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .animate-scale-up { animation: scale-up 0.3s ease-out forwards; }
  
  @keyframes shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-4px); }
    40%, 60% { transform: translateX(4px); }
  }
  .animate-shake {
    animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
  }
`;
document.head.appendChild(style);