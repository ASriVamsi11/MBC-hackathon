'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, ExternalLink, Copy, CheckCircle, XCircle, RefreshCw, Loader } from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress, formatTime, formatUSDC } from '@/lib/utils';

interface ChallengeCardProps {
  escrow: any;
  currentUser: string;
  onRefetch: () => void;
}

export default function ChallengeCard({ escrow, currentUser, onRefetch }: ChallengeCardProps) {
  const contract = useContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const { username: partyAUsername } = useUsername(escrow.partyA);
  const { username: partyBUsername } = useUsername(escrow.partyB);

  const isPartyA = currentUser.toLowerCase() === escrow.partyA.toLowerCase();
  const userAmount = isPartyA ? escrow.amountA : escrow.amountB;
  const userOutcome = isPartyA ? escrow.outcomeForA : !escrow.outcomeForA;

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await contract.acceptEscrow(escrow.id, escrow.amountB);
      showNotification('Challenge accepted!');
      onRefetch();
    } catch (error: any) {
      showNotification(error.message || 'Failed to accept');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await contract.cancelEscrow(escrow.id);
      showNotification('Challenge cancelled!');
      onRefetch();
    } catch (error: any) {
      showNotification(error.message || 'Failed to cancel');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/challenge/${escrow.id}`;
    navigator.clipboard.writeText(link);
    showNotification('Link copied!');
  };

  const getStatusBadge = () => {
    if (escrow.status === 0) return { text: 'Waiting', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> };
    if (escrow.status === 1) return { text: 'Active', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> };
    if (escrow.status === 2) return { text: 'Resolved', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={14} /> };
    if (escrow.status === 3) return { text: 'Refunded', color: 'bg-gray-100 text-gray-700', icon: <XCircle size={14} /> };
    if (escrow.status === 4) return { text: 'Expired', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> };
    return { text: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: null };
  };

  const status = getStatusBadge();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      {notification && (
        <div className="mb-4 p-3 bg-indigo-100 text-indigo-900 rounded-lg text-sm font-medium">
          {notification}
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link href={`/challenge/${escrow.id}`} className="hover:text-indigo-600 transition">
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">
              {escrow.market?.question || 'Loading market...'}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>ID: #{escrow.id}</span>
            <button onClick={copyLink} className="hover:text-gray-700">
              <Copy size={14} />
            </button>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
          {status.icon}
          {status.text}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`rounded-lg p-4 ${isPartyA ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'}`}>
          <div className="text-sm text-gray-600 mb-1">
            {isPartyA ? 'You' : 'Challenger'}
          </div>
          <div className="font-semibold text-gray-900">
            {userOutcome ? 'Yes' : 'No'} - ${formatUSDC(userAmount)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {partyAUsername || formatAddress(escrow.partyA)}
          </div>
        </div>

        <div className={`rounded-lg p-4 ${!isPartyA ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'}`}>
          <div className="text-sm text-gray-600 mb-1">
            {!isPartyA ? 'You' : 'Opponent'}
          </div>
          <div className="font-semibold text-gray-900">
            {!userOutcome ? 'Yes' : 'No'} - ${formatUSDC(isPartyA ? escrow.amountB : escrow.amountA)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {partyBUsername || formatAddress(escrow.partyB)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            Expires {formatTime(escrow.expiryTime)}
          </span>
          {escrow.market?.market_slug && (
            
              <a href={`https://polymarket.com/event/${escrow.market.market_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
            >
              Polymarket <ExternalLink size={14} />
            </a>
          )}
        </div>

        <div className="flex gap-2">
          {escrow.status === 0 && !isPartyA && (
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
            >
              {isProcessing ? <Loader size={16} className="animate-spin" /> : 'Accept'}
            </button>
          )}
          {escrow.status === 0 && isPartyA && (
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
            >
              {isProcessing ? <Loader size={16} className="animate-spin" /> : 'Cancel'}
            </button>
          )}
          {escrow.status === 1 && (
            <button
              onClick={onRefetch}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}
          <Link
            href={`/challenge/${escrow.id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}