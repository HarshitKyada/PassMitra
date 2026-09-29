import React, { useState, useEffect } from 'react';
import { SwapRequest, User } from '../types/index.ts';
import { fetchRequests, acceptRequest, declineRequest, cancelRequest } from '../lib/api.ts';

interface RequestsHubProps {
  currentUser: User | null;
  onOpenConnection: (connectionId: string) => void;
  onNavigateHome: () => void;
}

export const RequestsHub: React.FC<RequestsHubProps> = ({
  currentUser,
  onOpenConnection,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('ALL');

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reqId: string) => {
    try {
      setActionLoading(reqId);
      const res = await acceptRequest(reqId);
      if (res.connection) {
        onOpenConnection(res.connection.id);
      } else {
        await loadRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Error accepting request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    if (!confirm('Are you sure you want to decline this request?')) return;
    try {
      setActionLoading(reqId);
      await declineRequest(reqId);
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Error declining request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (reqId: string) => {
    if (!confirm('Withdraw this exchange inquiry?')) return;
    try {
      setActionLoading(reqId);
      await cancelRequest(reqId);
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Error canceling request');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const isReceived = r.toUserId === (currentUser?.id || 'demo-seller-1');
    const isSent = r.fromUserId === (currentUser?.id || 'demo-seller-1');
    const matchesDirection = activeTab === 'RECEIVED' ? isReceived : isSent;
    if (!matchesDirection) return false;

    if (statusFilter === 'PENDING') return r.status === 'PENDING';
    if (statusFilter === 'ACCEPTED') return r.status === 'ACCEPTED';
    return true;
  });

  const pendingReceivedCount = requests.filter(
    (r) => r.toUserId === (currentUser?.id || 'demo-seller-1') && r.status === 'PENDING'
  ).length;

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header with quiet status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#9E96B0] mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Live Handover Dispatch</span>
              <span aria-hidden="true">·</span>
              <span>15-Minute Auto-Expiry Guard</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#FAF8F5] tracking-tight">
              Pass Inquiries & Meetups
            </h1>
            <p className="text-xs text-[#9E96B0] mt-1">
              Accepting an inquiry opens a secure Rendezvous screen and reveals mutual verified phone numbers.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="inline-flex p-1 rounded-xl bg-[#14121E] border border-white/[0.08]">
            <button
              onClick={() => setActiveTab('RECEIVED')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'RECEIVED'
                  ? 'bg-[#E5A93C] text-[#0C0A14] shadow-sm'
                  : 'text-[#9E96B0] hover:text-[#FAF8F5]'
              }`}
            >
              <span>Received Requests</span>
              {pendingReceivedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-[#0C0A14]/20 text-[#0C0A14] text-[10px] font-bold">
                  {pendingReceivedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('SENT')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'SENT'
                  ? 'bg-[#E5A93C] text-[#0C0A14] shadow-sm'
                  : 'text-[#9E96B0] hover:text-[#FAF8F5]'
              }`}
            >
              Outgoing Inquiries
            </button>
          </div>

          {/* Filter Status Selector */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {(['ALL', 'PENDING', 'ACCEPTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === tab
                    ? 'bg-white/[0.12] text-[#FAF8F5] font-semibold'
                    : 'text-[#9E96B0] hover:text-[#FAF8F5]'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'PENDING' ? 'Pending' : 'Accepted'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#14121E] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-6 bg-[#14121E] rounded-2xl border border-white/[0.08]">
            <h3 className="font-heading font-bold text-base text-[#FAF8F5] mb-1">
              No {activeTab === 'RECEIVED' ? 'Received' : 'Outgoing'} Inquiries
            </h3>
            <p className="text-xs text-[#9E96B0] max-w-sm mx-auto mb-4">
              {activeTab === 'RECEIVED'
                ? "You have no active incoming requests. Spare passes listed for tonight get claimed quickly."
                : 'Browse available garba passes and send an inquiry to coordinate gate handover.'}
            </p>
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 rounded-lg bg-[#E5A93C] text-[#0C0A14] font-semibold text-xs hover:bg-[#F3B94E] transition-colors"
            >
              Browse Ahmedabad Feed
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED';
              const totalQty = req.items.reduce((s, it) => s + it.quantity, 0);
              const totalAmt = req.items.reduce((s, it) => s + it.quantity * it.pricePerPass, 0);

              return (
                <div
                  key={req.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-[#14121E] border-[#E5A93C]/40 shadow-sm'
                      : isAccepted
                      ? 'bg-[#14121E] border-emerald-500/30'
                      : 'bg-[#14121E] border-white/[0.06] opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-xs text-[#9E96B0]">
                        <span className={`font-semibold ${isPending ? 'text-[#E5A93C]' : isAccepted ? 'text-emerald-400' : 'text-[#9E96B0]'}`}>
                          {req.status}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span aria-hidden="true">·</span>
                        <span>{req.kind === 'REQUEST' ? 'Pass Inquiry' : 'Wanted Offer'}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center font-bold text-xs text-[#FAF8F5]">
                          {req.fromUser?.name.charAt(0) || 'K'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#FAF8F5] text-sm">
                              {activeTab === 'RECEIVED' ? req.fromUser?.name : `To: ${req.toUser?.name || 'Seller'}`}
                            </span>
                            <span className="text-xs text-emerald-400 font-medium">
                              {req.fromUser?.positivePercentage ?? 96}% Trust
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9E96B0]">
                            {req.fromUser?.completedExchanges ?? 12} successful handovers in Ahmedabad
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-4 text-xs">
                        <span className="text-[#FAF8F5]">
                          <strong>{totalQty}x</strong> {req.items.map((it) => it.type).join(', ')}
                        </span>
                        <span aria-hidden="true" className="text-[#6F6882]">·</span>
                        <span className="font-mono font-bold text-[#E5A93C]">
                          ₹{totalAmt} <span className="text-[11px] text-[#9E96B0] font-normal">(Direct Settle)</span>
                        </span>
                      </div>

                      {req.message && (
                        <p className="text-xs italic text-[#9E96B0] bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      {activeTab === 'RECEIVED' && isPending && (
                        <>
                          <button
                            onClick={() => handleAccept(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm"
                          >
                            {actionLoading === req.id ? 'Connecting...' : 'Accept & Reveal Numbers'}
                          </button>
                          <button
                            onClick={() => handleDecline(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 rounded-lg text-xs text-[#9E96B0] hover:text-rose-400 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {activeTab === 'SENT' && isPending && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1.5 rounded-lg text-xs text-[#9E96B0] hover:text-rose-400 transition-colors"
                        >
                          Withdraw Inquiry
                        </button>
                      )}

                      {isAccepted && (
                        <button
                          onClick={() => onOpenConnection(`conn-${req.id}`)}
                          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0C0A14] font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <span>Open Rendezvous Screen</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
