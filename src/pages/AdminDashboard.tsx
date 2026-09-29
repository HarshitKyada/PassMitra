import React, { useState, useEffect } from 'react';
import { Report, Listing, User } from '../types/index.ts';
import { fetchReports, handleReportAction, fetchListings, banUser, closeListing } from '../lib/api.ts';

interface AdminDashboardProps {
  currentUser: User | null;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onBack }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'TONIGHT_LISTINGS'>('REPORTS');
  const [loading, setLoading] = useState<boolean>(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reps, lists] = await Promise.all([fetchReports(), fetchListings()]);
      setReports(reps);
      setListings(lists);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'DISMISS' | 'REMOVE_ITEM' | 'BAN_USER') => {
    try {
      setActioningId(reportId);
      await handleReportAction(reportId, action, `Actioned by admin ${currentUser?.name || 'Moderator'}`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error processing report');
    } finally {
      setActioningId(null);
    }
  };

  const handleTakeDownListing = async (listingId: string) => {
    if (!confirm('Takedown this listing from the live Ahmedabad feed?')) return;
    try {
      await closeListing(listingId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error closing listing');
    }
  };

  const handleBanSeller = async (userId: string, userName: string) => {
    if (!confirm(`Ban user "${userName}" from PassMitra for scalping / fraudulent activity?`)) return;
    try {
      await banUser(userId, 'Statutory MRP violation / scalping reported');
      alert(`User ${userName} has been banned.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error banning user');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="text-xs text-[#9E96B0] hover:text-[#FAF8F5] flex items-center gap-1.5 mb-2 transition-colors"
            >
              <span>← Exit Admin Console</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-[#9E96B0] mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Ahmedabad Anti-Scalping Trust Desk</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#FAF8F5] tracking-tight">
              Moderator Control Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#14121E] border border-white/[0.08] text-center w-28">
              <span className="font-mono text-xl font-bold text-rose-400">
                {reports.filter((r) => r.status === 'OPEN').length}
              </span>
              <p className="text-[10px] text-[#9E96B0] uppercase mt-0.5">Open Flags</p>
            </div>
            <div className="p-3 rounded-xl bg-[#14121E] border border-white/[0.08] text-center w-28">
              <span className="font-mono text-xl font-bold text-[#E5A93C]">{listings.length}</span>
              <p className="text-[10px] text-[#9E96B0] uppercase mt-0.5">Active Passes</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/[0.08] pb-3">
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'REPORTS'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-[#9E96B0] hover:text-[#FAF8F5]'
            }`}
          >
            Flagged Reports ({reports.filter((r) => r.status === 'OPEN').length})
          </button>

          <button
            onClick={() => setActiveTab('TONIGHT_LISTINGS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'TONIGHT_LISTINGS'
                ? 'bg-[#E5A93C] text-[#0C0A14] shadow-sm'
                : 'text-[#9E96B0] hover:text-[#FAF8F5]'
            }`}
          >
            Live Passes Feed ({listings.length})
          </button>
        </div>

        {/* Tab 1: Reports */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="p-12 text-center bg-[#14121E] rounded-2xl border border-white/[0.08]">
                <p className="font-semibold text-sm text-[#FAF8F5]">Zero Open Reports</p>
                <p className="text-xs text-[#9E96B0] mt-1">All user flags have been resolved.</p>
              </div>
            ) : (
              reports.map((rep) => {
                const isOpen = rep.status === 'OPEN';
                return (
                  <div
                    key={rep.id}
                    className={`p-6 rounded-2xl border transition-colors ${
                      isOpen ? 'bg-[#14121E] border-rose-500/30' : 'bg-[#14121E] border-white/[0.06] opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 text-xs text-[#9E96B0]">
                          <span className={`font-semibold ${isOpen ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {rep.status}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#FAF8F5]">Reason: {rep.reason.replace(/_/g, ' ')}</span>
                          <span aria-hidden="true">·</span>
                          <span>Target: {rep.targetType}</span>
                        </div>

                        <p className="text-sm font-medium text-[#FAF8F5]">"{rep.details}"</p>

                        <div className="text-xs text-[#6F6882]">
                          Reported by {rep.reporter?.name || rep.reporterId || 'Anonymous User'} · {new Date(rep.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleResolveReport(rep.id, 'REMOVE_ITEM')}
                            disabled={actioningId === rep.id}
                            className="px-3 py-1.5 rounded-lg bg-[#E5A93C] text-[#0C0A14] font-semibold text-xs"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'BAN_USER')}
                            disabled={actioningId === rep.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs"
                          >
                            Ban
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'DISMISS')}
                            disabled={actioningId === rep.id}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-[#9E96B0] hover:text-[#FAF8F5] text-xs"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Tonight's Listings */}
        {activeTab === 'TONIGHT_LISTINGS' && (
          <div className="space-y-4">
            {listings.map((item) => {
              const minPrice = Math.min(...item.items.map((i) => i.askingPrice));
              const totalRemaining = item.items.reduce((s, it) => s + it.remaining, 0);

              return (
                <div
                  key={item.id}
                  className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#9E96B0]">
                      <span className="text-[#E5A93C] font-semibold">Night {item.night}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#FAF8F5] font-medium">{item.event?.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.area}</span>
                    </div>

                    <p className="text-xs text-[#9E96B0]">
                      Seller: <strong className="text-[#FAF8F5]">{item.seller?.name || item.sellerId}</strong> · {totalRemaining} passes remaining · ₹{minPrice} asking MRP
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTakeDownListing(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors"
                    >
                      Take Down
                    </button>
                    <button
                      onClick={() => handleBanSeller(item.sellerId, item.seller?.name || 'Seller')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
                    >
                      Ban User
                    </button>
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
