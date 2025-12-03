'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, ESCROW_ABI } from '@/lib/contracts';

export function useUsername(address: string | undefined) {
  const { data: username, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'usernames',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    username: username as string | undefined,
    refetch,
  };
}