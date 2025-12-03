import { config, validateConfig } from './config';
import { getOracleAddress } from './services/escrow';
import { checkAndResolveAll } from './services/oracle';
import { startEventIndexer } from './workers/event-indexer';
import { startApiServer } from './api';

/**
 * Main monitoring loop
 */
async function monitorAndResolve() {
    console.log('🔍 Starting resolution check...');

    try {
        const { checked, resolved, errors } = await checkAndResolveAll();

        console.log(`\n📊 Check complete:`);
        console.log(`   Checked: ${checked} escrow(s)`);
        console.log(`   Resolved: ${resolved.length}`);
        console.log(`   Errors: ${errors.length}`);

        if (resolved.length > 0) {
            console.log(`\n✅ Successfully resolved:`);
            resolved.forEach(r => {
                console.log(`   Escrow ${r.escrowId}: "${r.marketQuestion}" = ${r.outcome}`);
                console.log(`   TX: ${r.txHash}`);
            });
        }

        if (errors.length > 0) {
            console.log(`\n❌ Errors:`);
            errors.forEach(e => {
                console.log(`   Escrow ${e.escrowId}: ${e.error}`);
            });
        }

    } catch (error) {
        console.error('Error in monitoring loop:', error);
    }

    console.log(`\nNext check in ${config.checkInterval / 1000} seconds\n`);
}

/**
 * Start the combined backend service
 */
async function start() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 BACKEND SERVICE STARTED');
    console.log('='.repeat(60));

    // Validate configuration
    try {
        validateConfig();
    } catch (error: any) {
        console.error('❌ Configuration error:', error.message);
        process.exit(1);
    }

    console.log(`\n📍 Oracle Address: ${getOracleAddress()}`);
    console.log(`🔗 Escrow Contract: ${config.escrowAddress}`);
    console.log(`⏰ Check Interval: ${config.checkInterval / 1000}s`);
    console.log(`🌐 RPC URL: ${config.rpcUrl}`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Start Event Indexer (social features)
    console.log('📇 Starting Event Indexer...');
    startEventIndexer(config.checkInterval);

    // Start REST API Server (social features)
    console.log('🌐 Starting REST API Server...');
    startApiServer(3001);

    // Initial oracle check
    console.log('🔍 Starting Oracle Service...\n');
    await monitorAndResolve();

    // Set up oracle interval
    setInterval(monitorAndResolve, config.checkInterval);

    console.log('✅ All services running!\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Oracle service stopping...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Oracle service stopping...');
    process.exit(0);
});

// Start the service
start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});