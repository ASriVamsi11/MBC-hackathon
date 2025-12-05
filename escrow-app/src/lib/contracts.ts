// Contract addresses on Base Sepolia
export const CONTRACT_ADDRESS = '0xdD41Cab7a9Bf25724253Caf5e7e32497C643BE9d';
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Escrow Contract ABI - Updated to match ConditionalEscrow.sol (Option 1: Symmetric Escrow)
export const ESCROW_ABI = [
  {
    name: 'escrowCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'beneficiary', type: 'address' },
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'marketId', type: 'string' },
      { name: 'expectedOutcomeYes', type: 'bool' },
    ],
    name: 'createEscrow',
    outputs: [{ name: 'escrowId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'acceptEscrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'getEscrow',
    outputs: [
      {
        components: [
          { name: 'depositor', type: 'address' },
          { name: 'beneficiary', type: 'address' },
          { name: 'amountA', type: 'uint256' },
          { name: 'amountB', type: 'uint256' },
          { name: 'marketId', type: 'string' },
          { name: 'expectedOutcomeYes', type: 'bool' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'beneficiaryAccepted', type: 'bool' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserStats',
    outputs: [
      {
        components: [
          { name: 'totalWon', type: 'uint256' },
          { name: 'totalLost', type: 'uint256' },
          { name: 'escrowsCreated', type: 'uint256' },
          { name: 'escrowsWon', type: 'uint256' },
          { name: 'escrowsLost', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'emergencyRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'escrowId', type: 'uint256' },
      { indexed: true, name: 'depositor', type: 'address' },
      { indexed: true, name: 'beneficiary', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'marketId', type: 'string' },
      { indexed: false, name: 'expectedOutcomeYes', type: 'bool' },
    ],
    name: 'EscrowCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'escrowId', type: 'uint256' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'marketResolvedYes', type: 'bool' },
    ],
    name: 'EscrowResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'username', type: 'string' },
    ],
    name: 'UsernameSet',
    type: 'event',
  },
] as const;

// USDC Contract ABI (minimal)
export const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;