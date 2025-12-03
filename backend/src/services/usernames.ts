import { Address } from 'viem';
import { publicClient } from './escrow';
import { config } from '../config';
import EscrowABI from '../contracts/ConditionalEscrow.json';

/**
 * Get username for an address from contract
 */
export async function getUsername(address: Address): Promise<string | null> {
    try {
        const username = await publicClient.readContract({
            address: config.escrowAddress,
            abi: EscrowABI,
            functionName: 'usernames',
            args: [address],
        }) as string;

        return username && username.length > 0 ? username : null;
    } catch (error) {
        console.error(`Error fetching username for ${address}:`, error);
        return null;
    }
}

/**
 * Get usernames for multiple addresses
 */
export async function getUsernames(addresses: Address[]): Promise<Map<Address, string>> {
    const usernameMap = new Map<Address, string>();

    // Fetch in parallel
    const results = await Promise.allSettled(
        addresses.map(addr => getUsername(addr))
    );

    addresses.forEach((address, index) => {
        const result = results[index];
        if (result.status === 'fulfilled' && result.value) {
            usernameMap.set(address, result.value);
        }
    });

    return usernameMap;
}

/**
 * Get unique addresses from events and fetch their usernames
 */
export async function fetchAllUsernames(events: {
    created: Array<{ depositor: Address; beneficiary: Address }>;
    resolved: Array<{ beneficiary: Address }>;
    refunded: Array<{ depositor: Address }>;
}): Promise<Map<Address, string>> {

    // Collect all unique addresses
    const addresses = new Set<Address>();

    events.created.forEach(e => {
        addresses.add(e.depositor);
        addresses.add(e.beneficiary);
    });

    events.resolved.forEach(e => {
        addresses.add(e.beneficiary);
    });

    events.refunded.forEach(e => {
        addresses.add(e.depositor);
    });

    // Fetch usernames
    return getUsernames(Array.from(addresses));
}

/**
 * Format address with username if available
 */
export function formatAddressWithUsername(
    address: Address,
    usernameMap?: Map<Address, string>
): string {
    const username = usernameMap?.get(address);
    if (username) {
        return username;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}