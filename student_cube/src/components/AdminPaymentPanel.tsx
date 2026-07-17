import { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, X, CreditCard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../utils/productImages';
import type { ProductImageValue } from '../utils/productImages';
import { BrutalLoader } from "../components/ui/brutal-loader";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface PendingPayment {
  _id: string;
  transactionId: string;
  offeredPrice: number;
  offerPrice?: number;
  buyer: { username: string; email: string };
  product: { title: string; price: number; images: ProductImageValue[] };
  updatedAt: string;
}

const AdminPaymentPanel = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPayments = async (isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true);
      
      const token = localStorage.getItem("token"); 
      
      const apiURL = `${BACKEND_URL}/offers/admin/payments/pending`;

      const res = await axios.get(apiURL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPayments(res.data.data);
    } catch (error) {
      console.error("Failed to fetch pending payments:", error);
      toast.error("Unable to load pending payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchPendingPayments(false);
    };
    loadInitialData();
  }, []);

  const handleVerify = async (offerId: string, action: 'APPROVE' | 'REJECT') => {
    
    try {
      const token = localStorage.getItem("token");
      
      const res = await axios.put(
        `${BACKEND_URL}/offers/admin/payment/verify/${offerId}`, 
        { action },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success(res.data.message);
      setPayments(prev => prev.filter(p => p._id !== offerId));
    } catch (error) {
      toast.error("Verification action failed.");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BrutalLoader size="sm" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-16 bg-paper brutal-block text-ink">
        <p className="text-lg font-display font-bold uppercase tracking-tight">All cleared! No pending payments to verify.</p>
      </div>
    );
  }

  return (
    <div className="bg-paper border-[var(--border-w)] border-ink brutal-block overflow-hidden">
      <div className="p-4 bg-paper-blue border-b-[var(--border-w)] border-ink flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-ledger-blue uppercase tracking-wider">
          <CreditCard className="w-4 h-4" /> UTR Verification Queue
        </div>
        <button 
          onClick={() => fetchPendingPayments(true)}
          className="px-3 py-2 bg-paper hover:bg-highlighter border-[var(--border-w)] border-ink transition-colors flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-ink"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <RefreshCw className="w-3.5 h-3.5 text-ink" strokeWidth={3} /> Refresh List
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper text-ink text-xs font-display font-black uppercase border-b-[var(--border-w)] border-ink">
              <th className="p-4">Item Details</th>
              <th className="p-4">Buyer Account</th>
              <th className="p-4 text-campus-green">Final Price</th>
              <th className="p-4 font-mono text-signal-orange">UTR Code</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink text-sm text-ink font-body">
            {payments.map((pay) => (
              <tr key={pay._id} className="hover:bg-highlighter/20 transition-colors">
                <td className="p-4 font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-paper-blue brutal-block-sm overflow-hidden shrink-0">
                      <img 
                        src={getProductImageUrl(pay.product?.images?.[0])} 
                        alt="Product" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate max-w-45">
                      <p className="text-ink font-display uppercase tracking-tight truncate">{pay.product?.title || "Untitled"}</p>
                      <p className="text-xs text-ink/50 font-mono">List: ₹{pay.product?.price}</p>
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  <p className="font-display font-black uppercase tracking-tight text-ink">{pay.buyer?.username}</p>
                  <p className="text-xs text-ink/70 font-body truncate max-w-37.5">{pay.buyer?.email}</p>
                </td>

                <td className="p-4 font-mono font-black text-ink text-base">
                  ₹{pay.offeredPrice || pay.offerPrice}
                </td>

                <td className="p-4 font-mono font-black text-signal-orange">
                  <span className="bg-signal-orange/10 px-3 py-1 border-[var(--border-w-sm)] border-signal-orange" style={{ borderRadius: 'var(--radius)' }}>
                    {pay.transactionId}
                  </span>
                </td>

                <td className="p-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button 
                      onClick={() => handleVerify(pay._id, 'APPROVE')}
                      className="p-2 bg-campus-green hover:bg-campus-green/90 text-ink border-[var(--border-w-sm)] border-ink transition-colors"
                      title="Approve & Mark Sold"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      <Check className="w-4 h-4 text-ink" strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => handleVerify(pay._id, 'REJECT')}
                      className="p-2 bg-stamp-red text-paper hover:bg-stamp-red/90 border-[var(--border-w-sm)] border-ink transition-colors"
                      title="Reject Fake UTR"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      <X className="w-4 h-4 text-paper" strokeWidth={3} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPaymentPanel;
