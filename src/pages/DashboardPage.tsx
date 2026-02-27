
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { HistoryItem } from '../types/index.ts';
import { useTheme } from '../hooks/useTheme.ts';
import { ThemeToggle } from '../components/ui/ThemeToggle.tsx';
import { 
    CalculatorIcon, 
    CopyIcon, 
    ArrowLeftIcon,
    ClockIcon,
    EditIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CheckIcon,
    UserIcon,
    BriefcaseIcon,
    MapIcon,
    RouteIcon
} from '../components/icons/index.tsx';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const parseCurrency = (str: any) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
};

const DEFAULT_TEMPLATE = `📋 *Resumo do Acionamento* 📋

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

const DashboardPage = () => {
    const [theme, setTheme] = useTheme();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    
    // Template Editor State
    const [template, setTemplate] = useState(localStorage.getItem('summary_template') || DEFAULT_TEMPLATE);
    const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
    const [copyStatus, setCopyStatus] = useState<Record<number, string>>({});

    const getDeviceId = () => {
        let id = localStorage.getItem('device_id');
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('device_id', id);
        }
        return id;
    };

    useEffect(() => {
        const loadData = async () => {
            setIsSyncing(true);
            const deviceId = getDeviceId();
            
            try {
                // Load History
                const { data, error } = await supabase
                    .from('calculations')
                    .select('*')
                    .eq('device_id', deviceId)
                    .order('created_at', { ascending: false });

                if (!error && data) {
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
                    applyFilter(cloudHistory, filter);
                }

                // Load Template from Cloud
                const { data: settingsData, error: settingsError } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'summary_template')
                    .single();
                
                if (!settingsError && settingsData) {
                    setTemplate(settingsData.value);
                    localStorage.setItem('summary_template', settingsData.value);
                }
            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                setIsSyncing(false);
            }
        };
        loadData();
    }, []);

    const applyFilter = (data: HistoryItem[], currentFilter: string) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const lastWeek = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        let filtered = data;
        if (currentFilter === 'today') {
            filtered = data.filter(item => item.id >= today);
        } else if (currentFilter === 'week') {
            filtered = data.filter(item => item.id >= lastWeek);
        } else if (currentFilter === 'month') {
            filtered = data.filter(item => item.id >= startOfMonth);
        }
        setFilteredHistory(filtered);
    };

    useEffect(() => {
        applyFilter(history, filter);
    }, [filter, history]);

    const handleSaveTemplate = async () => {
        setSaveStatus('saving');
        
        try {
            // Save to LocalStorage
            localStorage.setItem('summary_template', template);
            
            // Save to Cloud
            const { error } = await supabase
                .from('app_settings')
                .upsert({ key: 'summary_template', value: template }, { onConflict: 'key' });
            
            if (error) throw error;

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error("Error saving template to cloud", err);
            // Even if cloud fails, we saved to local
            setSaveStatus('saved'); 
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopySummary = (item: HistoryItem) => {
        const f = (n: any) => String(n).replace('.', ',');
        
        // Prepare internal costs string
        let internalCostsStr = '';
        if (item.costDetails) {
            if (item.costDetails.providerToll && item.costDetails.providerToll !== '0,00') {
                internalCostsStr += `- Pedágio: R$ ${item.costDetails.providerToll}\n`;
            }
            item.costDetails.extraCosts?.forEach(c => {
                internalCostsStr += `- ${c.description || 'Extra'}: R$ ${c.value || '0,00'}\n`;
            });
        }

        const data: any = {
            r3: f(item.r3),
            r4: item.r4 !== null ? f(item.r4) : null,
            cobertura: item.coberturaCliente !== null ? f(item.coberturaCliente) : null,
            deslocamento: item.deslocamento !== null ? f(item.deslocamento) : null,
            excedente_r3: f(item.excedenteR3),
            excedente_cliente: item.excedenteCliente > 0 ? f(item.excedenteCliente) : null,
            valor_km: item.costDetails?.valorKm || null,
            pedagio: item.costDetails?.valorPedagio && parseCurrency(item.costDetails.valorPedagio) > 0 ? item.costDetails.valorPedagio : null,
            total_cliente: item.costDetails?.custoTotal > 0 ? formatCurrency(item.costDetails.custoTotal) : null,
            custos_internos: internalCostsStr.trim() || null
        };

        let summary = template;

        // Handle #if blocks
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

        const finalSummary = summary.replace(/\n{3,}/g, '\n\n').trim();

        navigator.clipboard.writeText(finalSummary).then(() => {
            setCopyStatus(prev => ({ ...prev, [item.id]: 'Copiado!' }));
            setTimeout(() => {
                setCopyStatus(prev => {
                    const next = { ...prev };
                    delete next[item.id];
                    return next;
                });
            }, 2000);
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 flex flex-col relative overflow-x-hidden">
            {/* Decorative Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10"></div>
                <div className="absolute -bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-blue-500/5 blur-[110px] dark:bg-blue-500/10"></div>
            </div>

            <nav className="sticky top-0 z-40 w-full bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsTemplateEditorOpen(true)}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                        >
                            <EditIcon className="h-4 w-4" /> Template de Resumo
                        </button>
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                        {isSyncing && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800/50 animate-pulse">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Atualizando</span>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="flex flex-col gap-8">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: 'all', label: 'Tudo' },
                            { id: 'today', label: 'Hoje' },
                            { id: 'week', label: '7 Dias' },
                            { id: 'month', label: 'Este Mês' }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    filter === f.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total de Cálculos</p>
                            <h4 className="text-4xl font-black text-slate-900 dark:text-white">{filteredHistory.length}</h4>
                            <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-full opacity-50"></div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">KM Excedente Total</p>
                            <h4 className="text-4xl font-black text-amber-500">
                                {String(filteredHistory.reduce((acc, curr) => acc + (curr.excedenteCliente || 0), 0).toFixed(1)).replace('.', ',')}
                            </h4>
                            <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase">KM Acumulados</p>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Cobrado</p>
                            <h4 className="text-4xl font-black text-emerald-500">
                                {formatCurrency(filteredHistory.reduce((acc, curr) => acc + (curr.costDetails?.custoTotal || 0), 0))}
                            </h4>
                            <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase">Valores Processados</p>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h5 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Relatório {filter !== 'all' ? 'Filtrado' : 'Completo'}</h5>
                            <button 
                                onClick={() => {
                                    const headers = ['Data', 'R3 (KM)', 'R4 (KM)', 'Cobertura (KM)', 'Excedente (KM)', 'Total (R$)'];
                                    const rows = filteredHistory.map(item => [
                                        new Date(item.id).toLocaleDateString('pt-BR'),
                                        item.r3,
                                        item.r4 || '-',
                                        item.coberturaCliente || 'Ilimitada',
                                        item.excedenteCliente,
                                        item.costDetails?.custoTotal || 0
                                    ]);
                                    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement("a");
                                    link.href = URL.createObjectURL(blob);
                                    link.setAttribute("download", `dashboard_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                            >
                                <CopyIcon className="h-3.5 w-3.5" /> Exportar CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data e Hora</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Rota 3</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Rota 4</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Excedente</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredHistory.map((item) => (
                                        <React.Fragment key={item.id}>
                                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                            <ClockIcon className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date(item.id).toLocaleDateString('pt-BR')}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{new Date(item.id).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{String(item.r3).replace('.', ',')} <small className="text-[10px] opacity-60">KM</small></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-500">{item.r4 ? `${String(item.r4).replace('.', ',')} KM` : '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-sm font-black ${item.excedenteCliente > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {String(item.excedenteCliente).replace('.', ',')} <small className="text-[10px] opacity-60">KM</small>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-base font-black text-slate-900 dark:text-white">
                                                            {item.costDetails?.custoTotal ? formatCurrency(item.costDetails.custoTotal) : '-'}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleCopySummary(item)}
                                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                                    copyStatus[item.id] 
                                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                                                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40'
                                                                }`}
                                                            >
                                                                {copyStatus[item.id] ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                                                                {copyStatus[item.id] || 'Copiar Resumo'}
                                                            </button>
                                                            <button 
                                                                onClick={() => toggleExpand(item.id)}
                                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
                                                            >
                                                                {expandedItems[item.id] ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                                                                {expandedItems[item.id] ? 'Fechar' : 'Ver Detalhes'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedItems[item.id] && (
                                                <tr className="bg-slate-50/30 dark:bg-slate-900/30 animate-fade-in">
                                                    <td colSpan={5} className="px-6 py-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            {/* Route Details */}
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-2">
                                                                    <MapIcon className="h-4 w-4 text-indigo-500" />
                                                                    <h6 className="text-xs font-black uppercase tracking-widest">Dados da Rota</h6>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Rota 3</p>
                                                                        <p className="text-sm font-bold">{String(item.r3).replace('.', ',')} KM</p>
                                                                    </div>
                                                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Rota 4</p>
                                                                        <p className="text-sm font-bold">{item.r4 ? `${String(item.r4).replace('.', ',')} KM` : '-'}</p>
                                                                    </div>
                                                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cobertura</p>
                                                                        <p className="text-sm font-bold">{item.coberturaCliente ? `${String(item.coberturaCliente).replace('.', ',')} KM` : 'Ilimitada'}</p>
                                                                    </div>
                                                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Deslocamento</p>
                                                                        <p className="text-sm font-bold">{item.deslocamento ? `${String(item.deslocamento).replace('.', ',')} KM` : '-'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Cost Details */}
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-2">
                                                                    <UserIcon className="h-4 w-4 text-emerald-500" />
                                                                    <h6 className="text-xs font-black uppercase tracking-widest">Custos Beneficiário</h6>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-slate-500">Valor por KM:</span>
                                                                        <span className="font-bold">{item.costDetails?.valorKm ? `R$ ${item.costDetails.valorKm}` : '-'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-slate-500">Pedágio:</span>
                                                                        <span className="font-bold">{item.costDetails?.valorPedagio ? `R$ ${item.costDetails.valorPedagio}` : '-'}</span>
                                                                    </div>
                                                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                                                                        <span className="font-bold text-slate-900 dark:text-white">Total:</span>
                                                                        <span className="font-black text-emerald-600 dark:text-emerald-400">{item.costDetails?.custoTotal ? formatCurrency(item.costDetails.custoTotal) : '-'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Provider Details */}
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-2">
                                                                    <BriefcaseIcon className="h-4 w-4 text-slate-500" />
                                                                    <h6 className="text-xs font-black uppercase tracking-widest">Custos Prestador</h6>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-slate-500">Pedágio Pago:</span>
                                                                        <span className="font-bold">{item.costDetails?.providerToll ? `R$ ${item.costDetails.providerToll}` : '-'}</span>
                                                                    </div>
                                                                    {item.costDetails?.extraCosts?.map((extra, idx) => (
                                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                                            <span className="text-slate-500 truncate max-w-[120px]">{extra.description || 'Extra'}:</span>
                                                                            <span className="font-bold">R$ {extra.value}</span>
                                                                        </div>
                                                                    ))}
                                                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 italic">
                                                                        ID Interno: {item.supabase_id || item.id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CalculatorIcon className="h-12 w-12 text-slate-200 dark:text-slate-800" />
                                                    <p className="text-slate-400 text-sm font-medium">Nenhum cálculo encontrado para o período selecionado.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Template Editor Modal */}
            {isTemplateEditorOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsTemplateEditorOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Editor de Resumo</h3>
                            <button onClick={() => setIsTemplateEditorOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <ArrowLeftIcon className="h-5 w-5 rotate-180" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2 tracking-widest">Variáveis Disponíveis</p>
                                <div className="flex flex-wrap gap-2">
                                    {['r3', 'r4', 'cobertura', 'deslocamento', 'excedente_r3', 'excedente_cliente', 'valor_km', 'pedagio', 'total_cliente', 'custos_internos'].map(v => (
                                        <code key={v} className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {`{{${v}}}`}
                                        </code>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-3 italic">
                                    Use <code>{`{{#if variavel}} ... {{/if}}`}</code> para esconder blocos se o valor for zero ou vazio.
                                </p>
                            </div>
                            <textarea 
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                className="w-full h-80 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors resize-none"
                                placeholder="Digite seu template aqui..."
                            />
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button 
                                onClick={() => { setTemplate(DEFAULT_TEMPLATE); localStorage.removeItem('summary_template'); }}
                                className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                                Resetar Padrão
                            </button>
                            <button 
                                onClick={handleSaveTemplate}
                                disabled={saveStatus !== 'idle'}
                                className={`px-6 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                                    saveStatus === 'saved' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                }`}
                            >
                                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : 'Salvar Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
