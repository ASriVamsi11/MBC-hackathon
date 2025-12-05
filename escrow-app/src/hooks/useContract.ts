'use client';

import { useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, USDC_ADDRESS, ESCROW_ABI, USDC_ABI } from '@/lib/contracts';
import { parseUSDC } from '@/lib/utils';

export function useContract() {
  const { writeContractAsync } = useWriteContract();

  const approveUSDC = async (amount: string) => {
    const amountBigInt = parseUSDC(amount);

    const hash = await writeContractAsync({
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS as `0x${string}`, amountBigInt],
    });

    return hash;
  };

  const createEscrow = async (params: {
    beneficiary: string;
    amountA: string;
    amountB: string;
    marketId: string;
    expectedOutcomeYes: boolean;
  }) => {
    const amountABigInt = parseUSDC(params.amountA);
    const amountBBigInt = parseUSDC(params.amountB);

    try {
      // Approve USDC spending for this specific amount
      await approveUSDC(params.amountA);
      // Wait for approval transaction to be mined (critical for paymaster estimation)
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('USDC approval failed:', error);
      throw new Error('Failed to approve USDC. Ensure you have sufficient USDC balance.');
    }

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'createEscrow',
      args: [
        params.beneficiary as `0x${string}`,
        amountABigInt,
        amountBBigInt,
        params.marketId,
        params.expectedOutcomeYes,
      ],
    });

    return hash;
  };

  const acceptEscrow = async (escrowId: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'acceptEscrow',
      args: [BigInt(escrowId)],
    });

    return hash;
  };

  const emergencyRefund = async (escrowId: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'emergencyRefund',
      args: [BigInt(escrowId)],
    });

    return hash;
  };

  return {
    approveUSDC,
    createEscrow,
    acceptEscrow,
    emergencyRefund,
  };
}