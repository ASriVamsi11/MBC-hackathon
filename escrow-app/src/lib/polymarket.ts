const API_ROUTE = '/api/polymarket';

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
      ...(query && { query: query })
    });

    console.log('🔍 Client: Fetching markets with query:', query);

    const response = await fetch(`${API_ROUTE}?${params}`);

    console.log('📨 Client: Response status:', response.status);

    if (!response.ok) {
      console.error('❌ Client: API route failed, status:', response.status);
      const errorData = await response.json();
      console.error('❌ Client: Error details:', errorData);
      return [];
    }

    const data = await response.json();
    console.log('✅ Client: Raw API data:', data);

    if (!Array.isArray(data)) {
      console.error('❌ Client: Expected array, got:', typeof data);
      return [];
    }

    // Transform the Gamma API response to match your interface
    const markets = data.map((market: any) => ({
      condition_id: market.conditionId,
      question: market.question,
      market_slug: market.slug,
      end_date_iso: market.endDate,
      volume: parseFloat(market.volume || '0'),
      description: market.description,
    }));

    console.log('✅ Client: Transformed', markets.length, 'markets');
    return markets;
  } catch (error) {
    console.error('❌ Client: Error fetching Polymarket markets:', error);
    return [];
  }
};

export const fetchMarketByConditionId = async (conditionId: string): Promise<PolymarketMarket | null> => {
  try {
    const response = await fetch(`${API_ROUTE}?conditionId=${conditionId}`);

    if (!response.ok) {
      console.warn('Failed to fetch market:', response.status);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const market = data[0];
    return {
      condition_id: market.conditionId,
      question: market.question,
      market_slug: market.slug,
      end_date_iso: market.endDate,
      volume: parseFloat(market.volume || '0'),
      description: market.description,
    };
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
};

export const checkMarketResolution = async (conditionId: string): Promise<{ resolved: boolean; outcome?: boolean }> => {
  try {
    const market = await fetchMarketByConditionId(conditionId);
    if (!market) return { resolved: false };

    // Check if market is closed
    return {
      resolved: (market as any).closed || false,
      outcome: (market as any).outcome,
    };
  } catch (error) {
    console.error('Error checking market resolution:', error);
    return { resolved: false };
  }
};

// const GAMMA_API = 'https://gamma-api.polymarket.com';

// export interface PolymarketMarket {
//   condition_id: string;
//   question: string;
//   market_slug: string;
//   end_date_iso: string;
//   volume?: number;
//   description?: string;
// }

// export const fetchPolymarketMarkets = async (query = ''): Promise<PolymarketMarket[]> => {
//   try {
//     const params = new URLSearchParams({
//       closed: 'false',
//       limit: '20',
//       ...(query && { _q: query })
//     });

//     console.log('🔍 Fetching from:', `${GAMMA_API}/markets?${params}`);

//     const response = await fetch(`${GAMMA_API}/markets?${params}`, {
//       headers: {
//         'Accept': 'application/json',
//       },
//     });

//     console.log('📨 Response status:', response.status);

//     if (!response.ok) {
//       console.error('❌ API failed with status:', response.status);
//       return [];
//     }

//     const data = await response.json();
//     console.log('✅ Raw API data:', data);

//     // The Gamma API returns an array of markets directly
//     if (!Array.isArray(data)) {
//       console.error('❌ Expected array, got:', typeof data);
//       return [];
//     }

//     // Transform the Gamma API response to match your interface
//     const markets = data.map((market: any) => ({
//       condition_id: market.conditionId, // Note: Gamma uses 'conditionId' not 'condition_id'
//       question: market.question,
//       market_slug: market.slug,
//       end_date_iso: market.endDate, // Note: Gamma uses 'endDate' not 'end_date_iso'
//       volume: parseFloat(market.volume || '0'),
//       description: market.description,
//     }));

//     console.log('✅ Transformed markets:', markets.length, markets);
//     return markets;
//   } catch (error) {
//     console.error('❌ Error fetching Polymarket markets:', error);
//     return [];
//   }
// };

// export const fetchMarketByConditionId = async (conditionId: string): Promise<PolymarketMarket | null> => {
//   try {
//     const response = await fetch(`${GAMMA_API}/markets?conditionId=${conditionId}`, {
//       headers: {
//         'Accept': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       console.warn('Failed to fetch market:', response.status);
//       return null;
//     }

//     const data = await response.json();

//     if (!Array.isArray(data) || data.length === 0) {
//       return null;
//     }

//     const market = data[0];
//     return {
//       condition_id: market.conditionId,
//       question: market.question,
//       market_slug: market.slug,
//       end_date_iso: market.endDate,
//       volume: parseFloat(market.volume || '0'),
//       description: market.description,
//     };
//   } catch (error) {
//     console.error('Error fetching market:', error);
//     return null;
//   }
// };

// export const checkMarketResolution = async (conditionId: string): Promise<{ resolved: boolean; outcome?: boolean }> => {
//   try {
//     const market = await fetchMarketByConditionId(conditionId);
//     if (!market) return { resolved: false };

//     // Check if market is closed
//     return {
//       resolved: (market as any).closed || false,
//       outcome: (market as any).outcome,
//     };
//   } catch (error) {
//     console.error('Error checking market resolution:', error);
//     return { resolved: false };
//   }
// };