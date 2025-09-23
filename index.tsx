import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// SVG Icon Components
const RouteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 019-2.944c3.436 0 6.554 1.396 8.618 3.04A12.02 12.02 0 0021 8.944a11.955 11.955 0 01-2.382-4.96z" />
  </svg>
);

const CurrencyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 4h4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CopyIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);


const useTheme = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return [theme, setTheme];
};

const ThemeToggle = ({ theme, setTheme }) => (
    <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="absolute top-4 right-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-300"
        aria-label="Toggle theme"
    >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
);


const InputGroup = ({ id, label, value, onChange, placeholder, icon, required = false, type = "number", step = "any" }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition dark:bg-slate-700 dark:border-slate-600 dark:text-gray-50 dark:placeholder-gray-400"
        aria-label={label}
        required={required}
        step={step}
      />
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md m-auto animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            aria-label="Fechar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [theme, setTheme] = useTheme();
  const [r3, setR3] = useState('');
  const [r4, setR4] = useState('');
  const [coberturaCliente, setCoberturaCliente] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valorKm, setValorKm] = useState('');
  const [valorPedagio, setValorPedagio] = useState('');
  const [costDetails, setCostDetails] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const parseCurrency = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  };
  
  const handleCalculate = (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setCostDetails(null);
    setCopySuccess('');

    const r3Num = parseFloat(r3);
    const r4Num = parseFloat(r4);
    const coberturaClienteNum = parseFloat(coberturaCliente);

    if (isNaN(r3Num) || isNaN(r4Num)) {
      setError('Os valores de R3 e R4 são obrigatórios e devem ser numéricos.');
      return;
    }
    
    if (coberturaCliente.trim() !== '' && isNaN(coberturaClienteNum)) {
        setError('O valor da Cobertura do Cliente deve ser numérico.');
        return;
    }

    const deslocamento = r4Num - r3Num;
    let excedenteR3 = 0;
    let excedenteCliente = 0;
    let finalCoberturaCliente = null;

    if (r4Num >= r3Num) {
        excedenteR3 = Math.max(0, r3Num - 40);
        if (coberturaCliente.trim() !== '' && !isNaN(coberturaClienteNum)) {
          excedenteCliente = Math.max(0, r3Num - coberturaClienteNum);
        }
    }
    
    if (coberturaCliente.trim() !== '' && !isNaN(coberturaClienteNum)) {
      finalCoberturaCliente = coberturaClienteNum;
    }

    setResults({
      r3: r3Num,
      r4: r4Num,
      coberturaCliente: finalCoberturaCliente,
      deslocamento,
      excedenteR3,
      excedenteCliente,
    });
  };
  
  const handleClear = () => {
    setR3('');
    setR4('');
    setCoberturaCliente('');
    setError('');
    setResults(null);
    setCostDetails(null);
    setCopySuccess('');
  };

  const openModal = () => {
    setValorKm(costDetails?.valorKm || '');
    setValorPedagio(costDetails?.valorPedagio || '');
    setIsModalOpen(true);
  };

  const handleCurrencyInputChange = (e, setter) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');

    if (value === '') {
        setter('');
        return;
    }

    const numberValue = parseInt(value, 10) / 100;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue);

    setter(formattedValue);
  };

  const handleCostCalculate = (e) => {
    e.preventDefault();

    const kmValue = parseCurrency(valorKm);
    const tollValue = parseCurrency(valorPedagio);
    const excedente = results?.excedenteCliente || 0;

    const total = (excedente * kmValue) + tollValue;
    setCostDetails({
        valorKm: valorKm || '0,00',
        valorPedagio: valorPedagio || '0,00',
        custoTotal: total,
    });
    setIsModalOpen(false);
  };
  
  const handleGenerateAndCopySummary = () => {
    if (!results) return;

    let summary = `*Resumo do Acionamento:*\n\n`;
    summary += `R3 Informado: ${results.r3} KM\n`;
    summary += `R4 Informado: ${results.r4} KM\n`;
    if (results.coberturaCliente !== null) {
      summary += `Cobertura do Cliente: ${results.coberturaCliente} KM\n`;
    }
    summary += `\n*Resultados:*\n`;
    summary += `Deslocamento: ${results.deslocamento} KM\n`;
    summary += `Excedentes: ${results.excedenteR3} KM\n`;
    if (results.excedenteCliente > 0) {
      summary += `Excedente do Cliente: ${results.excedenteCliente} KM\n`;
    }
    
    if (costDetails) {
        const tollValue = parseCurrency(costDetails.valorPedagio);
        summary += `\n*Custo Detalhado do Excedente:*\n`;
        summary += `- KM Excedente do Cliente: ${results.excedenteCliente} KM\n`;
        summary += `- Valor por KM: R$ ${costDetails.valorKm}\n`;
        if (tollValue > 0) {
           summary += `- Valor do Pedágio: R$ ${costDetails.valorPedagio}\n`;
        }
        summary += `\n*Cálculo:* (${results.excedenteCliente} KM × R$ ${costDetails.valorKm}) + R$ ${costDetails.valorPedagio} (Pedágio)\n`;
        summary += `*Custo Total: ${formatCurrency(costDetails.custoTotal)}*\n`;
      }

    navigator.clipboard.writeText(summary).then(() => {
      setCopySuccess('summary');
      setTimeout(() => setCopySuccess(''), 2500);
    }).catch(err => {
      console.error('Falha ao copiar o texto: ', err);
      alert('Não foi possível copiar o resumo.');
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4 font-sans relative">
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <main className={`w-full gap-8 transition-all duration-500 ease-in-out ${results ? 'max-w-6xl grid grid-cols-1 lg:grid-cols-2' : 'max-w-2xl'}`}>
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border-t-4 border-blue-600">
                <div className="text-center mb-8">
                    <img src="https://www.maxpar.com/mp-assets/uploads/2025/07/Logotipo-Maxpar-2.png" alt="Maxpar Logo" className="h-10 w-auto mx-auto mb-4" />
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Calculadora</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Cálculo de deslocamento e excedentes</p>
                </div>

                <form onSubmit={handleCalculate} className="space-y-6">
                    <InputGroup id="r3" label="Total da Rota 3 (R3)" value={r3} onChange={(e) => setR3(e.target.value)} placeholder="Ex: 50" icon={<RouteIcon />} required />
                    <InputGroup id="r4" label="Total da Rota 4 (R4)" value={r4} onChange={(e) => setR4(e.target.value)} placeholder="Ex: 120" icon={<RouteIcon />} required />
                    <InputGroup id="coberturaCliente" label="Cobertura do Cliente (KM)" value={coberturaCliente} onChange={(e) => setCoberturaCliente(e.target.value)} placeholder="Deixe em branco para ilimitada" icon={<ShieldIcon />} />
                    
                    {error && <p className="text-red-500 text-sm text-center font-medium animate-pulse">{error}</p>}
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button type="button" onClick={handleClear} className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-300 ease-in-out">Limpar</button>
                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out">Calcular</button>
                    </div>
                </form>
            </div>
            
            {results && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border-t-4 border-green-600 flex flex-col animate-fade-in">
                <div className="animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-6">Resultados</h2>
                    <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 text-gray-700">
                        <ResultRow label="R3 Informado" value={`${results.r3} KM`} />
                        <ResultRow label="R4 Informado" value={`${results.r4} KM`} />
                        {results.coberturaCliente !== null && (<ResultRow label="Cobertura do Cliente" value={`${results.coberturaCliente} KM`} />)}
                        <div className="!my-4 border-b border-gray-300/50 dark:border-slate-600"></div>
                        <ResultRow label="Deslocamento" value={`${results.deslocamento} KM`} isHighlighted={true} />
                        <ResultRow label="Excedentes" value={`${results.excedenteR3} KM`} isHighlighted={true} />
                        {results.excedenteCliente > 0 && (<ResultRow label="Excedente do Cliente" value={`${results.excedenteCliente} KM`} isHighlighted={true} />)}
                        {results.excedenteCliente > 0 && !costDetails && (
                            <div className="!mt-5 text-center">
                                <button onClick={openModal} className="w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out">Calcular Custo do Excedente</button>
                            </div>
                        )}
                    </div>

                    {costDetails && (
                    <div className="mt-4 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center mb-4 pt-4 border-t border-gray-200 dark:border-slate-700">Custo do Excedente</h3>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4 space-y-3 text-gray-700 relative">
                            <div className="text-center text-sm text-gray-600 dark:text-gray-300 mb-3 p-2 bg-green-100 dark:bg-green-800/30 rounded-md">
                                <p className="font-medium">
                                    (<span className="font-bold">{results.excedenteCliente} KM</span> × <span className="font-bold">R$ {costDetails.valorKm}</span>) + <span className="font-bold">R$ {costDetails.valorPedagio}</span> (Pedágio)
                                </p>
                            </div>
                            <ResultRow label="Valor por KM" value={`R$ ${costDetails.valorKm}`} />
                            <ResultRow label="Valor do Pedágio" value={`R$ ${costDetails.valorPedagio}`} />
                            <div className="!my-4 border-b border-gray-300/50 dark:border-slate-600"></div>
                            <ResultRow label="Custo Total" value={formatCurrency(costDetails.custoTotal)} isHighlighted={true} />
                             <button onClick={openModal} className="absolute top-2 right-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Editar Custo">
                                <EditIcon />
                            </button>
                        </div>
                    </div>
                    )}
                    
                    <div className="mt-6">
                        <button onClick={handleGenerateAndCopySummary} className={`w-full font-bold py-2.5 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition duration-300 ease-in-out ${ copySuccess === 'summary' ? 'bg-green-500 text-white' : 'bg-slate-600 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'}`}>
                            {copySuccess === 'summary' ? <CheckIcon /> : <CopyIcon />}
                            {copySuccess === 'summary' ? 'Copiado!' : 'Copiar Resumo'}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </main>
        <footer className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>Desenvolvido por Vinicius Diego.</p>
        </footer>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Calcular Custo do Excedente">
          <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-3 rounded-md">
                  <p className="font-semibold">KM Excedente: <span className="font-bold text-lg">{results?.excedenteCliente || 0} KM</span></p>
              </div>
              <form onSubmit={handleCostCalculate} className="space-y-4">
                  <InputGroup id="valorKm" label="Valor por KM Rodado (R$)" value={valorKm} onChange={(e) => handleCurrencyInputChange(e, setValorKm)} placeholder="Ex: 3,50" icon={<CurrencyIcon />} required type="text" />
                  <InputGroup id="valorPedagio" label="Valor do Pedágio (R$)" value={valorPedagio} onChange={(e) => handleCurrencyInputChange(e, setValorPedagio)} placeholder="Deixe em branco se não houver" icon={<CurrencyIcon />} type="text" />
                  <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out">Calcular e Salvar Custo</button>
              </form>
          </div>
      </Modal>
    </>
  );
};

const ResultRow = ({ label, value, isHighlighted = false }) => (
  <div className="flex justify-between items-baseline">
    <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
    <span className={`${isHighlighted ? 'text-2xl font-bold text-blue-600 dark:text-blue-400 animate-value-update' : 'text-lg text-slate-800 dark:text-slate-100'}`}>
      {value}
    </span>
  </div>
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in-up {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }

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
`;
document.head.appendChild(style);