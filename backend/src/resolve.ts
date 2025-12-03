import { validateConfig } from './config';
import { checkAndResolveAll } from './services/oracle';

/**
 * One-time resolve script
 * Run with: npm run resolve
 */
async function resolveAll() {
    console.log('🚀 Resolving all ready escrows...\n');

    try {
        validateConfig();

        const { checked, resolved, errors } = await checkAndResolveAll();

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESOLUTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total checked: ${checked}`);
        console.log(`Successfully resolved: ${resolved.length}`);
        console.log(`Errors: ${errors.length}`);
        console.log('='.repeat(60) + '\n');

        if (resolved.length > 0) {
            console.log('✅ Successfully resolved escrows:');
            resolved.forEach(r => {
                console.log(`\n  Escrow ${r.escrowId}:`);
                console.log(`    Market: "${r.marketQuestion}"`);
                console.log(`    Outcome: ${r.outcome}`);
                console.log(`    TX Hash: ${r.txHash}`);
            });
            console.log('');
        }

        if (errors.length > 0) {
            console.log('❌ Errors:');
            errors.forEach(e => {
                console.log(`\n  Escrow ${e.escrowId}:`);
                console.log(`    Error: ${e.error}`);
            });
            console.log('');
        }

        if (resolved.length === 0 && errors.length === 0) {
            console.log('✨ No escrows were ready to resolve.\n');
        }

    } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

resolveAll();