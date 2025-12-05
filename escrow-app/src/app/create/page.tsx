'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Search, Loader, XCircle, CheckCircle, Share2, Zap, Target, Users, DollarSign, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const searchMarkets = async () => {
      if (searchQuery.length < 3) {
        setMarkets([]);
        return;
      }

      setIsSearching(true);
      try {
        console.log('Searching for:', searchQuery);
        const results = await fetchPolymarketMarkets(searchQuery);
        console.log('Search results:', results);
        setMarkets(results || []); // Handle null/undefined

        if (!results || results.length === 0) {
          showNotification('No markets found. Try a different search term.', 'info');
        }
      } catch (error) {
        console.error('Search error:', error);
        showNotification('Failed to search markets. Please try again.', 'error');
        setMarkets([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchMarkets, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);
  // useEffect(() => {
  //   const searchMarkets = async () => {
  //     if (searchQuery.length < 3) {
  //       setMarkets([]);
  //       return;
  //     }

  //     setIsSearching(true);
  //     const results = await fetchPolymarketMarkets(searchQuery);
  //     setMarkets(results);
  //     setIsSearching(false);
  //   };

  //   const debounce = setTimeout(searchMarkets, 500);
  //   return () => clearTimeout(debounce);
  // }, [searchQuery]);

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
      const hash = await contract.createEscrow({
        beneficiary: counterparty,
        amountA: yourAmount,
        amountB: counterpartyAmount,
        marketId: selectedMarket.condition_id,
        expectedOutcomeYes: yourOutcome === 'yes',
      });

      // Extract escrow ID from transaction (would normally come from event logs)
      // For now, show success with the tx hash
      setCreatedEscrowId(0);
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Loader size={48} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12 text-center max-w-md">
          <AlertCircle size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 dark:text-gray-400">Please connect your wallet to create a challenge</p>
        </div>
      </div>
    );
  }

  if (createdEscrowId !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-green-900/20 flex items-center justify-center px-4">
        <div className="max-w-3xl w-full">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-green-100 dark:border-green-800 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Challenge Created! 🎉</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Share this link with your friend to accept the challenge</p>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-5 mb-6 border border-gray-200 dark:border-gray-700 shadow-inner">
              <code className="text-sm text-gray-800 dark:text-gray-200 break-all font-mono">{shareLink}</code>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button
                onClick={copyLink}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all font-semibold transform hover:-translate-y-0.5"
              >
                Copy Link
              </button>
              <button
                onClick={shareToTwitter}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <Share2 size={20} />
                Share on Twitter
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => router.push('/my-escrows')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold transition"
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
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-24 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border transition-all ${notification.type === 'success' ? 'bg-green-500/95 text-white border-green-400' :
              notification.type === 'error' ? 'bg-red-500/95 text-white border-red-400' :
                'bg-blue-500/95 text-white border-blue-400'
            }`}>
            {notification.type === 'success' && <CheckCircle size={20} />}
            {notification.type === 'error' && <XCircle size={20} />}
            {notification.type === 'info' && <Loader size={20} className="animate-spin" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />

          <div className="relative text-center">
            <Zap size={48} className="mx-auto text-white mb-4 drop-shadow-lg" />
            <h1 className="text-4xl font-bold text-white mb-2">Create Challenge</h1>
            <p className="text-indigo-100 text-lg">Challenge a friend on any Polymarket prediction</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          {/* Step 1: Select Market */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
              Select Polymarket Prediction
            </label>
            <div className="relative mb-3">
              <Target className="absolute left-4 top-4 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets (e.g., 'Lakers', 'Bitcoin', 'Election')"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {isSearching && (
              <div className="text-center py-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                <Loader size={32} className="mx-auto text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">Searching markets...</p>
              </div>
            )}

            {!isSearching && searchQuery && markets.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                {markets.map((market) => (
                  <div
                    key={market.condition_id}
                    onClick={() => {
                      setSelectedMarket(market);
                      setSearchQuery('');
                    }}
                    className="p-4 border-2 rounded-xl cursor-pointer transition-all border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white mb-2">{market.question}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Volume: ${((market.volume || 0) / 1000000).toFixed(1)}M</span>
                      <span>•</span>
                      <span>Closes: {new Date(market.end_date_iso).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedMarket && !searchQuery && (
              <div className="p-5 border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                      {selectedMarket.question}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      ID: {formatAddress(selectedMarket.condition_id)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMarket(null)}
                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 ml-2 p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Opponent Address */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
              Opponent's Address
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-4 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="0x... (Ethereum address)"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm transition-all font-mono placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Step 3: Amounts */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
              Stake Amounts
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Your Stake (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-4 text-gray-400 dark:text-gray-500" size={20} />
                  <input
                    type="number"
                    value={yourAmount}
                    onChange={(e) => setYourAmount(e.target.value)}
                    placeholder="100"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm transition-all text-lg font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Opponent's Stake (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-4 text-gray-400 dark:text-gray-500" size={20} />
                  <input
                    type="number"
                    value={counterpartyAmount}
                    onChange={(e) => setCounterpartyAmount(e.target.value)}
                    placeholder="100"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm transition-all text-lg font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Your Position */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">4</span>
              Your Position
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setYourOutcome('yes')}
                className={`py-6 px-4 rounded-xl border-2 transition-all font-bold text-lg ${yourOutcome === 'yes'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-500 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md'
                  }`}
              >
                <div className="text-3xl mb-2">✅</div>
                YES
              </button>
              <button
                type="button"
                onClick={() => setYourOutcome('no')}
                className={`py-6 px-4 rounded-xl border-2 transition-all font-bold text-lg ${yourOutcome === 'no'
                    ? 'bg-gradient-to-br from-red-500 to-rose-500 border-red-500 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md'
                  }`}
              >
                <div className="text-3xl mb-2">❌</div>
                NO
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Your opponent will automatically take the opposite position
            </p>
          </div>

          {/* Step 5: Expiry */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">5</span>
              Challenge Expiry
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm transition-all font-semibold"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              If not accepted within this time, you can cancel and get refunded
            </p>
          </div>

          {/* Summary */}
          {selectedMarket && yourAmount && counterpartyAmount && counterparty && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-8 shadow-md">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
                <CheckCircle size={24} className="text-indigo-600 dark:text-indigo-400" />
                Challenge Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">Market:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedMarket.question}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">Your position:</span>
                  <span className={`font-bold px-3 py-1 rounded-lg ${yourOutcome === 'yes' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                    {yourOutcome === 'yes' ? 'Yes' : 'No'} - ${yourAmount} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">Opponent's position:</span>
                  <span className={`font-bold px-3 py-1 rounded-lg ${yourOutcome === 'yes' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                    {yourOutcome === 'yes' ? 'No' : 'Yes'} - ${counterpartyAmount} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-indigo-200 dark:border-indigo-800">
                  <span className="text-gray-900 dark:text-white font-semibold">Total Pool:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
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
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 disabled:transform-none"
          >
            {isCreating ? (
              <>
                <Loader className="animate-spin" size={24} />
                Creating Challenge...
              </>
            ) : (
              <>
                <Zap size={24} />
                Create Challenge
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            You'll need to approve USDC spending and sign the transaction
          </p>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
            How It Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">1.</span>
              <span>Both you and your opponent deposit the stake amount into the smart contract</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">2.</span>
              <span>The contract monitors the Polymarket for resolution</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">3.</span>
              <span>When the market resolves, the winner automatically receives both stakes</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">4.</span>
              <span>No trust needed - the smart contract handles everything!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}