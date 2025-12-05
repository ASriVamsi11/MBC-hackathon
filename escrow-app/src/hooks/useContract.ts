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
    // Approve depositor's amount
    await approveUSDC(params.amountA);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const amountABigInt = parseUSDC(params.amountA);
    const amountBBigInt = parseUSDC(params.amountB);

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

  const setUsername = async (username: string) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'setUsername',
      args: [username],
    });

    return hash;
  };

  return {
    approveUSDC,
    createEscrow,
    acceptEscrow,
    emergencyRefund,
    setUsername,
  };
}