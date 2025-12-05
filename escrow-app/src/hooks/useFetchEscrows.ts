'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, ESCROW_ABI } from '@/lib/contracts';
import { fetchMarketByConditionId } from '@/lib/polymarket';

export interface Escrow {
  id: number;
  depositor: string;
  beneficiary: string;
  amountA: bigint;
  amountB: bigint;
  marketId: string;
  expectedOutcomeYes: boolean;
  status: number;
  createdAt: number;
  beneficiaryAccepted: boolean;
  market?: any;
}

export function useFetchEscrows(address: string | undefined) {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchEscrows = async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get escrow count
      const escrowCount = await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'escrowCount',
      }) as bigint;

      const count = Number(escrowCount);
      const fetchedEscrows: Escrow[] = [];

      // Fetch each escrow
      for (let i = 0; i < count; i++) {
        try {
          const escrowData = await publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: 'getEscrow',
            args: [BigInt(i)],
          }) as any;

          // Filter for escrows where user is depositor or beneficiary
          const isRelevant =
            escrowData.depositor.toLowerCase() === address.toLowerCase() ||
            escrowData.beneficiary.toLowerCase() === address.toLowerCase();

          if (isRelevant) {
            const escrow: Escrow = {
              id: i,
              depositor: escrowData.depositor,
              beneficiary: escrowData.beneficiary,
              amountA: escrowData.amountA,
              amountB: escrowData.amountB,
              marketId: escrowData.marketId,
              expectedOutcomeYes: escrowData.expectedOutcomeYes,
              status: Number(escrowData.status),
              createdAt: Number(escrowData.createdAt),
              beneficiaryAccepted: escrowData.beneficiaryAccepted,
            };

            // Fetch market data
            try {
              const market = await fetchMarketByConditionId(escrowData.marketId);
              escrow.market = market;
            } catch (error) {
              console.error(`Error fetching market ${escrowData.marketId}:`, error);
            }

            fetchedEscrows.push(escrow);
          }
        } catch (error) {
          console.error(`Error fetching escrow ${i}:`, error);
        }
      }

      // Sort by creation date (newest first)
      fetchedEscrows.sort((a, b) => b.createdAt - a.createdAt);
      setEscrows(fetchedEscrows);
    } catch (error) {
      console.error('Error fetching escrows:', error);
      setEscrows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();

    // Poll for new escrows every 10 seconds
    const interval = setInterval(fetchEscrows, 10000);
    return () => clearInterval(interval);
  }, [address, publicClient]);

  return { escrows, isLoading, refetch: fetchEscrows };
}