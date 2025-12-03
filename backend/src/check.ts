import { validateConfig } from './config';
import { getResolvableEscrows } from './services/oracle';
import { getActiveEscrows } from './services/escrow';

/**
 * One-time check script
 * Run with: npm run check
 */
async function check() {
    console.log('🔍 Checking for resolvable escrows...\n');

    try {
        validateConfig();

        // Get all active escrows
        const activeEscrows = await getActiveEscrows();
        console.log(`📋 Active Escrows: ${activeEscrows.length}\n`);

        if (activeEscrows.length === 0) {
            console.log('No active escrows found.');
            return;
        }

        // Show active escrows
        console.log('Active Escrows:');
        activeEscrows.forEach(escrow => {
            console.log(`  ID ${escrow.id}:`);
            console.log(`    Market: ${escrow.polymarketId}`);
            console.log(`    Amount: ${escrow.amount.toString()} (USDC units)`);
            console.log(`    Condition: ${escrow.yesOutcome ? 'YES' : 'NO'}`);
            console.log('');
        });

        // Get resolvable escrows
        const resolvable = await getResolvableEscrows();

        if (resolvable.length === 0) {
            console.log('✅ No escrows ready to resolve.\n');
        } else {
            console.log(`🎯 Found ${resolvable.length} escrow(s) ready to resolve:\n`);

            resolvable.forEach(r => {
                console.log(`  Escrow ${r.escrowId}:`);
                console.log(`    Question: "${r.marketQuestion}"`);
                console.log(`    Outcome: ${r.currentOutcome}`);
                console.log('');
            });

            console.log('💡 Run "npm run start" to automatically resolve these escrows.');
        }

    } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

check();