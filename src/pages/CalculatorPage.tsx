
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.ts';
import { HistoryItem, ExtraCost } from '../types/index.ts';
import { supabase } from '../services/supabase.ts';
import { ThemeToggle } from '../components/ui/ThemeToggle.tsx';
import { InputGroup } from '../components/ui/InputGroup.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ResultCard } from '../components/ui/ResultCard.tsx';
import { ResultRow } from '../components/ui/ResultRow.tsx';
import { 
    RouteIcon, 
    ShieldIcon, 
    CopyIcon, 
    CheckIcon, 
    EditIcon, 
    HistoryIcon, 
    TrashIcon,
    ClockIcon,
    UserIcon,
    BriefcaseIcon,
    BrlIcon,
    PlusIcon,
    QuestionMarkCircleIcon,
    LightBulbIcon,
    MapIcon,
    CalculatorIcon,
    CloudIcon,
    CloudRainIcon
} from '../components/icons/index.tsx';

// --- Utility Functions ---
const parseLocalFloat = (str: string): number => {
    if (typeof str !== 'string' || str.trim() === '') return NaN;
    const cleanedStr = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanedStr);
}

const customCeil = (value: number): number => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    if (value % 1 === 0) return value;
    const sign = Math.sign(value) || 1;
    const absValue = Math.abs(value);
    const ceiledAbs = Math.ceil(absValue * 10) / 10;
    return ceiledAbs * sign;
}

const parseCurrency = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
};

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CalculatorPage = () => {
  const [theme, setTheme] = useTheme();
  
  // State
  const [r3, setR3] = useState('');
  const [r4, setR4] = useState('');
  const [coberturaCliente, setCoberturaCliente] = useState('');
  const [results, setResults] = useState(null);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [costDetails, setCostDetails] = useState(null);
  const [error, setError] = useState({ field: '', message: '' });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valorKm, setValorKm] = useState('');
  const [valorPedagio, setValorPedagio] = useState('');
  const [providerToll, setProviderToll] = useState('');
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);
  const [includeProviderCosts, setIncludeProviderCosts] = useState(false);
  
  // UI States
  const [copySuccess, setCopySuccess] = useState('');
  const valorKmInputRef = useRef(null);
  
  // History States
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isGenesisModalOpen, setIsGenesisModalOpen] = useState(false);
  const [lastShownExcedente, setLastShownExcedente] = useState<number | null>(null);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isDeleteCostModalOpen, setIsDeleteCostModalOpen] = useState(false);
  
  // Help/Education State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Weather State
  const [weather, setWeather] = useState<{ temp: number, condition: string, isBad: boolean, city: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Device ID for isolation without login
  const getDeviceId = () => {
    let id = localStorage.getItem('device_id');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('device_id', id);
    }
    return id;
  };

  // Load History from Supabase & LocalStorage
  useEffect(() => {
    const loadData = async () => {
        setIsSyncing(true);
        const deviceId = getDeviceId();
        
        try {
            const savedHistory = localStorage.getItem('calculationHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) { console.error(e); }

        try {
            // Load History
            const { data, error } = await supabase
                .from('calculations')
                .select('*')
                .eq('device_id', deviceId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Supabase Load Error:", error);
                setSyncError(error.message);
            } else if (data) {
                setSyncError(null);
                const cloudHistory: HistoryItem[] = data.map(row => ({
                    id: row.id_numeric || Date.parse(row.created_at),
                    r3: row.r3,
                    r4: row.r4,
                    coberturaCliente: row.cobertura_cliente,
                    deslocamento: row.deslocamento,
                    excedenteR3: row.excedente_r3,
                    excedenteCliente: row.excedente_cliente,
                    costDetails: row.cost_details,
                    supabase_id: row.id
                }));
                
                setHistory(cloudHistory);
                localStorage.setItem('calculationHistory', JSON.stringify(cloudHistory));
            }

            // Load Global Template
            const { data: settingsData, error: settingsError } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'summary_template')
                .single();
            
            if (!settingsError && settingsData) {
                localStorage.setItem('summary_template', settingsData.value);
            }
        } catch (err: any) {
            console.error("Supabase Load Exception", err);
            setSyncError(err.message || "Erro de conexão com a nuvem");
        } finally {
            setIsSyncing(false);
        }
    };

    loadData();
  }, []);

  const fetchWeather = async () => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    
    if (!navigator.geolocation) {
        setWeatherError("Geolocalização não suportada.");
        setIsWeatherLoading(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        
        if (!apiKey) {
            setWeatherError("API Key do clima não configurada.");
            setIsWeatherLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=pt_br`);
            const data = await response.json();
            
            if (response.ok) {
                const condition = data.weather[0].main.toLowerCase();
                const isBad = condition.includes('rain') || condition.includes('storm') || condition.includes('snow') || condition.includes('drizzle');
                setWeather({
                    temp: Math.round(data.main.temp),
                    condition: data.weather[0].description,
                    isBad,
                    city: data.name
                });
            } else {
                setWeatherError("Erro ao buscar clima.");
            }
        } catch (err) {
            setWeatherError("Falha na conexão.");
        } finally {
            setIsWeatherLoading(false);
        }
    }, (err) => {
        setWeatherError("Permissão de localização negada.");
        setIsWeatherLoading(false);
    });
  };

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        if (valorKmInputRef.current) {
          valorKmInputRef.current.focus();
          valorKmInputRef.current.select();
        }
      }, 150);
    }
  }, [isModalOpen]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Allow only numbers and one comma or dot
    value = value.replace(/[^0-9,.]/g, '');
    
    // Ensure only one decimal separator exists
    const firstSeparatorIndex = value.search(/[.,]/);
    if (firstSeparatorIndex !== -1) {
        const before = value.substring(0, firstSeparatorIndex + 1);
        const after = value.substring(firstSeparatorIndex + 1).replace(/[.,]/g, '');
        value = before + after;
    }
    
    setter(value);
    if (error.message) setError({ field: '', message: '' });
  };

  const handleCurrencyInputChange = (e, setter) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') { setter(''); return; }
    const formattedValue = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseInt(value, 10) / 100);
    setter(formattedValue);
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    setError({ field: '', message: '' });
    setResults(null);
    setCostDetails(null);
    setCopySuccess('');
    setCurrentId(null);

    if (r3.trim() === '') { setError({ field: 'r3', message: 'Preencha este campo.' }); return; }

    const r3Num = parseLocalFloat(r3);
    const r4Num = parseLocalFloat(r4);
    const coberturaNum = parseLocalFloat(coberturaCliente);

    if (isNaN(r3Num)) { setError({ field: 'r3', message: 'Valor inválido.' }); return; }
    if (r4.trim() !== '' && isNaN(r4Num)) { setError({ field: 'r4', message: 'Valor inválido.' }); return; }
    if (coberturaCliente.trim() !== '' && isNaN(coberturaNum)) { setError({ field: 'coberturaCliente', message: 'Valor inválido.' }); return; }

    const hasR4 = r4.trim() !== '' && !isNaN(r4Num);
    const r4Val = hasR4 ? r4Num : r3Num;
    
    const totalDeslocamento = Math.max(0, r4Val - r3Num);
    const deslocamentoDeduction = Math.min(40, totalDeslocamento);
    const deslocamentoRaw = totalDeslocamento - deslocamentoDeduction;
    
    const remainingDeduction = 40 - deslocamentoDeduction;
    let excedenteR3Raw = Math.max(0, r3Num - remainingDeduction);

    let excedenteClienteRaw = 0;
    if (coberturaCliente.trim() !== '' && !isNaN(coberturaNum)) {
        excedenteClienteRaw = Math.max(0, r3Num - coberturaNum);
        if (excedenteClienteRaw > 0) {
            excedenteR3Raw = Math.max(0, excedenteR3Raw - excedenteClienteRaw);
        }
    }

    const currentResults = {
      r3: r3Num,
      r4: hasR4 ? r4Num : null,
      coberturaCliente: coberturaCliente.trim() !== '' && !isNaN(coberturaNum) ? coberturaNum : null,
      deslocamento: deslocamentoRaw !== null ? customCeil(deslocamentoRaw) : null,
      excedenteR3: customCeil(excedenteR3Raw),
      excedenteCliente: customCeil(excedenteClienteRaw),
    };
    
    setResults(currentResults);
    const newId = Date.now();
    setCurrentId(newId);

    if (excedenteClienteRaw > 0 && excedenteClienteRaw !== lastShownExcedente) {
        setIsGenesisModalOpen(true);
        setLastShownExcedente(excedenteClienteRaw);
    }

    const newHistoryEntry: HistoryItem = { id: newId, ...currentResults };
    const updatedLocal = [newHistoryEntry, ...history].slice(0, 50);
    setHistory(updatedLocal);
    localStorage.setItem('calculationHistory', JSON.stringify(updatedLocal));

    const syncToCloud = async () => {
        setSyncError(null);
        try {
            const { data, error } = await supabase
                .from('calculations')
                .insert([{
                    device_id: getDeviceId(),
                    id_numeric: newId,
                    r3: currentResults.r3,
                    r4: currentResults.r4,
                    cobertura_cliente: currentResults.coberturaCliente,
                    deslocamento: currentResults.deslocamento,
                    excedente_r3: currentResults.excedenteR3,
                    excedente_cliente: currentResults.excedenteCliente
                }])
                .select();
            
            if (error) {
                console.error("Supabase Insert Error:", error);
                setSyncError("Erro ao salvar na nuvem: " + error.message);
            } else if (data?.[0]) {
                setHistory(prev => prev.map(item => item.id === newId ? { ...item, supabase_id: data[0].id } : item));
            }
        } catch (err: any) { 
            console.error("Cloud Sync Exception", err); 
            setSyncError("Erro de rede ao sincronizar");
        }
    };
    syncToCloud();
  };
  
  const handleClear = () => {
    setR3(''); setR4(''); setCoberturaCliente(''); setError({ field: '', message: '' });
    setResults(null); setCurrentId(null); setCostDetails(null); setCopySuccess('');
    setValorKm(''); setValorPedagio(''); setProviderToll(''); setExtraCosts([]); setIncludeProviderCosts(false);
  };

  const openModal = () => {
    setValorKm(costDetails?.valorKm || '');
    setValorPedagio(costDetails?.valorPedagio || '');
    setProviderToll(costDetails?.providerToll || '');
    
    let initialExtra = [];
    if (costDetails?.extraCosts?.length > 0) initialExtra = [...costDetails.extraCosts];
    else if (costDetails?.providerOtherCost && costDetails.providerOtherCost !== '0,00') {
        initialExtra = [{ id: 'legacy', description: 'Outros Custos', value: costDetails.providerOtherCost }];
    }
    setExtraCosts(initialExtra);
    setIncludeProviderCosts(!!costDetails?.providerToll || initialExtra.length > 0);
    setIsModalOpen(true);
  };

  const handleAddExtraCost = () => setExtraCosts(p => [...p, { id: Date.now().toString(), description: '', value: '' }]);
  const handleRemoveExtraCost = (id) => setExtraCosts(p => p.filter(c => c.id !== id));
  const handleUpdateExtraCost = (id, f, v) => setExtraCosts(p => p.map(c => c.id === id ? { ...c, [f]: v } : c));
  const handleCurrencyExtra = (e, id) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v === '') handleUpdateExtraCost(id, 'value', '');
      else handleUpdateExtraCost(id, 'value', new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseInt(v, 10) / 100));
  };

  const handleCostCalculate = (e) => {
    e.preventDefault();
    const kmVal = parseCurrency(valorKm);
    const tollVal = parseCurrency(valorPedagio);
    const validExtras = extraCosts.filter(c => (c.value && c.value !== '0,00') || c.description);
    
    const newDetails = {
        valorKm: valorKm || '0,00',
        valorPedagio: valorPedagio || '0,00',
        custoTotal: ((results?.excedenteCliente || 0) * kmVal) + tollVal,
        providerToll: includeProviderCosts ? (providerToll || '0,00') : undefined,
        extraCosts: includeProviderCosts ? validExtras : []
    };
    
    setCostDetails(newDetails);
    
    setHistory(prev => {
        const updated = prev.map(i => i.id === currentId ? { ...i, costDetails: newDetails } : i);
        localStorage.setItem('calculationHistory', JSON.stringify(updated));
        return updated;
    });

    const updateCloud = async () => {
        const item = history.find(i => i.id === currentId);
        if (item?.supabase_id) {
            await supabase
                .from('calculations')
                .update({ cost_details: newDetails })
                .eq('id', item.supabase_id);
        } else if (currentId) {
            await supabase
                .from('calculations')
                .update({ cost_details: newDetails })
                .eq('id_numeric', currentId)
                .eq('device_id', getDeviceId());
        }
    };
    updateCloud();
    
    setIsModalOpen(false);
  };

  const handleGenerateAndCopySummary = () => {
    if (!results) return;
    
    const savedTemplate = localStorage.getItem('summary_template');
    const template = savedTemplate || `📋 *Resumo do Acionamento* 📋

*Dados Informados:*
- Contato com a base falo com: XXXX 
- Prévia necessária: XXX Min
- Rota 3: XXXX | {{r3}} KM
{{#if r4}}- Rota 4: XXXX | {{r4}} KM{{/if}}
{{#if cobertura}}- Cobertura do Beneficiário: {{cobertura}} KM{{/if}}

*Resultados:*
{{#if deslocamento}}- Deslocamento (Prestador): {{deslocamento}} KM{{/if}}
- KM Cobertura: {{excedente_r3}} KM
{{#if excedente_cliente}}- *Excedente Beneficiário: {{excedente_cliente}} KM*{{/if}}

{{#if total_cliente}}
*Detalhamento (Beneficiário):*
{{#if excedente_cliente}}- Valor por KM: R$ {{valor_km}}{{/if}}
{{#if pedagio}}- Pedágio: R$ {{pedagio}}{{/if}}

💵 *TOTAL BENEFICIÁRIO: {{total_cliente}}*
O beneficiário está ciente de que deverá realizar o pagamento diretamente ao prestador, no valor de {{total_cliente}} no momento da retirada do veículo.
{{/if}}

{{#if custos_internos}}
🛠 *Custos Internos:*
{{custos_internos}}
{{/if}}`;

    const f = (n) => String(n).replace('.', ',');
    
    // Prepare internal costs string
    let internalCostsStr = '';
    if (costDetails) {
        if (costDetails.providerToll && costDetails.providerToll !== '0,00') {
            internalCostsStr += `- Pedágio: R$ ${costDetails.providerToll}\n`;
        }
        costDetails.extraCosts?.forEach(c => {
            internalCostsStr += `- ${c.description || 'Extra'}: R$ ${c.value || '0,00'}\n`;
        });
    }

    const data = {
        r3: f(results.r3),
        r4: results.r4 !== null ? f(results.r4) : null,
        cobertura: results.coberturaCliente !== null ? f(results.coberturaCliente) : null,
        deslocamento: results.deslocamento !== null ? f(results.deslocamento) : null,
        excedente_r3: f(results.excedenteR3),
        excedente_cliente: results.excedenteCliente > 0 ? f(results.excedenteCliente) : null,
        valor_km: costDetails?.valorKm || null,
        pedagio: costDetails?.valorPedagio && parseCurrency(costDetails.valorPedagio) > 0 ? costDetails.valorPedagio : null,
        total_cliente: costDetails?.custoTotal > 0 ? formatCurrency(costDetails.custoTotal) : null,
        custos_internos: internalCostsStr.trim() || null
    };

    let summary = template;

    // Handle #if blocks (supporting nesting by replacing innermost blocks first)
    const ifRegex = /{{#if\s+(\w+)}}\s*((?:(?!{{#if)[\s\S])*?)\s*{{\/if}}/g;
    let previousSummary;
    do {
        previousSummary = summary;
        summary = summary.replace(ifRegex, (match, key, content) => {
            return data[key] ? content : '';
        });
    } while (summary !== previousSummary);

    // Handle variables
    const varRegex = /{{(\w+)}}/g;
    summary = summary.replace(varRegex, (match, key) => {
        return data[key] || '';
    });

    // Clean up multiple empty lines and trim
    const finalSummary = summary
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    navigator.clipboard.writeText(finalSummary).then(() => { 
        setCopySuccess('summary'); 
        setTimeout(() => setCopySuccess(''), 2500); 
    });
  };

  const confirmDeleteCosts = () => {
    setCostDetails(null); setProviderToll(''); setExtraCosts([]); setIncludeProviderCosts(false);
    
    setHistory(prev => {
        if (!currentId) return prev;
        const up = prev.map(i => i.id === currentId ? { ...i, costDetails: undefined } : i);
        localStorage.setItem('calculationHistory', JSON.stringify(up));
        return up;
    });

    const deleteCloudCosts = async () => {
        const item = history.find(i => i.id === currentId);
        if (item?.supabase_id) {
            await supabase.from('calculations').update({ cost_details: null }).eq('id', item.supabase_id);
        } else if (currentId) {
            await supabase.from('calculations').update({ cost_details: null }).eq('id_numeric', currentId).eq('device_id', getDeviceId());
        }
    };
    deleteCloudCosts();

    setIsDeleteCostModalOpen(false);
  };
  
  const handleLoadFromHistory = (item: HistoryItem) => {
    setR3(String(item.r3).replace('.', ','));
    setR4(item.r4 !== null ? String(item.r4).replace('.', ',') : '');
    setCoberturaCliente(item.coberturaCliente !== null ? String(item.coberturaCliente).replace('.', ',') : '');
    
    const loadedResults = {
        r3: item.r3,
        r4: item.r4,
        coberturaCliente: item.coberturaCliente,
        deslocamento: item.deslocamento,
        excedenteR3: item.excedenteR3,
        excedenteCliente: item.excedenteCliente,
    };
    setResults(loadedResults);
    setCurrentId(item.id);

    if (item.costDetails) {
        setCostDetails(item.costDetails);
        setValorKm(item.costDetails.valorKm);
        setValorPedagio(item.costDetails.valorPedagio);
        setProviderToll(item.costDetails.providerToll || '');
        
        let initialExtra = [];
        if (item.costDetails.extraCosts?.length > 0) {
            initialExtra = [...item.costDetails.extraCosts];
        } else if (item.costDetails.providerOtherCost && item.costDetails.providerOtherCost !== '0,00') {
            initialExtra = [{ id: 'legacy', description: 'Outros Custos', value: item.costDetails.providerOtherCost }];
        }
        setExtraCosts(initialExtra);
        setIncludeProviderCosts(!!item.costDetails.providerToll || initialExtra.length > 0);
    } else {
        setCostDetails(null);
        setValorKm('');
        setValorPedagio('');
        setProviderToll('');
        setExtraCosts([]);
        setIncludeProviderCosts(false);
    }
    
    setError({ field: '', message: '' });
    setCopySuccess('');
    setIsHistoryModalOpen(false);
  };

  const canSaveCosts = (valorKm !== '' && valorKm !== '0,00') || (valorPedagio !== '' && valorPedagio !== '0,00') || (includeProviderCosts && ((providerToll !== '' && providerToll !== '0,00') || extraCosts.some(c => (c.value && c.value !== '0,00') || c.description)));

  const filteredHistory = history.filter(item => {
    if (!historySearch) return true;
    const search = historySearch.toLowerCase();
    const dateStr = new Date(item.id).toLocaleString('pt-BR').toLowerCase();
    const r3Str = String(item.r3).replace('.', ',');
    return dateStr.includes(search) || r3Str.includes(search);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-300 flex flex-col relative overflow-x-hidden">
        
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/10"></div>
            <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[100px] dark:bg-indigo-500/10"></div>
            <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-500/5 blur-[110px] dark:bg-emerald-500/10"></div>
        </div>
        
        <nav className="sticky top-0 z-40 w-full bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-3">
                        <img src="https://www.maxpar.com/mp-assets/uploads/2025/07/Logotipo-Maxpar-2.png" alt="Maxpar" className="h-6 w-auto dark:invert dark:opacity-90" />
                        <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
                        <span className="hidden sm:block text-sm font-semibold text-slate-500 dark:text-slate-400">Calculadora de Deslocamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                         {syncError && (
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-100 dark:border-red-800/50" title={syncError}>
                                 <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                 <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Erro de Sincronização</span>
                             </div>
                         )}
                         {isSyncing && !syncError && (
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800/50 animate-pulse">
                                 <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                 <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Sincronizando</span>
                             </div>
                         )}
                         {!isSyncing && !syncError && history.length > 0 && (
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800/50">
                                 <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                 <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Nuvem Ativa</span>
                             </div>
                         )}

                        {/* Weather Widget */}
                        {weather && (
                            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all animate-fade-in ${weather.isBad ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400' : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400'}`}>
                                {weather.isBad ? <CloudRainIcon className="h-3.5 w-3.5" /> : <CloudIcon className="h-3.5 w-3.5" />}
                                <span>{weather.city}: {weather.temp}°C - {weather.condition}</span>
                            </div>
                        )}
                        
                        <button 
                            onClick={fetchWeather}
                            disabled={isWeatherLoading}
                            className={`p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200 relative ${isWeatherLoading ? 'animate-pulse' : ''}`}
                            title="Verificar Clima Local"
                        >
                            <CloudIcon className="h-6 w-6" />
                            {weather?.isBad && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>}
                        </button>

                         <button onClick={() => setIsHelpModalOpen(true)} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200" title="Entenda o Cálculo">
                            <QuestionMarkCircleIcon />
                        </button>
                        <button onClick={() => setIsHistoryModalOpen(true)} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200" title="Histórico">
                            <HistoryIcon />
                        </button>
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                    </div>
                </div>
            </div>
        </nav>

        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
            <div className={`${results ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12' : 'flex justify-center items-center pt-10'} transition-all duration-500 ease-in-out`}>
                
                <div className={`flex flex-col gap-6 ${results ? 'lg:col-span-5 xl:col-span-4' : 'w-full max-w-lg'}`}>
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-white dark:border-slate-800 p-6 sm:p-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="mb-8">
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Novo Cálculo</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Insira os dados da rota para começar.</p>
                        </div>

                        <form onSubmit={handleCalculate} className="space-y-5">
                            <InputGroup 
                                id="r3" 
                                label="Rota 3" 
                                value={r3} 
                                onChange={handleInputChange(setR3)}
                                placeholder="Ex: 52,3" 
                                icon={<RouteIcon />} 
                                required 
                                type="text" 
                                inputMode="decimal"
                                tooltipText="Trajeto ida e volta do cliente: Origem > Destino > Origem."
                                hasError={error.field === 'r3'}
                                errorMessage={error.field === 'r3' ? error.message : ''}
                            />
                            <InputGroup 
                                id="r4" 
                                label="Rota 4" 
                                value={r4} 
                                onChange={handleInputChange(setR4)}
                                placeholder="Ex: 105" 
                                icon={<RouteIcon />} 
                                type="text" 
                                inputMode="decimal" 
                                tooltipText="Base > Cliente > Destino > Base."
                                hasError={error.field === 'r4'}
                                errorMessage={error.field === 'r4' ? error.message : ''}
                            />
                            <InputGroup 
                                id="coberturaCliente" 
                                label="Cobertura do Beneficiário(KM)" 
                                value={coberturaCliente} 
                                onChange={handleInputChange(setCoberturaCliente)}
                                placeholder="Deixe em branco para ilimitada" 
                                icon={<ShieldIcon />} 
                                type="text" 
                                inputMode="decimal"
                                tooltipText="Limite coberto pelo seguro."
                                hasError={error.field === 'coberturaCliente'}
                                errorMessage={error.field === 'coberturaCliente' ? error.message : ''}
                            />
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={handleClear} className="px-6 py-3.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    Limpar
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98]">
                                    Calcular Rota
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {results && (
                <div className="lg:col-span-7 xl:col-span-8 animate-fade-in-up">
                    <div className="sticky top-24 space-y-3 w-full max-w-[510px] mx-auto">
                        
                        <div className="flex flex-wrap gap-3 justify-center">
                            {results.deslocamento !== null && (
                                <ResultCard 
                                    title="Deslocamento" 
                                    value={results.deslocamento} 
                                    unit="KM" 
                                    colorClass="text-indigo-600 dark:text-indigo-400" 
                                    isCopyable 
                                    className="flex-1 min-w-[120px] max-w-[160px]"
                                />
                            )}
                            <ResultCard 
                                title="KM Cobertura" 
                                value={results.excedenteR3} 
                                unit="KM" 
                                colorClass="text-amber-500 dark:text-amber-400" 
                                isCopyable 
                                className="flex-1 min-w-[120px] max-w-[160px]"
                            />
                            {results.excedenteCliente > 0 && (
                                <ResultCard 
                                    title="Excedente Beneficiário" 
                                    value={results.excedenteCliente} 
                                    unit="KM" 
                                    colorClass="text-red-500 dark:text-red-400" 
                                    isCopyable 
                                    highlightClass="ring-2 ring-red-500/20 shadow-red-500/10" 
                                    className="flex-1 min-w-[120px] max-w-[160px]"
                                />
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Detalhamento Financeiro</h3>
                                {costDetails ? (
                                    <div className="flex gap-2">
                                        <button onClick={openModal} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><EditIcon className="h-4 w-4" /></button>
                                        <button onClick={() => setIsDeleteCostModalOpen(true)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                ) : (
                                    <button onClick={openModal} className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors">
                                        + Adicionar Custos
                                    </button>
                                )}
                            </div>

                            <div className="p-4">
                                {costDetails ? (
                                    <div className="space-y-6">
                                        {costDetails.custoTotal > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">A Pagar pelo Beneficiário</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                                                    {results.excedenteCliente > 0 && <ResultRow label="Valor do KM" value={`R$ ${costDetails.valorKm}`} />}
                                                    {parseCurrency(costDetails.valorPedagio) > 0 && <ResultRow label="Pedágio" value={`R$ ${costDetails.valorPedagio}`} />}
                                                    <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">Total</span>
                                                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(costDetails.custoTotal)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {((costDetails.providerToll && costDetails.providerToll !== '0,00') || costDetails.extraCosts?.length > 0) && (
                                            <div className="space-y-3">
                                                 <div className="flex items-center gap-2 mb-2">
                                                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Custos Internos</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 opacity-80">
                                                    {costDetails.providerToll && costDetails.providerToll !== '0,00' && <ResultRow label="Pedágio Prestador" value={`R$ ${costDetails.providerToll}`} />}
                                                    {costDetails.extraCosts?.map(c => (
                                                        <ResultRow key={c.id} label={c.description || 'Extra'} value={`R$ ${c.value || '0,00'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {costDetails.custoTotal === 0 && (!costDetails.providerToll || costDetails.providerToll === '0,00') && (!costDetails.extraCosts || costDetails.extraCosts.length === 0) && (
                                            <p className="text-center text-slate-400 italic py-4">Custos zerados.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/50 transition-colors cursor-pointer" onClick={openModal}>
                                        <div className="bg-slate-100 dark:bg-slate-800 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                            <BrlIcon className="h-6 w-6" />
                                        </div>
                                        <p className="font-semibold text-slate-600 dark:text-slate-300">Calcular Valores</p>
                                        <p className="text-sm text-slate-400 mt-1">Clique para adicionar valor do KM, pedágios e despesas.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={handleGenerateAndCopySummary} className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${ copySuccess === 'summary' ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'}`}>
                                    {copySuccess === 'summary' ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
                                    {copySuccess === 'summary' ? 'Copiado!' : 'Copiar Resumo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </main>
        
        <footer className="py-6 text-center border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Desenvolvido por <span className="text-slate-800 dark:text-slate-200">Vinicius Diego</span>
            </p>
        </footer>

        <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="Entendendo o Cálculo" size="lg">
            <div className="space-y-6 text-slate-700 dark:text-slate-300">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-800/50">
                    <LightBulbIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">
                        Esta calculadora automatiza a separação entre custos do prestador e cobrança do cliente, garantindo que a regra da <span className="font-bold text-blue-700 dark:text-blue-300">Saída do Prestador</span> seja respeitada.
                    </p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapIcon className="h-5 w-5 text-purple-500" /> 1. Conceitos da Rota
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Rota do Serviço</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">R3 (Rota 3)</span>
                            <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 leading-snug">Distância total do trajeto do cliente: <br/> <strong>Local de Coleta ➝ Destino de Entrega ➝ Retorno ao Local de Coleta</strong>.</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Rota do Prestador</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">R4 (Rota 4)</span>
                            <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 leading-snug">Rota logística completa do prestador.<br/>(Base ➝ Cliente ➝ Destino ➝ Base)</p>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <CalculatorIcon className="h-5 w-5 text-amber-500" /> 2. Regras de Cobrança e Pagamento
                    </h3>
                    <div className="space-y-4">
                        <div className="border-l-4 border-amber-500 pl-4 py-1">
                            <h4 className="font-bold text-amber-600 dark:text-amber-400">Franquia de Saída (40 KM)</h4>
                            <p className="text-sm mt-1">
                                Os primeiros <strong>40 KM</strong> da Rota Total (R4) são de responsabilidade do prestador (franquia). O sistema desconta esse valor prioritariamente do deslocamento.
                            </p>
                            <div className="space-y-2 mt-2">
                                <code className="block text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded w-fit font-mono">
                                    Total Pago = R4 - 40
                                </code>
                                <p className="text-[11px] text-slate-500 italic">
                                    * Caso exista Excedente Cliente, este valor é subtraído do KM Cobertura final.
                                </p>
                            </div>
                        </div>
                        <div className="border-l-4 border-indigo-500 pl-4 py-1">
                            <h4 className="font-bold text-indigo-600 dark:text-indigo-400">Cálculo de Deslocamento</h4>
                            <p className="text-sm mt-1">
                                Diferença entre a rota total (R4) e a rota do serviço (R3), com o abatimento da franquia de 40km.
                            </p>
                            <code className="block mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded w-fit font-mono">
                                Deslocamento = (R4 - R3) - 40*
                            </code>
                            <p className="text-[10px] text-slate-500 mt-1 italic">
                                *O desconto de 40km é aplicado no total da R4. Se o deslocamento for menor que 40km, o restante é abatido da R3.
                            </p>
                        </div>
                        <div className="border-l-4 border-red-500 pl-4 py-1">
                            <h4 className="font-bold text-red-600 dark:text-red-400">Cobertura do Cliente</h4>
                            <p className="text-sm mt-1">
                                O cliente paga tudo que a Rota 3 exceder o limite de cobertura da apólice dele.
                            </p>
                            <code className="block mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded w-fit font-mono">
                                A Pagar (Cliente) = R3 - Cobertura
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configuração de Custos" size={includeProviderCosts ? "2xl" : "md"} footer={<div className="flex flex-col sm:flex-row gap-3 w-full"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-5 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">Cancelar</button><button type="submit" form="costs-form" disabled={!canSaveCosts} className={`flex-1 py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${canSaveCosts ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'}`}><CheckIcon className="h-5 w-5" /> Salvar Alterações</button></div>}>
          <form id="costs-form" onSubmit={handleCostCalculate} className="contents">
            <button type="submit" disabled={!canSaveCosts} className="hidden" />
            <div className="flex flex-col md:flex-row">
                <div className={`flex flex-col transition-all duration-500 ${includeProviderCosts ? 'md:w-1/2 md:pr-12' : 'w-full'}`}>
                    <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><UserIcon className="h-5 w-5 text-blue-500" /><h3 className="font-bold text-lg">Beneficiário</h3></div>
                    {results?.coberturaCliente !== null ? (<div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 flex flex-col items-center justify-center text-center"><p className="text-xs font-bold uppercase opacity-80 mb-1">Distância a Cobrar</p><div className="flex items-center justify-center gap-1"><span className="text-4xl font-black">{String(results?.excedenteCliente || 0).replace('.', ',')}</span><span className="font-medium text-lg">KM</span></div></div>) : (<div className="mb-8 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center"><p className="text-sm text-slate-500">Sem excedente de KM a cobrar.</p></div>)}
                    <div className="space-y-6">{results?.coberturaCliente !== null && (<InputGroup ref={valorKmInputRef} id="valorKm" label="Valor por KM (R$)" value={valorKm} onChange={(e) => handleCurrencyInputChange(e, setValorKm)} placeholder="0,00" icon={<BrlIcon />} inputMode="decimal" />)}<InputGroup id="valorPedagio" label="Pedágio (R$)" value={valorPedagio} onChange={(e) => handleCurrencyInputChange(e, setValorPedagio)} placeholder="0,00" icon={<BrlIcon />} inputMode="decimal" /></div>
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800"><div onClick={() => setIncludeProviderCosts(!includeProviderCosts)} className="flex items-center justify-between cursor-pointer group select-none"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg transition-colors ${includeProviderCosts ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}><BriefcaseIcon className="h-5 w-5" /></div><span className={`font-medium transition-colors ${includeProviderCosts ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Incluir custos do prestador?</span></div><div className={`w-11 h-6 rounded-full p-1 transition-colors ${includeProviderCosts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`bg-white h-4 w-4 rounded-full shadow-sm transition-transform ${includeProviderCosts ? 'translate-x-5' : ''}`}></div></div></div></div>
                </div>
                <div className={`flex flex-col pt-8 md:pt-0 overflow-hidden transition-all duration-500 ${includeProviderCosts ? 'md:w-1/2 md:pl-12 opacity-100 max-h-[800px] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800' : 'md:w-0 md:pl-0 opacity-0 max-h-0 border-none'}`}>
                     <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><BriefcaseIcon className="h-5 w-5 text-slate-500" /><h3 className="font-bold text-lg">Prestador (Interno)</h3></div>
                    <div className="space-y-6"><div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs text-slate-500 leading-relaxed">Custos operacionais internos. Estes valores aparecem no resumo mas <strong>não são cobrados do cliente</strong>.</div><InputGroup id="providerToll" label="Pedágio Pago (R$)" value={providerToll} onChange={(e) => handleCurrencyInputChange(e, setProviderToll)} placeholder="0,00" icon={<BrlIcon />} inputMode="decimal" /><div className="pt-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Outras Despesas</label><div className="space-y-4">{extraCosts.map((c) => (<div key={c.id} className="flex gap-2 animate-fade-in-up"><input type="text" value={c.description} onChange={(e) => handleUpdateExtraCost(c.id, 'description', e.target.value)} placeholder="Descrição" className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" /><div className="relative w-24 shrink-0"><span className="absolute left-2 top-2 text-xs text-slate-400">R$</span><input type="text" value={c.value} onChange={(e) => handleCurrencyExtra(e, c.id)} className="w-full pl-6 pr-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500" placeholder="0,00" inputMode="decimal" /></div><button type="button" onClick={() => handleRemoveExtraCost(c.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><TrashIcon className="h-4 w-4" /></button></div>))}<button type="button" onClick={handleAddExtraCost} className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2"><PlusIcon className="h-4 w-4" /> Adicionar Item</button></div></div></div>
                </div>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Histórico de Cálculos" size="xl">
            <div className="flex flex-col h-full max-h-[75vh]">
                {/* Header Actions */}
                <div className="flex flex-col gap-4 mb-6 px-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Buscar por data ou KM..." 
                                value={historySearch} 
                                onChange={(e) => setHistorySearch(e.target.value)} 
                                className="block w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                            />
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {filteredHistory.length} registros
                            </span>
                            {history.length > 0 && (
                                <button 
                                    onClick={() => setIsClearHistoryModalOpen(true)} 
                                    className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors"
                                >
                                    Limpar Tudo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar pb-4">
                    {filteredHistory.length > 0 ? (
                        <div className="space-y-3">
                            {filteredHistory.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="group bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 hover:border-blue-200 dark:hover:border-blue-900/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col sm:flex-row sm:items-center gap-4"
                                >
                                    {/* Date & Time */}
                                    <div className="flex items-center gap-3 sm:w-40 shrink-0">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 dark:group-hover:bg-blue-900/20 transition-colors">
                                            <ClockIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {new Date(item.id).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                                                {new Date(item.id).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* KM Info */}
                                    <div className="flex-grow grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rota 3</span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {String(item.r3).replace('.', ',')} <small className="text-[10px] opacity-60">KM</small>
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Excedente</span>
                                            <span className={`text-sm font-bold ${item.excedenteCliente > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {String(item.excedenteCliente).replace('.', ',')} <small className="text-[10px] opacity-60">KM</small>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Value & Actions */}
                                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 dark:border-slate-800">
                                        {item.costDetails?.custoTotal > 0 && (
                                            <div className="flex flex-col items-end mr-2">
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Total</span>
                                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(item.costDetails.custoTotal)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleLoadFromHistory(item)} 
                                                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                                            >
                                                Abrir
                                            </button>
                                            <button 
                                                onClick={async (e) => { 
                                                    e.stopPropagation(); 
                                                    const h = history.filter(h => h.id !== item.id); 
                                                    setHistory(h); 
                                                    localStorage.setItem('calculationHistory', JSON.stringify(h)); 
                                                    if (item.supabase_id) { 
                                                        await supabase.from('calculations').delete().eq('id', item.supabase_id); 
                                                    } else { 
                                                        await supabase.from('calculations').delete().eq('id_numeric', item.id).eq('device_id', getDeviceId()); 
                                                    } 
                                                }} 
                                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" 
                                                title="Excluir"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-700">
                                <HistoryIcon />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum registro encontrado</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                                {historySearch ? 'Tente buscar por outro termo ou data.' : 'Seus cálculos recentes aparecerão aqui.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>

        <Modal isOpen={isGenesisModalOpen} onClose={() => setIsGenesisModalOpen(false)} title="Atenção: KM Excedente" size="md">
            <div className="p-2 text-center">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl mb-6 border border-amber-100 dark:border-amber-800/50"><div className="flex justify-center mb-4"><div className="h-12 w-12 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400"><LightBulbIcon className="h-6 w-6" /></div></div><p className="text-slate-700 dark:text-slate-300 leading-relaxed">Existe um valor excedente de <span className="font-bold text-amber-600 dark:text-amber-400">{String(results?.excedenteCliente || 0).replace('.', ',')} KM</span>.</p><div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-700/50 space-y-2"><p className="text-sm font-medium text-slate-600 dark:text-slate-400">1. Incluir no <span className="font-bold text-slate-900 dark:text-white">Genesis</span> no campo <span className="font-bold text-slate-900 dark:text-white">KM Excedente</span>.</p><p className="text-sm font-medium text-slate-600 dark:text-slate-400">2. Alterar o campo <span className="font-bold text-slate-900 dark:text-white">Refat</span> para <span className="font-bold text-slate-900 dark:text-white">Beneficiário</span>.</p></div></div>
                <button onClick={() => setIsGenesisModalOpen(false)} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">Entendido</button>
            </div>
        </Modal>

        <Modal isOpen={isDeleteCostModalOpen} onClose={() => setIsDeleteCostModalOpen(false)} title="Remover Custos">
            <div className="p-2 text-center"><p className="mb-6 text-slate-600 dark:text-slate-300">Deseja remover todos os custos associados a este cálculo?</p><div className="flex gap-3"><button onClick={() => setIsDeleteCostModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">Cancelar</button><button onClick={confirmDeleteCosts} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600">Sim, Remover</button></div></div>
        </Modal>
        
        <Modal isOpen={isClearHistoryModalOpen} onClose={() => setIsClearHistoryModalOpen(false)} title="Limpar Histórico">
            <div className="p-2 text-center"><p className="mb-6 text-slate-600 dark:text-slate-300">Isso apagará todos os cálculos salvos localmente e na nuvem para este dispositivo. Continuar?</p><div className="flex gap-3"><button onClick={() => setIsClearHistoryModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">Cancelar</button><button onClick={async () => { const deviceId = getDeviceId(); setHistory([]); localStorage.removeItem('calculationHistory'); setIsClearHistoryModalOpen(false); await supabase.from('calculations').delete().eq('device_id', deviceId); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600">Sim, Limpar</button></div></div>
        </Modal>
    </div>
  );
};

export default CalculatorPage;
