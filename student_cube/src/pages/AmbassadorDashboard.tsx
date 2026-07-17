import { useEffect, useState } from 'react';
import { BadgeCheck, Copy, History, LayoutDashboard, Wallet, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { BrutalLoader } from "../components/ui/brutal-loader";

interface PayoutHistoryItem {
  _id?: string;
  amount: number;
  paidAt: string;
  transactionId?: string;
  note?: string;
}

interface AmbassadorDashboardData {
  referCode: string | null;
  totalPending: number;     
  totalSuccessful: number;  
  walletBalance: number;
  payoutHistory: PayoutHistoryItem[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const AmbassadorDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AmbassadorDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/ambassador/dashboard');
        setDashboardData(response.data.data);
      } catch (error) {
        console.error('Failed to load ambassador dashboard:', error);
        toast.error('Failed to load ambassador dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleCopyCode = async () => {
    if (!dashboardData?.referCode) return;

    try {
      await navigator.clipboard.writeText(dashboardData.referCode);
      toast.success('Refer code copied');
    } catch {
      toast.error('Could not copy refer code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-paper">
        <BrutalLoader size="sm" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-paper py-10 px-4 flex items-center justify-center">
        <div className="bg-paper brutal-block p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-display font-black text-ink uppercase tracking-tight mb-2">Dashboard unavailable</h1>
          <p className="text-sm text-ink/70 font-body">Please try again in a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-body py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto mb-6 border-b-[var(--border-w)] border-ink pb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ledger-blue font-mono font-bold text-xs uppercase tracking-wider mb-2">
            <BadgeCheck className="w-5 h-5 text-ledger-blue" strokeWidth={3} /> Ambassador Workspace
          </div>
          <h1 className="text-4xl font-display font-black text-ink uppercase tracking-tight">
            Referral Dashboard
          </h1>
        </div>

        <div className="flex bg-paper p-1 brutal-block-sm border-[var(--border-w)] border-ink shrink-0 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 font-display font-bold text-sm uppercase tracking-tight transition-colors ${
              activeTab === 'overview'
                ? 'bg-ink text-paper brutal-block-sm'
                : 'text-ink hover:bg-paper-blue'
            }`}
            style={activeTab === 'overview' ? {} : { borderRadius: 'var(--radius)' }}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 px-6 py-3 font-display font-bold text-sm uppercase tracking-tight transition-colors ${
              activeTab === 'payouts'
                ? 'bg-ink text-paper brutal-block-sm'
                : 'text-ink hover:bg-paper-blue'
            }`}
            style={activeTab === 'payouts' ? {} : { borderRadius: 'var(--radius)' }}
          >
            <History className="w-4 h-4" /> Payout History
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === 'overview' ? (
          <div className="grid gap-4">
            <div className="bg-paper brutal-block p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-mono font-bold text-ink/50 mb-2">Your Refer Code</p>
                  {dashboardData.referCode ? (
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-display font-black text-ink uppercase tracking-tight">{dashboardData.referCode}</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="h-10 w-10 inline-flex items-center justify-center brutal-block-sm bg-paper-blue text-ink hover:bg-highlighter transition-colors"
                        title="Copy refer code"
                      >
                        <Copy className="w-4 h-4 text-ink" strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="brutal-block-sm bg-paper-blue px-4 py-3 text-sm font-bold text-ink font-body">
                      No refer code assigned yet. Ask an admin to assign you a refer code.
                    </div>
                  )}
                </div>
                <div className="brutal-block-sm bg-signal-orange/10 px-4 py-3 text-sm font-bold text-ink font-body border-[var(--border-w)] border-ink">
                  Contact the admins in the ambassador group for payouts.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Pending Referrals */}
              <div className="bg-paper brutal-block p-6 hover:bg-signal-orange/5 transition-colors">
                <Clock className="w-6 h-6 text-signal-orange mb-4" strokeWidth={3} />
                <p className="text-4xl font-mono font-black text-ink mb-1">{dashboardData.totalPending || 0}</p>
                <p className="text-xs uppercase tracking-wider font-mono font-bold text-ink/70">Pending (Listed, Unpaid)</p>
              </div>

              {/* Card 2: Successful Referrals */}
              <div className="bg-paper brutal-block p-6 hover:bg-campus-green/5 transition-colors">
                <CheckCircle className="w-6 h-6 text-campus-green mb-4" strokeWidth={3} />
                <p className="text-4xl font-mono font-black text-ink mb-1">{dashboardData.totalSuccessful || 0}</p>
                <p className="text-xs uppercase tracking-wider font-mono font-bold text-ink/70">Successful (Unlocked)</p>
              </div>

              {/* Card 3: Wallet Balance */}
              <div className="bg-paper brutal-block p-6 hover:bg-ledger-blue/5 transition-colors">
                <Wallet className="w-6 h-6 text-ink mb-4" strokeWidth={3} />
                <p className="text-4xl font-mono font-black text-ink mb-1">{formatCurrency(dashboardData.walletBalance)}</p>
                <p className="text-xs uppercase tracking-wider font-mono font-bold text-ink/70">Wallet Balance</p>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-paper brutal-block overflow-hidden">
            {dashboardData.payoutHistory.length === 0 ? (
              <div className="p-8 text-center">
                <History className="w-8 h-8 text-ink/30 mx-auto mb-3" strokeWidth={3} />
                <p className="font-display font-black text-ink uppercase tracking-tight text-xl">No payouts yet</p>
                <p className="text-sm text-ink/70 mt-1 font-body">Completed payouts will appear here with amount, transaction ID, and time.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-3 px-5 py-3 bg-paper-blue border-b-[var(--border-w)] border-ink text-xs font-mono font-bold uppercase tracking-wider text-ledger-blue">
                  <span>Amount</span>
                  <span>Transaction ID</span>
                  <span className="text-right">Time</span>
                </div>
                <div className="divide-y divide-ink">
                {dashboardData.payoutHistory.map((payout, index) => (
                  <div key={payout._id || `${payout.paidAt}-${index}`} className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:items-center hover:bg-highlighter/10 transition-colors">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-ink text-lg">{formatCurrency(payout.amount)}</p>
                      {payout.note && <p className="text-sm text-ink/70 font-body mt-1">{payout.note}</p>}
                    </div>
                    <p className="text-sm font-mono font-bold text-signal-orange break-words">{payout.transactionId || "Not recorded"}</p>
                    <p className="text-sm font-mono font-bold text-ink/50 sm:text-right">{formatDateTime(payout.paidAt)}</p>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbassadorDashboard;