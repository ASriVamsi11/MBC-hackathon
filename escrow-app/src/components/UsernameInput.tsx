'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { useContract } from '@/hooks/useContract';

interface UsernameInputProps {
  onComplete?: () => void;
}

export default function UsernameInput({ onComplete }: UsernameInputProps) {
  const { address } = useAccount();
  const contract = useContract();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username.length > 32) {
      setError('Username must be 32 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setIsSubmitting(true);

    try {
      await contract.setUsername(username);
      setSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to set username');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Set Your Username</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            maxLength={32}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
          <p className="text-sm text-gray-500 mt-2">
            Letters, numbers, hyphens, and underscores only. Max 32 characters.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <XCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} />
            Username set successfully!
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Setting...
              </>
            ) : success ? (
              <>
                <CheckCircle size={16} />
                Done!
              </>
            ) : (
              'Set Username'
            )}
          </button>
          {onComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}