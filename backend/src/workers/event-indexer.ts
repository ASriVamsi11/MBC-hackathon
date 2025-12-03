import { getAllEvents, getLatestBlockNumber } from '../services/events';
import { calculateLeaderboard, calculateGlobalStats } from '../services/leaderboard';
import { formatActivityFeed } from '../services/activity';
import { fetchAllUsernames } from '../services/usernames';
import { calculateAllUserStats } from '../services/stats';
import { getMarket } from '../services/polymarket';
import { cache } from '../cache';
import { config } from '../config';

/**
 * Index events and update cache
 */
export async function indexEvents() {
    console.log('📇 Starting event indexing...');

    try {
        // Get current block
        const latestBlock = await getLatestBlockNumber();

        // Determine starting block (first time vs. incremental)
        const fromBlock = cache.lastIndexedBlock > 0n
            ? cache.lastIndexedBlock + 1n
            : latestBlock - 10000n; // Start from 10k blocks ago on first run

        console.log(`   Indexing from block ${fromBlock} to ${latestBlock}`);

        // Fetch all events
        const events = await getAllEvents(fromBlock, latestBlock);

        console.log(`   Found ${events.created.length} created, ${events.resolved.length} resolved, ${events.refunded.length} refunded`);

        // Merge with existing events if incremental update
        if (cache.lastIndexedBlock > 0n) {
            events.created = [...cache.createdEvents, ...events.created];
            events.resolved = [...cache.resolvedEvents, ...events.resolved];
            events.refunded = [...cache.refundedEvents, ...events.refunded];
        }

        // Update events cache
        cache.updateEvents(events);
        cache.lastIndexedBlock = latestBlock;

        // Fetch usernames for all participants
        console.log('   Fetching usernames...');
        const usernames = await fetchAllUsernames(events);
        cache.updateUsernames(usernames);

        // Fetch market questions for created escrows
        console.log('   Fetching market questions...');
        const uniqueMarketIds = [...new Set(events.created.map(e => e.polymarketId))];
        for (const marketId of uniqueMarketIds) {
            if (!cache.getMarketQuestion(marketId)) {
                const market = await getMarket(marketId);
                if (market) {
                    cache.addMarketQuestion(marketId, market.question);
                }
            }
        }

        // Calculate leaderboard
        console.log('   Calculating leaderboard...');
        const leaderboard = calculateLeaderboard(events.resolved, usernames);
        cache.updateLeaderboard(leaderboard);

        // Format activity feed
        console.log('   Formatting activity feed...');
        const activityFeed = formatActivityFeed(
            events.created,
            events.resolved,
            events.refunded,
            usernames,
            cache.marketQuestions
        );
        cache.updateActivityFeed(activityFeed);

        // Calculate user stats
        console.log('   Calculating user stats...');
        const userStats = calculateAllUserStats(events, usernames);
        cache.updateUserStats(userStats);

        // Calculate global stats
        const globalStats = calculateGlobalStats(events.resolved);

        console.log('✅ Event indexing complete');
        console.log(`   Leaderboard: ${leaderboard.length} entries`);
        console.log(`   Activity Feed: ${activityFeed.length} items`);
        console.log(`   Global Stats: ${globalStats.totalEscrowsResolved} escrows resolved, $${globalStats.totalVolumeUSD.toFixed(2)} volume`);
        console.log();

        return true;
    } catch (error) {
        console.error('❌ Error indexing events:', error);
        return false;
    }
}

/**
 * Start periodic event indexing
 */
export function startEventIndexer(intervalMs: number = 60000) {
    console.log(`🔄 Starting event indexer (every ${intervalMs / 1000}s)`);

    // Initial index
    indexEvents();

    // Periodic updates
    setInterval(indexEvents, intervalMs);
}

/**
 * Index events once and exit
 */
export async function indexEventsOnce() {
    await indexEvents();
    process.exit(0);
}