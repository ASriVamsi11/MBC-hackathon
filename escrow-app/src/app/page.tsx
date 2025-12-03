'use client';

import Link from 'next/link';
import { Trophy, Zap, Shield, Users, TrendingUp, Target, Sparkles } from 'lucide-react';
import { useAccount } from 'wagmi';

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-full px-4 py-2 mb-8 shadow-lg">
              <Sparkles size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600">Challenge Friends • Win Big</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Challenge Friends on{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Polymarket
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Create conditional escrows, challenge your friends on prediction markets, and let the smart contract decide the winner
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/create"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl transition-all font-bold text-lg flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                <Zap size={24} />
                Create Challenge
                <div className="group-hover:translate-x-1 transition-transform">→</div>
              </Link>
              
              {isConnected && (
                <Link
                  href="/my-escrows"
                  className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-xl hover:shadow-xl transition-all font-bold text-lg flex items-center justify-center gap-2 hover:border-indigo-300 transform hover:-translate-y-1"
                >
                  <Trophy size={24} />
                  My Challenges
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  500+
                </div>
                <div className="text-sm text-gray-600 font-medium">Challenges Created</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  $50K+
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Staked</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  1,200+
                </div>
                <div className="text-sm text-gray-600 font-medium">Active Users</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Challenge friends in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              icon={<Target size={32} />}
              title="Pick a Market"
              description="Choose any Polymarket prediction market you want to challenge your friend on"
              gradient="from-indigo-500 to-purple-500"
            />
            <StepCard
              number={2}
              icon={<Users size={32} />}
              title="Create Challenge"
              description="Set your stake amount and invite your friend. Both deposit funds into the smart contract"
              gradient="from-purple-500 to-pink-500"
            />
            <StepCard
              number={3}
              icon={<Trophy size={32} />}
              title="Winner Takes All"
              description="When the market resolves, the smart contract automatically sends funds to the winner"
              gradient="from-pink-500 to-rose-500"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Base Bets?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The most trusted way to challenge friends on prediction markets
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard
              icon={<Shield size={40} className="text-indigo-600" />}
              title="Trustless & Secure"
              description="Smart contracts eliminate the need for trust. Funds are held securely on-chain and automatically distributed to the winner."
              bgGradient="from-indigo-50 to-blue-50"
            />
            <FeatureCard
              icon={<Zap size={40} className="text-purple-600" />}
              title="Instant Settlement"
              description="No waiting for manual payouts. As soon as the Polymarket resolves, winners automatically receive their funds."
              bgGradient="from-purple-50 to-pink-50"
            />
            <FeatureCard
              icon={<Users size={40} className="text-green-600" />}
              title="Track Your Friends"
              description="See your win/loss record against friends, view leaderboards, and build your reputation as a top challenger."
              bgGradient="from-green-50 to-emerald-50"
            />
            <FeatureCard
              icon={<TrendingUp size={40} className="text-yellow-600" />}
              title="Any Market Size"
              description="Challenge friends on any Polymarket, from elections to sports to crypto. Set any stake amount you're comfortable with."
              bgGradient="from-yellow-50 to-amber-50"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-12">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
            
            <div className="relative text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Challenge?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Create your first challenge now and see who really knows their predictions
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-xl hover:shadow-2xl transition-all font-bold text-lg transform hover:-translate-y-1"
              >
                <Zap size={24} />
                Create Your First Challenge
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepCard({ number, icon, title, description, gradient }: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all transform hover:-translate-y-2">
      {/* Number Badge */}
      <div className={`absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
        {number}
      </div>
      
      {/* Icon */}
      <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
        {icon}
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description, bgGradient }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgGradient: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all transform hover:-translate-y-1`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}