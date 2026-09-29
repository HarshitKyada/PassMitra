import React, { useState, useEffect } from 'react';
import { Listing, User } from '../types/index.ts';
import { fetchListing, sendSwapRequest } from '../lib/api.ts';
import { LeafletMap } from '../components/LeafletMap.tsx';
import { ReportModal } from '../components/ReportModal.tsx';

export interface ListingDetailProps {
  listingId: string;
  currentUser: User | null;
  onOpenAuth?: () => void;
  onOpenLogin?: () => void;
  onNavigateRequests?: () => void;
  onOpenConnection?: (connId: string) => void;
  onBack: () => void;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({
  listingId,
  currentUser,
  onOpenAuth,
  onOpenLogin,
  onNavigateRequests,
  onBack
}) => {
  const handleAuth = onOpenLogin || onOpenAuth || (() => {});
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestQty, setRequestQty] = useState(1);
  const [buyerNote, setBuyerNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchListing(listingId)
      .then((res: any) => {
        setListing(res.listing || res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [listingId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#E5A93C] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-[#9E96B0]">Loading verified pass details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-lg font-bold text-[#FAF8F5]">Pass Listing Not Found</h2>
        <p className="text-xs text-[#9E96B0]">This listing may have already been claimed or withdrawn.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-white/[0.08] text-xs font-semibold text-[#FAF8F5]"
        >
          ← Return to Feed
        </button>
      </div>
    );
  }

  const primaryItem = listing.items[0];
  const maxAvailable = primaryItem?.remaining || 1;
  const totalPrice = (primaryItem?.askingPrice || 800) * requestQty;

  async function handleSendRequest() {
    if (!currentUser) {
      handleAuth();
      return;
    }

    setIsSending(true);
    try {
      await sendSwapRequest({
        kind: 'REQUEST',
        listingId: listing!.id,
        items: [
          {
            type: primaryItem.type,
            quantity: requestQty,
            pricePerPass: primaryItem.askingPrice
          }
        ],
        message: buyerNote
      });

      setSentSuccess(true);
      setTimeout(() => {
        if (onNavigateRequests) onNavigateRequests();
        else onBack();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to send request');
    } finally {
      setIsSending(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6 text-xs text-[#9E96B0]">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 hover:text-[#FAF8F5] transition-colors"
          >
            <span>← Back to Ahmedabad Feed</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[#E5A93C] font-semibold">Night {listing.night} Entry</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">Statutory MRP Capped</span>
            <button
              onClick={handleCopyLink}
              className="text-[#9E96B0] hover:text-[#FAF8F5] transition-colors ml-2"
              title="Copy Link"
            >
              {copiedLink ? 'Copied Link ✓' : 'Share'}
            </button>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Pass Presentation, Map, Verification */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Pass Presentation Card */}
            <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="space-y-2 border-b border-white/[0.06] pb-6">
                <div className="flex items-center gap-2 text-xs text-[#9E96B0]">
                  <span className="text-[#E5A93C] font-semibold">Verified Wristband</span>
                  <span aria-hidden="true">·</span>
                  <span>Night {listing.night}</span>
                  <span aria-hidden="true">·</span>
                  <span>{listing.area}</span>
                </div>

                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#FAF8F5] tracking-tight">
                  {listing.event?.name}
                </h1>

                <p className="text-xs text-[#9E96B0]">
                  Official printed face value: <strong className="text-[#FAF8F5]">₹{primaryItem.printedPrice}</strong> · No markup, zero premium allowed.
                </p>
              </div>

              {/* Pass Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[11px] text-[#9E96B0] block">Access Type</span>
                  <span className="font-bold text-sm text-[#FAF8F5] mt-0.5 block">{primaryItem.type}</span>
                  <span className="text-[10px] text-[#E5A93C]">{primaryItem.remaining} pass available</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[11px] text-[#9E96B0] block">Official MRP</span>
                  <span className="font-mono text-sm font-bold text-[#E5A93C] mt-0.5 block">₹{primaryItem.askingPrice}</span>
                  <span className="text-[10px] text-emerald-400">Strictly Capped</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[11px] text-[#9E96B0] block">Gate Access</span>
                  <span className="font-bold text-sm text-[#FAF8F5] mt-0.5 block">Gate 2 / Main</span>
                  <span className="text-[10px] text-[#9E96B0]">Fast-track turnstile</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[11px] text-[#9E96B0] block">Security Foil</span>
                  <span className="font-bold text-sm text-emerald-400 mt-0.5 block">Holographic</span>
                  <span className="text-[10px] text-[#9E96B0]">UV Ink Stamped</span>
                </div>
              </div>

              {/* Watermark Protection Note */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E5A93C]/10 flex items-center justify-center text-[#E5A93C] shrink-0 font-bold">
                  🛡️
                </div>
                <div className="text-xs text-[#9E96B0] leading-relaxed">
                  <span className="text-[#FAF8F5] font-semibold block mb-0.5">Watermark Shielded Handover</span>
                  Barcode serial numbers remain masked until mutual inquiry acceptance. Mutual Indian mobile numbers (+91) are revealed exclusively inside the Rendezvous channel.
                </div>
              </div>
            </div>

            {/* Meetup Landmark & Map */}
            <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#FAF8F5]">Agreed Meetup Point</h3>
                  <p className="text-xs text-[#9E96B0]">{listing.meetingPoint.landmark}</p>
                </div>
                <span className="text-xs text-[#E5A93C] font-semibold">Public Lit Area</span>
              </div>

              <LeafletMap
                coordinates={listing.meetingPoint.location.coordinates}
                title={listing.event?.venueName || 'Venue'}
                landmark={listing.meetingPoint.landmark}
                policePostNearby="Ahmedabad Police Bandobast Kiosk (50m)"
                height="220px"
              />
            </div>

            {/* Seller Reputation Profile Card */}
            <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E5A93C]/15 border border-[#E5A93C]/30 flex items-center justify-center text-lg font-bold text-[#E5A93C]">
                  {listing.seller?.name ? listing.seller.name[0] : 'K'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#FAF8F5] text-sm">
                      {listing.seller?.name || 'Verified Khelaiya'}
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">✓ Phone Verified</span>
                  </div>
                  <p className="text-xs text-[#9E96B0]">
                    {listing.seller?.positivePercentage || 100}% Trust Rating · {listing.seller?.completedExchanges || 14} successful handovers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="text-xs text-[#9E96B0] hover:text-rose-400 transition-colors self-start sm:self-auto"
              >
                Report Listing
              </button>
            </div>
          </div>

          {/* Right Column: Handshake Request Action Desk */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#14121E] border border-[#E5A93C]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm sticky top-24">
              <div>
                <span className="text-xs font-semibold text-[#E5A93C] uppercase tracking-wider block">
                  Peer-to-Peer Handshake
                </span>
                <h2 className="font-heading font-bold text-xl text-[#FAF8F5] mt-1">
                  Request Pass Handover
                </h2>
                <p className="text-xs text-[#9E96B0] mt-1">
                  No payment is required right now. Settle directly via UPI or cash at the meeting gate after physical pass inspection.
                </p>
              </div>

              {sentSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 text-center">
                  <div className="text-lg">✓</div>
                  <p className="font-bold">Inquiry Sent to Seller!</p>
                  <p className="text-[11px] text-[#9E96B0]">
                    Redirecting to your Exchanges hub...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div>
                    <label className="text-xs font-medium text-[#9E96B0] block mb-1.5">
                      Quantity of Passes
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg">
                        <button
                          type="button"
                          onClick={() => setRequestQty(Math.max(1, requestQty - 1))}
                          className="px-3 py-1.5 text-[#9E96B0] hover:text-[#FAF8F5] text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono text-sm font-bold px-3 text-[#FAF8F5]">
                          {requestQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRequestQty(Math.min(maxAvailable, requestQty + 1))}
                          className="px-3 py-1.5 text-[#9E96B0] hover:text-[#FAF8F5] text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-[#9E96B0]">
                        Max {maxAvailable} pass available
                      </span>
                    </div>
                  </div>

                  {/* Note to Seller */}
                  <div>
                    <label className="text-xs font-medium text-[#9E96B0] block mb-1.5">
                      Meetup Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arriving by 8:15 PM at Gate 2"
                      value={buyerNote}
                      onChange={(e) => setBuyerNote(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-3.5 py-2 text-xs text-[#FAF8F5] focus:outline-none placeholder:text-[#6F6882]"
                    />
                  </div>

                  {/* Total calculation */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#9E96B0] block">Settlement Total</span>
                      <span className="text-[10px] text-[#6F6882]">Due upon physical verification</span>
                    </div>
                    <span className="font-mono text-2xl font-bold text-[#E5A93C]">
                      ₹{totalPrice}
                    </span>
                  </div>

                  {/* Primary Request Action Button */}
                  <button
                    type="button"
                    onClick={handleSendRequest}
                    disabled={isSending}
                    className="w-full py-3 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
                  >
                    {isSending ? 'Sending Handshake Request...' : 'Send Handover Request'}
                  </button>

                  <div className="text-[11px] text-[#6F6882] text-center leading-relaxed">
                    Zero platform fees · Seller has 15 minutes to respond before inquiry auto-expires.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="LISTING"
        targetId={listing.id}
        targetName={listing.event?.name}
        onSuccess={() => {
          alert('Report submitted to Trust Desk for immediate review.');
        }}
      />
    </div>
  );
};
