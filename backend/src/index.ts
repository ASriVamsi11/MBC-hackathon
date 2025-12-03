import { config, validateConfig } from './config';
import { getOracleAddress } from './services/escrow';
import { checkAndResolveAll } from './services/oracle';

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
 * Start the oracle service
 */
async function start() {
    console.log('\n='.repeat(60));
    console.log('🤖 ORACLE SERVICE STARTED');
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

    // Initial check
    await monitorAndResolve();

    // Set up interval
    setInterval(monitorAndResolve, config.checkInterval);
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