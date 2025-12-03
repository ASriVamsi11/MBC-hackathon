const POLYMARKET_API = 'https://gamma-api.polymarket.com';

export interface PolymarketMarket {
  condition_id: string;
  question: string;
  market_slug: string;
  end_date_iso: string;
  volume?: number;
  description?: string;
}

export const fetchPolymarketMarkets = async (query = ''): Promise<PolymarketMarket[]> => {
  try {
    const params = new URLSearchParams({
      closed: 'false',
      limit: '20',
      ...(query && { _q: query })
    });
    
    const response = await fetch(`${POLYMARKET_API}/markets?${params}`);
    if (!response.ok) throw new Error('Failed to fetch markets');
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return [];
  }
};

export const fetchMarketByConditionId = async (conditionId: string): Promise<PolymarketMarket | null> => {
  try {
    const response = await fetch(`${POLYMARKET_API}/markets?condition_id=${conditionId}`);
    if (!response.ok) throw new Error('Market not found');
    
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
};

export const checkMarketResolution = async (conditionId: string): Promise<{ resolved: boolean; outcome?: boolean }> => {
  try {
    const market = await fetchMarketByConditionId(conditionId);
    if (!market) return { resolved: false };
    
    // Check if market has resolved
    // Note: Polymarket API structure may vary, adjust accordingly
    return {
      resolved: (market as any).closed || false,
      outcome: (market as any).outcome,
    };
  } catch (error) {
    console.error('Error checking market resolution:', error);
    return { resolved: false };
  }
};