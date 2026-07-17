import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Calendar, Copy, History, IndianRupee, Mail, MapPin, Plus, Search, ShieldX, User, Wallet, X, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../utils/api";
import { ALL_COLLEGES_FILTER, COLLEGE_FILTER_OPTIONS } from "../utils/colleges";
import { BrutalLoader } from "../components/ui/brutal-loader";

const ADMIN_PAGE_SIZE = 20;

interface PayoutHistoryItem {
  _id?: string;
  amount: number;
  paidAt: string;
  transactionId?: string;
  note?: string;
}

interface Ambassador {
  _id: string;
  name: string;
  username?: string;
  email: string;
  college?: string;
  referCode?: string | null;
  totalPending: number;      
  totalSuccessful: number;   
  walletBalance: number;
  payoutHistory: PayoutHistoryItem[];
  createdAt: string;
}

interface UserSearchResult {
  _id: string;
  name: string;
  username?: string;
  email: string;
  college?: string;
  role: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getDateTimeLocalValue = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const AdminAmbassadorsPanel = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [college, setCollege] = useState(ALL_COLLEGES_FILTER);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutTime, setPayoutTime] = useState(getDateTimeLocalValue());
  const [payoutTransactionId, setPayoutTransactionId] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [assigningReferCode, setAssigningReferCode] = useState(false);
  const [demotingAmbassador, setDemotingAmbassador] = useState(false);
  const [isAssignCodeModalOpen, setIsAssignCodeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [referCodeInput, setReferCodeInput] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [creatingAmbassador, setCreatingAmbassador] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!isCreateModalOpen) return;

    const trimmedSearch = userSearchInput.trim();
    if (trimmedSearch.length < 2) {
      setTimeout(() => {
        setUserResults([]);
      }, 0);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setSearchingUsers(true);

      try {
        const response = await api.get(`/ambassador/admin/user-search?search=${encodeURIComponent(trimmedSearch)}`);
        setUserResults(response.data.data || []);
      } catch (error) {
        console.error("Failed to search users:", error);
        toast.error("Failed to search users");
      } finally {
        setSearchingUsers(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [isCreateModalOpen, userSearchInput]);

  const fetchAmbassadors = useCallback(async (pageToLoad: number, replace = false) => {
    if (replace) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: String(pageToLoad),
        limit: String(ADMIN_PAGE_SIZE),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (college !== ALL_COLLEGES_FILTER) params.set("college", college);

      const response = await api.get(`/ambassador/admin?${params.toString()}`);
      const nextAmbassadors = response.data.data || [];
      setAmbassadors((current) => replace ? nextAmbassadors : [...current, ...nextAmbassadors]);
      setPage(pageToLoad);
      setHasMore(Boolean(response.data.pagination?.hasMore));
    } catch (error) {
      console.error("Failed to fetch ambassadors:", error);
      toast.error("Failed to fetch ambassadors");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [college, searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAmbassadors(1, true);
    }, 0);

    return () => clearTimeout(timeoutId); 
  }, [fetchAmbassadors]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchAmbassadors(page + 1);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchAmbassadors, hasMore, loading, loadingMore, page]);

  const copyReferCode = async (code?: string | null) => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      toast.success("Refer code copied");
    } catch {
      toast.error("Could not copy refer code");
    }
  };

  const handleOpenDetails = (ambassador: Ambassador) => {
    setSelectedAmbassador(ambassador);
    setPayoutAmount("");
    setPayoutTime(getDateTimeLocalValue());
    setPayoutTransactionId("");
  };

  const resetCreateModal = () => {
    setIsCreateModalOpen(false);
    setUserSearchInput("");
    setUserResults([]);
    setSelectedUser(null);
    setReferCodeInput("");
  };

  const updateAmbassadorInState = (updatedAmbassador: Ambassador) => {
    setAmbassadors((current) => current.map((ambassador) => (
      ambassador._id === updatedAmbassador._id ? updatedAmbassador : ambassador
    )));
    setSelectedAmbassador(updatedAmbassador);
  };

  const handleCreateAmbassador = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    setCreatingAmbassador(true);

    try {
      const response = await api.post("/ambassador/admin", {
        userId: selectedUser._id,
        referCode: referCodeInput,
      });
      const createdAmbassador = response.data.data;

      setAmbassadors((current) => [createdAmbassador, ...current]);
      resetCreateModal();
      toast.success("Ambassador created successfully");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to create ambassador"
        : "Failed to create ambassador";
      toast.error(message);
    } finally {
      setCreatingAmbassador(false);
    }
  };

  const handlePayoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAmbassador) return;

    setPayoutLoading(true);

    try {
      const response = await api.post(`/ambassador/admin/${selectedAmbassador._id}/payouts`, {
        amount: Number(payoutAmount),
        paidAt: payoutTime,
        transactionId: payoutTransactionId,
      });
      const updatedAmbassador = response.data.data;

      updateAmbassadorInState(updatedAmbassador);
      setPayoutAmount("");
      setPayoutTime(getDateTimeLocalValue());
      setPayoutTransactionId("");
      toast.success("Payout record added");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to add payout record"
        : "Failed to add payout record";
      toast.error(message);
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleAssignReferCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAmbassador) return;

    setAssigningReferCode(true);

    try {
      const response = await api.put(`/ambassador/admin/${selectedAmbassador._id}/refer-code`, {
        referCode: referCodeInput,
      });
      const updatedAmbassador = response.data.data;

      updateAmbassadorInState(updatedAmbassador);
      setReferCodeInput("");
      setIsAssignCodeModalOpen(false);
      toast.success("Refer code assigned");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to assign refer code"
        : "Failed to assign refer code";
      toast.error(message);
    } finally {
      setAssigningReferCode(false);
    }
  };

  const handleDemoteAmbassador = async () => {
    if (!selectedAmbassador) return;

    const confirmed = window.confirm(`Demote ${selectedAmbassador.name} from ambassador? Their refer code will stop working and they will lose ambassador access.`);
    if (!confirmed) return;

    setDemotingAmbassador(true);

    try {
      await api.put(`/ambassador/admin/${selectedAmbassador._id}/demote`);
      setAmbassadors((current) => current.filter((ambassador) => ambassador._id !== selectedAmbassador._id));
      setSelectedAmbassador(null);
      toast.success("Ambassador demoted");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to demote ambassador"
        : "Failed to demote ambassador";
      toast.error(message);
    } finally {
      setDemotingAmbassador(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BrutalLoader size="sm" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-paper brutal-block-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-ink absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={3} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search ambassadors by name or email..."
              className="w-full h-11 pl-11 pr-4 brutal-block-sm bg-paper-blue text-sm text-ink font-body focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-ink absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={3} />
            <select
              value={college}
              onChange={(event) => setCollege(event.target.value)}
              className="w-full h-11 pl-11 pr-4 brutal-block-sm bg-paper-blue text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper appearance-none"
            >
              <option value={ALL_COLLEGES_FILTER}>{ALL_COLLEGES_FILTER}</option>
              {COLLEGE_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-11 px-4 brutal-block-sm bg-signal-orange hover:bg-signal-orange/90 text-ink font-display font-bold text-sm uppercase tracking-tight flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-ink" strokeWidth={3} /> New Ambassador
          </button>
        </div>
      </div>

      {ambassadors.length === 0 ? (
        <div className="text-center py-16 bg-paper brutal-block text-ink">
          <p className="text-lg font-display font-bold uppercase tracking-tight">No ambassadors match this search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ambassadors.map((ambassador) => (
            <button
              key={ambassador._id}
              type="button"
              onClick={() => handleOpenDetails(ambassador)}
              className="text-left bg-paper brutal-block p-5 hover:bg-highlighter/10 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-signal-orange text-ink border-[var(--border-w-sm)] border-ink flex items-center justify-center font-display font-black shrink-0 uppercase text-xl" style={{ borderRadius: 'var(--radius)' }}>
                    {(ambassador.name || ambassador.email || "A").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-display font-black text-ink uppercase tracking-tight truncate">{ambassador.name}</h3>
                    <p className="text-sm text-ink/70 font-body truncate">{ambassador.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <MiniStat label="College" value={ambassador.college || "Not assigned"} />
                  <MiniStat label="Refer Code" value={ambassador.referCode || "Not assigned"} />
                  <MiniStat label="Pending" value={String(ambassador.totalPending || 0)} />
                  <MiniStat label="Successful" value={String(ambassador.totalSuccessful || 0)} />
                  <MiniStat label="Wallet" value={formatCurrency(ambassador.walletBalance)} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {ambassadors.length > 0 && (
        <div className="flex justify-center mt-10 mb-4">
          {hasMore ? (
            <div ref={loadMoreRef} className="flex items-center gap-3 text-slate-400 text-sm font-bold py-4">
              <BrutalLoader size="sm" />
              {loadingMore ? "Loading more ambassadors..." : "Scroll for more ambassadors"}
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-bold">No more ambassadors</p>
          )}
        </div>
      )}

      {selectedAmbassador && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setSelectedAmbassador(null)}
        >
          <div
            className="bg-paper w-full max-w-4xl max-h-[90vh] overflow-y-auto brutal-block"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-paper border-b-[var(--border-w)] border-ink px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-bold text-ledger-blue uppercase tracking-wider">Ambassador Details</p>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">{selectedAmbassador.name}</h2>
              </div>
              <button
                onClick={() => setSelectedAmbassador(null)}
                className="h-10 w-10 bg-paper-blue brutal-block-sm text-ink hover:bg-highlighter flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-5">
              <div className="space-y-4">
                <section className="brutal-block-sm bg-paper p-4">
                  <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider mb-3">Profile Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Detail label="Name" value={selectedAmbassador.name} icon={<User className="w-4 h-4" />} />
                    <Detail label="Email" value={selectedAmbassador.email} icon={<Mail className="w-4 h-4" />} />
                    <Detail label="College" value={selectedAmbassador.college || "Not assigned"} icon={<MapPin className="w-4 h-4" />} />
                    <Detail label="Joined" value={formatDateTime(selectedAmbassador.createdAt)} icon={<Calendar className="w-4 h-4" />} />
                  </div>
                </section>

                <section className="brutal-block-sm bg-paper p-4">
                  <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider mb-3">Referral Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedAmbassador.referCode ? (
                      <Detail label="Refer Code" value={selectedAmbassador.referCode} icon={<BadgeCheck className="w-4 h-4" />} />
                    ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReferCodeInput("");
                            setIsAssignCodeModalOpen(true);
                          }}
                          className="brutal-block-sm bg-signal-orange/10 p-3 min-w-0 text-left hover:bg-signal-orange/20 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-signal-orange mb-1 font-mono">
                            <BadgeCheck className="w-4 h-4" />
                            Refer Code
                          </div>
                          <p className="font-bold text-ink wrap-break-words">Not assigned. Click to assign.</p>
                        </button>
                    )}
                    
                    <Detail label="Pending" value={String(selectedAmbassador.totalPending || 0)} icon={<Clock className="w-4 h-4 text-orange-500" />} />
                    <Detail label="Successful" value={String(selectedAmbassador.totalSuccessful || 0)} icon={<CheckCircle className="w-4 h-4 text-blue-600" />} />
                    <Detail label="Wallet Balance" value={formatCurrency(selectedAmbassador.walletBalance)} icon={<Wallet className="w-4 h-4 text-ink" />} />
                  </div>
                  {selectedAmbassador.referCode && (
                    <button
                      type="button"
                      onClick={() => copyReferCode(selectedAmbassador.referCode!)}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 brutal-block-sm bg-paper-blue text-ink text-sm font-display font-bold uppercase hover:bg-highlighter transition-colors"
                    >
                      <Copy className="w-4 h-4 text-ink" strokeWidth={3} /> Copy Refer Code
                    </button>
                  )}
                </section>

                <section className="brutal-block-sm bg-stamp-red/10 p-4">
                  <h3 className="text-sm font-display font-black text-stamp-red uppercase tracking-wider mb-2">Ambassador Access</h3>
                  <p className="text-sm text-ink/80 font-body mb-3">
                    Demoting removes ambassador access and disables their assigned refer code.
                  </p>
                  <button
                    type="button"
                    disabled={demotingAmbassador}
                    onClick={handleDemoteAmbassador}
                    className="inline-flex items-center gap-2 px-3 py-2 brutal-block-sm bg-paper text-stamp-red text-sm font-display font-bold uppercase hover:bg-stamp-red hover:text-paper transition-colors disabled:opacity-50"
                  >
                    {demotingAmbassador ? (
                      <BrutalLoader size="sm" />
                    ) : (
                      <ShieldX className="w-4 h-4" strokeWidth={3} />
                    )}
                    Demote Ambassador
                  </button>
                </section>

                <section className="brutal-block-sm bg-paper p-4">
                  <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider mb-3">Payout History</h3>
                  {selectedAmbassador.payoutHistory.length === 0 ? (
                    <p className="text-sm font-bold text-ink/50 font-body">No payouts recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-ink/10">
                      {selectedAmbassador.payoutHistory.map((payout, index) => (
                        <div key={payout._id || `${payout.paidAt}-${index}`} className="py-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-mono font-bold text-ink">{formatCurrency(payout.amount)}</p>
                            <p className="text-xs text-ink/50 font-mono mt-0.5">Txn ID: {payout.transactionId || "Not recorded"}</p>
                            {payout.note && <p className="text-xs text-ink/70 font-body mt-0.5">{payout.note}</p>}
                          </div>
                          <p className="text-xs font-mono font-bold text-ink">{formatDateTime(payout.paidAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <form onSubmit={handlePayoutSubmit} className="brutal-block-sm bg-paper p-4 h-fit">
                <div className="flex items-center gap-2 text-signal-orange font-display font-black text-sm mb-4 uppercase tracking-wider">
                  <History className="w-4 h-4" /> Add Payout Record
                </div>

                <label className="block text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
                  Amount
                </label>
                <div className="relative mb-4">
                  <IndianRupee className="w-4 h-4 text-ink absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={3} />
                  <input
                    type="number"
                    min="1"
                    max={selectedAmbassador.walletBalance}
                    required
                    value={payoutAmount}
                    onChange={(event) => setPayoutAmount(event.target.value)}
                    placeholder="Enter payout amount"
                    className="w-full h-11 pl-11 pr-4 brutal-block-sm bg-paper-blue text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper"
                  />
                </div>

                <label className="block text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
                  Payout Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={payoutTime}
                  onChange={(event) => setPayoutTime(event.target.value)}
                  className="w-full h-11 px-4 brutal-block-sm bg-paper-blue text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper mb-5"
                />

                <label className="block text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  required
                  value={payoutTransactionId}
                  onChange={(event) => setPayoutTransactionId(event.target.value)}
                  placeholder="Enter transaction id"
                  className="w-full h-11 px-4 brutal-block-sm bg-paper-blue text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper mb-5"
                />

                <button
                  type="submit"
                  disabled={payoutLoading || selectedAmbassador.walletBalance <= 0}
                  className="w-full brutal-block-sm bg-signal-orange text-ink font-display font-bold py-3 uppercase tracking-tight hover:bg-signal-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payoutLoading ? (
                    <BrutalLoader size="sm" />
                  ) : (
                    <Wallet className="w-4 h-4 text-ink" strokeWidth={3} />
                  )}
                  Add Payout
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isAssignCodeModalOpen && selectedAmbassador && (
        <div
          className="fixed inset-0 z-60 bg-ink/80 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setIsAssignCodeModalOpen(false)}
        >
          <form
            onSubmit={handleAssignReferCode}
            className="bg-paper w-full max-w-md brutal-block p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-mono font-bold text-ledger-blue uppercase tracking-wider">Assign Refer Code</p>
                <h3 className="text-xl font-display font-black text-ink tracking-tight uppercase">{selectedAmbassador.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignCodeModalOpen(false)}
                className="h-10 w-10 bg-paper-blue brutal-block-sm text-ink hover:bg-highlighter flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-ink" strokeWidth={3} />
              </button>
            </div>

            <label className="block text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
              Refer Code
            </label>
            <input
              required
              value={referCodeInput}
              onChange={(event) => setReferCodeInput(event.target.value.toUpperCase())}
              placeholder="Enter manually assigned refer code"
              className="w-full h-11 px-4 brutal-block-sm bg-paper-blue text-sm font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper"
            />

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsAssignCodeModalOpen(false)}
                className="bg-paper-blue brutal-block-sm text-ink font-bold py-3 hover:bg-highlighter transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigningReferCode}
                className="bg-signal-orange brutal-block-sm text-ink font-display uppercase tracking-tight font-bold py-3 hover:bg-signal-orange/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {assigningReferCode ? (
                  <BrutalLoader size="sm" />
                ) : (
                  <BadgeCheck className="w-4 h-4 text-ink" strokeWidth={3} />
                )}
                Assign Code
              </button>
            </div>
          </form>
        </div>
      )}

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={resetCreateModal}
        >
          <form
            onSubmit={handleCreateAmbassador}
            className="bg-paper w-full max-w-2xl max-h-[90vh] overflow-y-auto brutal-block"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-paper border-b-[var(--border-w)] border-ink px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-bold text-ledger-blue uppercase tracking-wider">Create Ambassador</p>
                <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight">Assign User & Refer Code</h2>
              </div>
              <button
                type="button"
                onClick={resetCreateModal}
                className="h-10 w-10 bg-paper-blue brutal-block-sm hover:bg-highlighter text-ink flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-ink" strokeWidth={3} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <section>
                <label className="block text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
                  Search User
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-ink absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={3} />
                  <input
                    value={userSearchInput}
                    onChange={(event) => {
                      setUserSearchInput(event.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full h-11 pl-11 pr-4 brutal-block-sm bg-paper-blue text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper"
                  />
                </div>

                {selectedUser ? (
                  <div className="mt-4 p-4 brutal-block-sm bg-ledger-blue/10 border-[var(--border-w)] border-ink">
                    <p className="text-xs font-mono font-bold text-ledger-blue uppercase tracking-wider mb-1">Selected Student</p>
                    <p className="font-display font-black text-ink uppercase tracking-tight text-xl">{selectedUser.name}</p>
                    <p className="text-sm text-ink/70 font-body mb-3">{selectedUser.email}</p>
                    
                    <div className="pt-3 border-t-[var(--border-w)] border-ink/20">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-ink/50 uppercase tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5" /> Auto-Assigned College (From DB)
                      </div>
                      <p className="font-bold text-ink">{selectedUser.college || "⚠️ No college found in DB"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 brutal-block-sm bg-paper overflow-hidden border-[var(--border-w)] border-ink">
                    {searchingUsers ? (
                      <div className="p-4 text-sm font-bold text-ink/50 flex items-center gap-2">
                        <BrutalLoader size="sm" />
                        Searching users...
                      </div>
                    ) : userSearchInput.trim().length < 2 ? (
                      <p className="p-4 text-sm font-bold text-ink/50 font-body">Type at least 2 characters to search users.</p>
                    ) : userResults.length === 0 ? (
                      <p className="p-4 text-sm font-bold text-ink/50 font-body">No matching users found.</p>
                    ) : (
                      <div className="divide-y divide-ink border-t-[var(--border-w)] border-ink">
                        {userResults.map((result) => (
                          <button
                            key={result._id}
                            type="button"
                            onClick={() => setSelectedUser(result)}
                            className="w-full text-left p-4 flex items-center justify-between gap-4 transition-colors hover:bg-highlighter/10"
                          >
                            <div className="min-w-0">
                              <p className="font-display font-black text-ink uppercase tracking-tight text-lg truncate">{result.name}</p>
                              <p className="text-sm text-ink/70 font-body truncate">{result.email}</p>
                            </div>
                            <span className="text-xs font-bold text-ink/50 shrink-0">
                              {result.college || "No college"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section>
                <label className="block text-xs font-display font-black text-ink uppercase tracking-wider mb-2">
                  Refer Code
                </label>
                <input
                  required
                  value={referCodeInput}
                  onChange={(event) => setReferCodeInput(event.target.value.toUpperCase())}
                  placeholder="Enter manually assigned refer code"
                  className="w-full h-11 px-4 brutal-block-sm bg-paper-blue text-sm font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-ink focus:bg-paper"
                />
                <p className="mt-2 text-xs text-ink/50 font-bold font-body">
                  Use the exact code you want assigned. Codes must be unique.
                </p>
              </section>

              <button
                type="submit"
                disabled={creatingAmbassador || !selectedUser}
                className="w-full brutal-block-sm bg-signal-orange text-ink font-display font-bold py-3 uppercase tracking-tight hover:bg-signal-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingAmbassador ? (
                  <BrutalLoader size="sm" />
                ) : (
                  <BadgeCheck className="w-4 h-4 text-ink" strokeWidth={3} />
                )}
                Create Ambassador
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="brutal-block-sm bg-paper px-3 py-2 min-w-0">
    <p className="text-[10px] font-mono font-black uppercase tracking-wider text-ink/50 mb-1">{label}</p>
    <p className="text-sm font-bold text-ink truncate">{value}</p>
  </div>
);

const Detail = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="brutal-block-sm bg-paper p-3 min-w-0">
    <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-ink/50 mb-1">
      {icon}
      {label}
    </div>
    <p className="font-bold text-ink wrap-break-words">{value}</p>
  </div>
);

export default AdminAmbassadorsPanel;
