export const formatAddress = (address: string | undefined): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTime = (timestamp: number): string => {
  const diff = timestamp * 1000 - Date.now();
  if (diff < 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  return `in ${hours}h`;
};

export const formatUSDC = (amount: number | bigint): string => {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return (num / 1e6).toFixed(2);
};

export const parseUSDC = (amount: string): bigint => {
  return BigInt(Math.floor(parseFloat(amount) * 1e6));
};