'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, ESCROW_ABI } from '@/lib/contracts';
import { fetchMarketByConditionId } from '@/lib/polymarket';

export interface Escrow {
  id: number;
  partyA: string;
  partyB: string;
  amountA: bigint;
  amountB: bigint;
  conditionId: string;
  outcomeForA: boolean;
  createdAt: number;
  expiryTime: number;
  status: number;
  market?: any;
  winner?: string;
}

export function useFetchEscrows(address: string | undefined) {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get total escrow count
  const { data: escrowCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'escrowCount',
    query: {
      enabled: !!address,
    },
  });

  const fetchEscrows = async () => {
    if (!address || !escrowCount) return;
    
    setIsLoading(true);
    try {
      const count = Number(escrowCount);
      const fetchedEscrows: Escrow[] = [];

      // Fetch each escrow
      // Note: In production, you'd batch these calls or use a subgraph
      for (let i = 0; i < count; i++) {
        try {
          // This is a simplified version - you'd need to implement actual contract reading
          // Using wagmi's useReadContract in a loop isn't ideal, but works for small numbers
          
          // For now, add mock data
          // TODO: Replace with actual contract reads
        } catch (error) {
          console.error(`Error fetching escrow ${i}:`, error);
        }
      }

      // Filter escrows where user is partyA or partyB
      const userEscrows = fetchedEscrows.filter(
        e => 
          e.partyA.toLowerCase() === address.toLowerCase() || 
          e.partyB.toLowerCase() === address.toLowerCase()
      );

      // Enrich with market data
      const enrichedEscrows = await Promise.all(
        userEscrows.map(async (escrow) => {
          const market = await fetchMarketByConditionId(escrow.conditionId);
          return { ...escrow, market };
        })
      );

      setEscrows(enrichedEscrows);
    } catch (error) {
      console.error('Error fetching escrows:', error);
      setEscrows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, [address, escrowCount]);

  return { escrows, isLoading, refetch: fetchEscrows };
}

// Note: For production, consider using The Graph (subgraph) to index events
// This would be much more efficient than reading directly from the contract