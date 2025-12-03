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
    partyB: string;
    amountA: string;
    amountB: string;
    conditionId: string;
    outcomeForA: boolean;
    duration: number;
  }) => {
    await approveUSDC(params.amountA);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const amountABigInt = parseUSDC(params.amountA);
    const amountBBigInt = parseUSDC(params.amountB);
    const conditionIdBytes32 = params.conditionId.padEnd(66, '0') as `0x${string}`;

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'createEscrow',
      args: [
        params.partyB as `0x${string}`,
        amountABigInt,
        amountBBigInt,
        conditionIdBytes32,
        params.outcomeForA,
        BigInt(params.duration),
      ],
    });

    return Math.floor(Math.random() * 10000);
  };

  const acceptEscrow = async (escrowId: number, amount: bigint) => {
    const amountStr = (Number(amount) / 1e6).toFixed(2);
    await approveUSDC(amountStr);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'acceptEscrow',
      args: [BigInt(escrowId)],
    });

    return hash;
  };

  const cancelEscrow = async (escrowId: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'cancelUnaccepted',
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

  const getEscrow = async (escrowId: number) => {
    return null;
  };

  return {
    approveUSDC,
    createEscrow,
    acceptEscrow,
    cancelEscrow,
    setUsername,
    getEscrow,
  };
}