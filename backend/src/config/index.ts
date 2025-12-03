import dotenv from 'dotenv';
import { Address } from 'viem';

// Load environment variables
dotenv.config();

interface Config {
    escrowAddress: Address;
    oraclePrivateKey: Address;
    rpcUrl: string;
    polymarketApiUrl: string;
    checkInterval: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
}

function getEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const config: Config = {
    escrowAddress: getEnvVar('ESCROW_ADDRESS') as Address,
    oraclePrivateKey: getEnvVar('ORACLE_PRIVATE_KEY') as Address,
    rpcUrl: getEnvVar('BASE_SEPOLIA_RPC'),
    polymarketApiUrl: process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com',
    checkInterval: parseInt(process.env.CHECK_INTERVAL || '60000'),
    logLevel: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
};

// Validate configuration
export function validateConfig(): void {
    if (!config.escrowAddress.startsWith('0x')) {
        throw new Error('Invalid ESCROW_ADDRESS format');
    }

    if (!config.oraclePrivateKey.startsWith('0x')) {
        throw new Error('Invalid ORACLE_PRIVATE_KEY format');
    }

    if (config.checkInterval < 10000) {
        console.warn('⚠️  CHECK_INTERVAL is very low. Consider increasing to avoid rate limits.');
    }

    console.log('✅ Configuration validated');
    console.log(`   Escrow Address: ${config.escrowAddress}`);
    console.log(`   RPC URL: ${config.rpcUrl}`);
    console.log(`   Check Interval: ${config.checkInterval / 1000}s`);
}