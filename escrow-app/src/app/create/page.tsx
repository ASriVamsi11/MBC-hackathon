'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Search, Loader, XCircle, CheckCircle, Share2 } from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { fetchPolymarketMarkets } from '@/lib/polymarket';
import { formatAddress } from '@/lib/utils';

export default function CreateChallengePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const contract = useContract();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [markets, setMarkets] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  
  const [counterparty, setCounterparty] = useState('');
  const [yourAmount, setYourAmount] = useState('');
  const [counterpartyAmount, setCounterpartyAmount] = useState('');
  const [yourOutcome, setYourOutcome] = useState<'yes' | 'no'>('yes');
  const [expiryDays, setExpiryDays] = useState('7');
  
  const [isCreating, setIsCreating] = useState(false);
  const [createdEscrowId, setCreatedEscrowId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Search Polymarket markets
  useEffect(() => {
    const searchMarkets = async () => {
      if (searchQuery.length < 3) {
        setMarkets([]);
        return;
      }

      setIsSearching(true);
      const results = await fetchPolymarketMarkets(searchQuery);
      setMarkets(results);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchMarkets, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateChallenge = async () => {
    if (!isConnected || !address) {
      showNotification('Please connect your wallet', 'error');
      return;
    }

    if (!selectedMarket || !counterparty || !yourAmount || !counterpartyAmount) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    setIsCreating(true);

    try {
      const escrowId = await contract.createEscrow({
        partyB: counterparty,
        amountA: yourAmount,
        amountB: counterpartyAmount,
        conditionId: selectedMarket.condition_id,
        outcomeForA: yourOutcome === 'yes',
        duration: parseInt(expiryDays) * 86400,
      });

      setCreatedEscrowId(escrowId);
      showNotification('Challenge created successfully!', 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to create challenge', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const shareLink = createdEscrowId !== null 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/challenge/${createdEscrowId}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showNotification('Link copied to clipboard!', 'success');
  };

  const shareToTwitter = () => {
    const text = `I just challenged someone on @Polymarket! Think you can beat me on "${selectedMarket?.question}"? 🎯`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank');
  };

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Loader size={48} className="mx-auto text-indigo-600 mb-4 animate-spin" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-8">Please connect your wallet to create a challenge</p>
      </div>
    );
  }

  if (createdEscrowId !== null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenge Created! 🎉</h1>
          <p className="text-gray-600 mb-8">Share this link with your friend to accept the challenge</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 break-all">
            <code className="text-sm text-gray-800">{shareLink}</code>
          </div>

          <div className="flex gap-3 justify-center mb-8">
            <button
              onClick={copyLink}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Copy Link
            </button>
            <button
              onClick={shareToTwitter}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-medium flex items-center gap-2"
            >
              <Share2 size={20} />
              Share on Twitter
            </button>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/my-escrows')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              View My Challenges
            </button>
            <button
              onClick={() => {
                setCreatedEscrowId(null);
                setSelectedMarket(null);
                setCounterparty('');
                setYourAmount('');
                setCounterpartyAmount('');
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'error' && <XCircle size={20} />}
          {notification.type === 'info' && <Loader size={20} className="animate-spin" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Challenge</h1>
        <p className="text-gray-600 mb-8">Challenge a friend on any Polymarket prediction</p>

        {/* Step 1: Select Market */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            1. Select Polymarket Prediction
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets (e.g., 'Lakers', 'Bitcoin', 'Election')"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <Loader size={24} className="mx-auto text-indigo-600 animate-spin" />
            </div>
          )}

          {!isSearching && searchQuery && markets.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {markets.map((market) => (
                <div
                  key={market.condition_id}
                  onClick={() => {
                    setSelectedMarket(market);
                    setSearchQuery('');
                  }}
                  className="p-4 border rounded-lg cursor-pointer transition-colors border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-900"
                >
                  <div className="font-medium text-gray-900 mb-2">{market.question}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Volume: ${((market.volume || 0) / 1000000).toFixed(1)}M</span>
                    <span>Closes: {new Date(market.end_date_iso).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
//testing
          {selectedMarket && !searchQuery && (
            <div className="p-4 border border-indigo-200 bg-indigo-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">{selectedMarket.question}</div>
                  <div className="text-sm text-gray-600">
                    Condition ID: {formatAddress(selectedMarket.condition_id)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMarket(null)}
                  className="text-gray-500 hover:text-gray-700 ml-2"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Opponent Address */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            2. Opponent's Address
          </label>
          <input
            type="text"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="0x... (Ethereum address)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        {/* Step 3: Amounts */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              3. Your Stake (USDC)
            </label>
            <input
              type="number"
              value={yourAmount}
              onChange={(e) => setYourAmount(e.target.value)}
              placeholder="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Opponent's Stake (USDC)
            </label>
            <input
              type="number"
              value={counterpartyAmount}
              onChange={(e) => setCounterpartyAmount(e.target.value)}
              placeholder="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
        </div>

        {/* Step 4: Your Position */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            4. Your Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setYourOutcome('yes')}
              className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                yourOutcome === 'yes'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setYourOutcome('no')}
              className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                yourOutcome === 'no'
                  ? 'bg-red-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Your opponent will automatically take the opposite position
          </p>
        </div>

        {/* Step 5: Expiry */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            5. Challenge Expiry
          </label>
          <select
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
          <p className="text-sm text-gray-500 mt-2">
            If not accepted within this time, you can cancel and get refunded
          </p>
        </div>

        {/* Summary */}
        {selectedMarket && yourAmount && counterpartyAmount && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Challenge Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Your position:</span>
                <span className="font-semibold text-gray-900">
                  {yourOutcome === 'yes' ? 'Yes' : 'No'} - ${yourAmount} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Opponent's position:</span>
                <span className="font-semibold text-gray-900">
                  {yourOutcome === 'yes' ? 'No' : 'Yes'} - ${counterpartyAmount} USDC
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-300">
                <span className="text-gray-600">Winner receives:</span>
                <span className="font-bold text-green-600 text-lg">
                  ${parseFloat(yourAmount) + parseFloat(counterpartyAmount)} USDC
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreateChallenge}
          disabled={!selectedMarket || !counterparty || !yourAmount || !counterpartyAmount || isCreating}
          className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-lg transition-all flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <Loader className="animate-spin" size={20} />
              Creating Challenge...
            </>
          ) : (
            'Create Challenge'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          You'll need to approve USDC spending and sign the transaction
        </p>
      </div>
    </div>
  );
}