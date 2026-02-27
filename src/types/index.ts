
export interface ExtraCost {
  id: string;
  description: string;
  value: string;
}

export interface HistoryItem {
  id: number;
  supabase_id?: string;
  r3: number;
  r4: number | null;
  coberturaCliente: number | null;
  deslocamento: number | null;
  excedenteR3: number;
  excedenteR3Original?: number;
  excedenteCliente: number;
  excedenteClienteOriginal?: number;
  ajusteKM?: number;
  novaCobertura?: number;
  costDetails?: {
    valorKm: string;
    valorPedagio: string;
    custoTotal: number;
    providerToll?: string;
    // providerOtherCost mantido para compatibilidade legado, mas o novo padrão é extraCosts
    providerOtherCost?: string;
    extraCosts?: ExtraCost[];
  };
}
