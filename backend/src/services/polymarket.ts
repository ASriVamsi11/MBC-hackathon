import { config } from '../config';

export interface PolymarketMarket {
    id: string;
    question: string;
    description: string;
    closed: boolean;
    resolved: boolean;
    outcome?: string; // "Yes", "No", or undefined if not resolved
    end_date_iso: string;
}

/**
 * Fetch a specific market from Polymarket Gamma API
 */
export async function getMarket(marketId: string): Promise<PolymarketMarket | null> {
    try {
        const url = `${config.polymarketApiUrl}/markets/${marketId}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Market ${marketId} not found`);
                return null;
            }
            throw new Error(`Polymarket API error: ${response.status}`);
        }

        const market = await response.json();
        return market as PolymarketMarket;

    } catch (error) {
        console.error(`Error fetching market ${marketId}:`, error);
        return null;
    }
}

/**
 * Check if a market has resolved
 */
export function isMarketResolved(market: PolymarketMarket): boolean {
    return market.resolved && market.outcome !== undefined;
}

/**
 * Get the outcome as a boolean (YES = true, NO = false)
 */
export function getOutcomeAsBoolean(market: PolymarketMarket): boolean | null {
    if (!market.outcome) return null;
    return market.outcome.toLowerCase() === 'yes';
}

/**
 * Fetch multiple markets in parallel
 */
export async function getMarkets(marketIds: string[]): Promise<Map<string, PolymarketMarket>> {
    const results = new Map<string, PolymarketMarket>();

    const promises = marketIds.map(async (id) => {
        const market = await getMarket(id);
        if (market) {
            results.set(id, market);
        }
    });

    await Promise.all(promises);

    return results;
}