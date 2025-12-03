'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Clock, ExternalLink, Share2, Copy, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { useUsername } from '@/hooks/useUsername';
import { fetchMarketByConditionId } from '@/lib/polymarket';
import { formatAddress, formatTime, formatUSDC } from '@/lib/utils';

export default function ChallengePage() {
  const params = useParams();
  const escrowId = parseInt(params.id as string);
  const { address, isConnected } = useAccount();
  const contract = useContract();

  const [escrow, setEscrow] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const { username: creatorUsername } = useUsername(escrow?.partyA);
  const { username: opponentUsername } = useUsername(escrow?.partyB);

  useEffect(() => {
    loadChallenge();
  }, [escrowId]);

  const loadChallenge = async () => {
    setIsLoading(true);
    try {
      const escrowData = await contract.getEscrow(escrowId);
      setEscrow(escrowData);

      if (escrowData?.conditionId) {
        const marketData = await fetchMarketByConditionId(escrowData.conditionId);
        setMarket(marketData);
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAccept = async () => {
    if (!isConnected) {
      showNotification('Please connect your wallet', 'error');
      return;
    }

    setIsAccepting(true);
    try {
      await contract.acceptEscrow(escrowId, escrow.amountB);
      showNotification('Challenge accepted successfully!', 'success');
      await loadChallenge();
    } catch (error: any) {
      showNotification(error.message || 'Failed to accept challenge', 'error');
    } finally {
      setIsAccepting(false);
    }
  };

  const shareLink = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showNotification('Link copied to clipboard!', 'success');
  };

  const shareToTwitter = () => {
    const text = `Check out this challenge on ConditionalEscrow! 🎯`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader size={48} className="mx-auto text-indigo-600 mb-4 animate-spin" />
        <p className="text-gray-600">Loading challenge...</p>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Challenge Not Found</h1>
        <p className="text-gray-600">This challenge doesn't exist or has been removed</p>
      </div>
    );
  }

  const isPartyA = address?.toLowerCase() === escrow.partyA.toLowerCase();
  const isPartyB = address?.toLowerCase() === escrow.partyB.toLowerCase();
  const canAccept = isConnected && isPartyB && escrow.status === 0;

  const getStatusBadge = () => {
    if (escrow.status === 0) return { text: 'Waiting for Opponent', color: 'bg-yellow-100 text-yellow-700' };
    if (escrow.status === 1) return { text: 'Active', color: 'bg-green-100 text-green-700' };
    if (escrow.status === 2) return { text: 'Resolved', color: 'bg-blue-100 text-blue-700' };
    if (escrow.status === 3) return { text: 'Refunded', color: 'bg-gray-100 text-gray-700' };
    if (escrow.status === 4) return { text: 'Expired', color: 'bg-red-100 text-red-700' };
    return { text: 'Unknown', color: 'bg-gray-100 text-gray-700' };
  };

  const status = getStatusBadge();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Challenge #{escrowId}</h1>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
          >
            <Copy size={16} />
            Copy Link
          </button>
          <button
            onClick={shareToTwitter}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
          >
            <Share2 size={16} />
            Share on Twitter
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Market Info */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {market?.question || 'Loading market...'}
          </h2>
          {market && (
            <div className="flex items-center gap-4 text-sm opacity-90">
              <span>Volume: ${((market.volume || 0) / 1000000).toFixed(1)}M</span>
              <span>•</span>
              <a 
                href={`https://polymarket.com/event/${market.market_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                View on Polymarket
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Challenge Details */}
        <div className="p-8">
          {/* Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Creator */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
              <div className="text-sm text-green-700 font-semibold mb-2">CHALLENGER</div>
              <div className="text-xl font-bold text-gray-900 mb-2">
                {creatorUsername || formatAddress(escrow.partyA)}
              </div>
              <div className="text-sm text-gray-600 mb-4">{formatAddress(escrow.partyA)}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">${formatUSDC(escrow.amountA)}</span>
                <span className="text-sm text-gray-600">USDC</span>
              </div>
              <div className="mt-3 px-3 py-1 bg-green-600 text-white rounded-lg inline-block text-sm font-semibold">
                {escrow.outcomeForA ? 'YES' : 'NO'}
              </div>
            </div>

            {/* Opponent */}
            <div className={`bg-gradient-to-br rounded-xl p-6 border-2 ${
              isPartyB 
                ? 'from-purple-50 to-purple-100 border-purple-200' 
                : 'from-red-50 to-red-100 border-red-200'
            }`}>
              <div className={`text-sm font-semibold mb-2 ${isPartyB ? 'text-purple-700' : 'text-red-700'}`}>
                OPPONENT
              </div>
              <div className="text-xl font-bold text-gray-900 mb-2">
                {opponentUsername || formatAddress(escrow.partyB)}
              </div>
              <div className="text-sm text-gray-600 mb-4">{formatAddress(escrow.partyB)}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">${formatUSDC(escrow.amountB)}</span>
                <span className="text-sm text-gray-600">USDC</span>
              </div>
              <div className={`mt-3 px-3 py-1 rounded-lg inline-block text-sm font-semibold ${
                isPartyB ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {escrow.outcomeForA ? 'NO' : 'YES'}
              </div>
            </div>
          </div>

          {/* Winner Takes */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8 text-center">
            <div className="text-sm text-yellow-700 font-semibold mb-2">WINNER TAKES</div>
            <div className="text-4xl font-bold text-gray-900">
              ${formatUSDC(escrow.amountA + escrow.amountB)} USDC
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Created</div>
              <div className="font-semibold text-gray-900">
                {new Date(escrow.createdAt * 1000).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Clock size={14} />
                Expires
              </div>
              <div className="font-semibold text-gray-900">
                {formatTime(escrow.expiryTime)}
              </div>
            </div>
          </div>

          {/* Actions */}
          {canAccept && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">You've Been Challenged! 🎯</h3>
              <p className="text-gray-600 mb-4">
                Accept this challenge to lock in your position. You'll stake ${formatUSDC(escrow.amountB)} USDC on {escrow.outcomeForA ? 'NO' : 'YES'}.
              </p>
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-bold text-lg transition flex items-center justify-center gap-2"
              >
                {isAccepting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Accepting Challenge...
                  </>
                ) : (
                  'Accept Challenge'
                )}
              </button>
            </div>
          )}

          {!isConnected && escrow.status === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <p className="text-gray-600 mb-4">Connect your wallet to accept this challenge</p>
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold">
                Connect Wallet
              </button>
            </div>
          )}

          {escrow.status === 1 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Challenge Active!</h3>
              <p className="text-gray-600">
                Waiting for the market to resolve. Winner will automatically receive funds.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      {!isPartyA && !isPartyB && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Want to create your own challenge?</p>
          <a
            href="/create"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold transition"
          >
            Create Challenge
          </a>
        </div>
      )}
    </div>
  );
}
