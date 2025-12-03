import { createPublicClient, createWalletClient, http, Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../config';

// Import your contract ABI
// You'll need to copy ConditionalEscrow.json from your contracts folder
import EscrowABI from '../contracts/ConditionalEscrow.json';

export interface Escrow {
    id: bigint;
    depositor: Address;
    beneficiary: Address;
    amount: bigint;
    polymarketId: string;
    yesOutcome: boolean;
    isActive: boolean;
    isClaimed: boolean;
    createdAt: bigint;
}

// Initialize blockchain clients
const account = privateKeyToAccount(config.oraclePrivateKey);

export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(config.rpcUrl),
});

export const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(config.rpcUrl),
});

/**
 * Get total number of escrows
 */
export async function getEscrowCount(): Promise<bigint> {
    const count = await publicClient.readContract({
        address: config.escrowAddress,
        abi: EscrowABI,
        functionName: 'escrowCount',
    }) as bigint;

    return count;
}

/**
 * Get a specific escrow by ID
 */
export async function getEscrow(escrowId: bigint): Promise<Escrow> {
    const escrowData = await publicClient.readContract({
        address: config.escrowAddress,
        abi: EscrowABI,
        functionName: 'getEscrow',
        args: [escrowId],
    }) as any;

    return {
        id: escrowId,
        depositor: escrowData.depositor,
        beneficiary: escrowData.beneficiary,
        amount: escrowData.amount,
        polymarketId: escrowData.polymarketId,
        yesOutcome: escrowData.yesOutcome,
        isActive: escrowData.isActive,
        isClaimed: escrowData.isClaimed,
        createdAt: escrowData.createdAt,
    };
}

/**
 * Get all active escrows
 */
export async function getActiveEscrows(): Promise<Escrow[]> {
    const count = await getEscrowCount();
    const activeEscrows: Escrow[] = [];

    for (let i = 0n; i < count; i++) {
        const escrow = await getEscrow(i);

        if (escrow.isActive && !escrow.isClaimed) {
            activeEscrows.push(escrow);
        }
    }

    return activeEscrows;
}

/**
 * Resolve an escrow
 */
export async function resolveEscrow(
    escrowId: bigint,
    outcome: boolean
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        console.log(`Resolving escrow ${escrowId} with outcome: ${outcome ? 'YES' : 'NO'}`);

        const hash = await walletClient.writeContract({
            address: config.escrowAddress,
            abi: EscrowABI,
            functionName: 'resolveEscrow',
            args: [escrowId, outcome],
        });

        console.log(`Transaction submitted: ${hash}`);

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        if (receipt.status === 'success') {
            console.log(`✅ Escrow ${escrowId} resolved successfully`);
            return { success: true, txHash: hash };
        } else {
            console.error(`❌ Transaction failed for escrow ${escrowId}`);
            return { success: false, txHash: hash, error: 'Transaction reverted' };
        }

    } catch (error: any) {
        console.error(`Error resolving escrow ${escrowId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Get oracle address
 */
export function getOracleAddress(): Address {
    return account.address;
}