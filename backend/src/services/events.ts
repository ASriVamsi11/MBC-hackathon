import { publicClient } from './escrow';
import { config } from '../config';
import { Address, parseAbiItem } from 'viem';
import EscrowABI from '../contracts/ConditionalEscrow.json';

export interface EscrowCreatedEvent {
    escrowId: string;
    depositor: Address;
    beneficiary: Address;
    amount: string;
    polymarketId: string;
    yesOutcome: boolean;
    timestamp: number;
    blockNumber: bigint;
    txHash: string;
}

export interface EscrowResolvedEvent {
    escrowId: string;
    beneficiary: Address;
    amount: string;
    outcome: boolean;
    timestamp: number;
    blockNumber: bigint;
    txHash: string;
}

export interface EscrowRefundedEvent {
    escrowId: string;
    depositor: Address;
    amount: string;
    timestamp: number;
    blockNumber: bigint;
    txHash: string;
}

/**
 * Get EscrowCreated events
 */
export async function getEscrowCreatedEvents(
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest'
): Promise<EscrowCreatedEvent[]> {
    try {
        const logs = await publicClient.getLogs({
            address: config.escrowAddress,
            event: parseAbiItem('event EscrowCreated(uint256 indexed escrowId, address indexed depositor, address indexed beneficiary, uint256 amount, string polymarketId, bool yesOutcome)'),
            fromBlock,
            toBlock,
        });

        const events: EscrowCreatedEvent[] = [];

        for (const log of logs) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

            events.push({
                escrowId: log.args.escrowId?.toString() || '0',
                depositor: log.args.depositor!,
                beneficiary: log.args.beneficiary!,
                amount: log.args.amount?.toString() || '0',
                polymarketId: log.args.polymarketId || '',
                yesOutcome: log.args.yesOutcome || false,
                timestamp: Number(block.timestamp),
                blockNumber: log.blockNumber,
                txHash: log.transactionHash,
            });
        }

        return events.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Error fetching EscrowCreated events:', error);
        return [];
    }
}

/**
 * Get EscrowResolved events
 */
export async function getEscrowResolvedEvents(
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest'
): Promise<EscrowResolvedEvent[]> {
    try {
        const logs = await publicClient.getLogs({
            address: config.escrowAddress,
            event: parseAbiItem('event EscrowResolved(uint256 indexed escrowId, address indexed beneficiary, uint256 amount, bool outcome)'),
            fromBlock,
            toBlock,
        });

        const events: EscrowResolvedEvent[] = [];

        for (const log of logs) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

            events.push({
                escrowId: log.args.escrowId?.toString() || '0',
                beneficiary: log.args.beneficiary!,
                amount: log.args.amount?.toString() || '0',
                outcome: log.args.outcome || false,
                timestamp: Number(block.timestamp),
                blockNumber: log.blockNumber,
                txHash: log.transactionHash,
            });
        }

        return events.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Error fetching EscrowResolved events:', error);
        return [];
    }
}

/**
 * Get EscrowRefunded events
 */
export async function getEscrowRefundedEvents(
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest'
): Promise<EscrowRefundedEvent[]> {
    try {
        const logs = await publicClient.getLogs({
            address: config.escrowAddress,
            event: parseAbiItem('event EscrowRefunded(uint256 indexed escrowId, address indexed depositor, uint256 amount)'),
            fromBlock,
            toBlock,
        });

        const events: EscrowRefundedEvent[] = [];

        for (const log of logs) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

            events.push({
                escrowId: log.args.escrowId?.toString() || '0',
                depositor: log.args.depositor!,
                amount: log.args.amount?.toString() || '0',
                timestamp: Number(block.timestamp),
                blockNumber: log.blockNumber,
                txHash: log.transactionHash,
            });
        }

        return events.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Error fetching EscrowRefunded events:', error);
        return [];
    }
}

/**
 * Get all events (created, resolved, refunded)
 */
export async function getAllEvents(
    fromBlock: bigint = 0n,
    toBlock: bigint | 'latest' = 'latest'
) {
    const [created, resolved, refunded] = await Promise.all([
        getEscrowCreatedEvents(fromBlock, toBlock),
        getEscrowResolvedEvents(fromBlock, toBlock),
        getEscrowRefundedEvents(fromBlock, toBlock),
    ]);

    return {
        created,
        resolved,
        refunded,
    };
}

/**
 * Get latest block number
 */
export async function getLatestBlockNumber(): Promise<bigint> {
    const block = await publicClient.getBlock();
    return block.number;
}