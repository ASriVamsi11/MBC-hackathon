import { getActiveEscrows, resolveEscrow, Escrow } from './escrow';
import { getMarket, isMarketResolved, getOutcomeAsBoolean } from './polymarket';

export interface ResolutionResult {
    escrowId: bigint;
    marketQuestion: string;
    outcome: string;
    success: boolean;
    txHash?: string;
    error?: string;
}

/**
 * Check all active escrows and resolve those with resolved markets
 */
export async function checkAndResolveAll(): Promise<{
    checked: number;
    resolved: ResolutionResult[];
    errors: ResolutionResult[];
}> {
    console.log('🔍 Checking for escrows to resolve...');

    const activeEscrows = await getActiveEscrows();
    console.log(`Found ${activeEscrows.length} active escrow(s)`);

    const resolved: ResolutionResult[] = [];
    const errors: ResolutionResult[] = [];

    for (const escrow of activeEscrows) {
        try {
            const result = await checkAndResolveEscrow(escrow);

            if (result) {
                if (result.success) {
                    resolved.push(result);
                } else {
                    errors.push(result);
                }

                // Add delay between transactions to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

        } catch (error: any) {
            console.error(`Error processing escrow ${escrow.id}:`, error);
            errors.push({
                escrowId: escrow.id,
                marketQuestion: 'Unknown',
                outcome: 'Error',
                success: false,
                error: error.message,
            });
        }
    }

    return {
        checked: activeEscrows.length,
        resolved,
        errors,
    };
}

/**
 * Check and resolve a single escrow if its market is resolved
 */
export async function checkAndResolveEscrow(
    escrow: Escrow
): Promise<ResolutionResult | null> {

    // Fetch market from Polymarket
    const market = await getMarket(escrow.polymarketId);

    if (!market) {
        console.log(`⚠️  Could not fetch market ${escrow.polymarketId} for escrow ${escrow.id}`);
        return null;
    }

    // Check if market is resolved
    if (!isMarketResolved(market)) {
        if (market.closed) {
            console.log(`⏳ Market "${market.question}" closed but not yet resolved`);
        }
        return null;
    }

    const outcome = getOutcomeAsBoolean(market);

    if (outcome === null) {
        console.log(`⚠️  Market ${escrow.polymarketId} resolved with invalid outcome`);
        return null;
    }

    console.log(`📊 Market resolved: "${market.question}" = ${market.outcome}`);

    // Resolve the escrow
    const result = await resolveEscrow(escrow.id, outcome);

    return {
        escrowId: escrow.id,
        marketQuestion: market.question,
        outcome: market.outcome!,
        success: result.success,
        txHash: result.txHash,
        error: result.error,
    };
}

/**
 * Get summary of escrows ready to resolve
 */
export async function getResolvableEscrows(): Promise<{
    escrowId: bigint;
    marketQuestion: string;
    currentOutcome: string;
    resolved: boolean;
}[]> {
    const activeEscrows = await getActiveEscrows();
    const resolvable = [];

    for (const escrow of activeEscrows) {
        const market = await getMarket(escrow.polymarketId);

        if (market && isMarketResolved(market)) {
            resolvable.push({
                escrowId: escrow.id,
                marketQuestion: market.question,
                currentOutcome: market.outcome!,
                resolved: market.resolved,
            });
        }
    }

    return resolvable;
}