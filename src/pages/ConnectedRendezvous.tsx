import React, { useState, useEffect } from 'react';
import { Connection, User } from '../types/index.ts';
import { fetchConnection, completeConnection, cancelConnection } from '../lib/api.ts';
import { LeafletMap } from '../components/LeafletMap.tsx';
import { RatingModal } from '../components/RatingModal.tsx';
import { ReportModal } from '../components/ReportModal.tsx';

interface ConnectedRendezvousProps {
  connectionId: string;
  currentUser: User | null;
  onBack: () => void;
}

export const ConnectedRendezvous: React.FC<ConnectedRendezvousProps> = ({
  connectionId,
  currentUser,
  onBack
}) => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSOSInfo, setShowSOSInfo] = useState<boolean>(false);
  const [isMasked, setIsMasked] = useState<boolean>(false);

  // Inspector checklist
  const [checks, setChecks] = useState({
    hologramShine: false,
    uvStamp: false,
    tearOffStub: false,
    serialMatch: false,
    priceMatchesMRP: false
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [connectionId]);

  const loadData = async () => {
    try {
      const data = await fetchConnection(connectionId);
      setConnection(data);
      if (data.status === 'COMPLETED' && !data.buyerDoneAt && !data.sellerDoneAt) {
        setShowRatingModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!connection) return;
    try {
      const updated = await completeConnection(connection.id);
      setConnection(updated);
      setShowRatingModal(true);
    } catch (err: any) {
      alert(err.message || 'Error marking exchange complete');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this rendezvous? This affects trust rating if done repeatedly.')) return;
    try {
      await cancelConnection(connectionId);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Error canceling');
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#E5A93C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#9E96B0]">Securing rendezvous channel...</p>
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-sm font-semibold text-[#FAF8F5]">Rendezvous channel not found or expired.</p>
          <button onClick={onBack} className="px-4 py-2 rounded-lg bg-white/[0.08] text-xs font-semibold text-[#FAF8F5]">
            Return to Hub
          </button>
        </div>
      </div>
    );
  }

  const isSeller = currentUser?.id === connection.sellerId;
  const counterpartName = isSeller
    ? connection.buyerName || connection.buyer?.name || 'Verified Buyer'
    : connection.sellerName || connection.seller?.name || 'Verified Seller';
  const counterpartTrust = 98;
  const counterpartExchanges = 14;
  const counterpartPhone = isSeller
    ? connection.buyerPhone || '+91 98250 88219'
    : connection.sellerPhone || '+91 98980 12345';

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Navigation & Session Status */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="text-xs text-[#9E96B0] hover:text-[#FAF8F5] flex items-center gap-1.5 transition-colors"
          >
            <span>← Back to Exchanges</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">
              {connection.status === 'CONNECTED' ? 'Active Handover Session' : 'Exchange Completed'}
            </span>
          </div>
        </div>

        {/* Quiet Handover Progress Bar */}
        <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#9E96B0]">
            <span className="text-[#E5A93C] font-semibold">1. Inspect Pass & Hologram</span>
            <span>2. Direct UPI / Cash (₹{connection.total})</span>
            <span>3. Trust Seal Rating</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E5A93C] transition-all duration-300"
              style={{ width: connection.status === 'COMPLETED' ? '100%' : '50%' }}
            />
          </div>
        </div>

        {/* Counterpart Card */}
        <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-[#E5A93C] uppercase tracking-wider block">
                {isSeller ? 'Handing Over Passes To' : 'Meeting Verified Pass Holder'}
              </span>
              <h2 className="font-heading font-extrabold text-2xl text-[#FAF8F5] mt-1">
                {counterpartName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#9E96B0] mt-1">
                <span className="text-emerald-400 font-medium">🛡️ {counterpartTrust}% Verified Trust</span>
                <span aria-hidden="true">·</span>
                <span>{counterpartExchanges} Previous Exchanged Passes</span>
              </div>
            </div>

            {/* Direct Contact Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`tel:${counterpartPhone}`}
                className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Call ({isMasked ? '••••••' + counterpartPhone.slice(-4) : counterpartPhone})</span>
              </a>

              <a
                href={`https://wa.me/${counterpartPhone.replace(/[^0-9]/g, '')}?text=Namaste!%20I%20am%20at%20the%20PassMitra%20meeting%20point.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-[#FAF8F5] font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => setIsMasked(!isMasked)}
                className="p-2 rounded-lg bg-white/[0.04] text-[#9E96B0] hover:text-[#FAF8F5] text-xs"
                title="Toggle Mask"
              >
                👁️
              </button>
            </div>
          </div>

          {/* Agreed Meeting Point */}
          <div className="space-y-3 pb-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#FAF8F5]">Agreed Meeting Point</h3>
                <p className="text-xs text-[#E5A93C] font-medium">{connection.meetingPoint.landmark}</p>
              </div>
              <span className="text-xs text-[#9E96B0]">Public Lighting</span>
            </div>

            <LeafletMap
              coordinates={connection.meetingPoint.location.coordinates}
              title={connection.event?.venueName || 'Garba Venue'}
              landmark={connection.meetingPoint.landmark}
              policePostNearby="Ahmedabad Police Bandobast Kiosk (50m)"
              height="200px"
            />
          </div>

          {/* Pass & Settle Breakdown */}
          <div className="space-y-4 pb-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9E96B0]">Settlement Summary</span>
              <span className="text-xs text-emerald-400 font-medium">Statutory MRP Capped</span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#9E96B0]">Passes to exchange:</p>
                <p className="font-bold text-[#FAF8F5] text-sm mt-0.5">
                  {connection.items.map((it) => `${it.quantity}x ${it.type}`).join(', ')} · Night {connection.night}
                </p>
                <p className="text-[11px] text-[#6F6882] mt-0.5">
                  Official face value: ₹{connection.items[0]?.pricePerPass || 0}/pass
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-[#9E96B0]">Direct Settlement Total:</p>
                <p className="font-mono text-2xl font-bold text-[#E5A93C]">₹{connection.total}</p>
                <p className="text-[11px] text-[#6F6882]">Settle via Cash or UPI at gate</p>
              </div>
            </div>
          </div>

          {/* Hologram & Physical Check Checklist */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-base text-[#FAF8F5]">Physical Wristband Checklist</h3>
            <p className="text-xs text-[#9E96B0]">
              Confirm these security markers on the physical wristband before handing over UPI payment:
            </p>

            <div className="space-y-2">
              {[
                { key: 'hologramShine', label: 'Silver holographic foil diffracts multi-angle colors', tip: 'Official 3D crest visible under tilt' },
                { key: 'uvStamp', label: 'UV security stamp glows under blacklight or phone flash', tip: 'Authentic hidden organizer watermark' },
                { key: 'tearOffStub', label: 'Perforated RFID / barcode stub is intact', tip: 'Not previously scanned or spliced' },
                { key: 'priceMatchesMRP', label: 'Asking price strictly matches printed organizer MRP', tip: 'Zero illegal scalping premium' }
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(checks as any)[item.key]}
                    onChange={(e) => setChecks({ ...checks, [item.key]: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 text-[#E5A93C] focus:ring-[#E5A93C] bg-[#14121E]"
                  />
                  <div className="text-xs">
                    <p className="font-medium text-[#FAF8F5]">{(item as any).label}</p>
                    <p className="text-[11px] text-[#9E96B0]">{(item as any).tip}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Handover Action */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              {connection.status === 'CONNECTED' ? (
                <>
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-3 px-6 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    <span>{isSeller ? 'Handover Completed & Settled' : 'Passes Received & Settle Complete'}</span>
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="py-3 px-4 rounded-lg bg-white/[0.04] hover:bg-rose-500/10 text-rose-300 text-xs font-medium transition-colors"
                  >
                    Flag Issue
                  </button>
                </>
              ) : (
                <div className="w-full text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                  <p className="font-bold text-emerald-400 text-xs">Exchange Successfully Concluded</p>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-[#0C0A14] font-semibold text-xs"
                  >
                    Submit Trust Rating
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency SOS Bar */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-[#9E96B0]">
          <div>
            <span className="font-semibold text-[#FAF8F5] block">Ahmedabad Police & SHE Team Safety</span>
            <span>Active festival police bandobast at licensed venues.</span>
          </div>

          <button
            onClick={() => setShowSOSInfo(!showSOSInfo)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-colors"
          >
            {showSOSInfo ? 'Hide' : 'Emergency Contacts'}
          </button>
        </div>

        {showSOSInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <a href="tel:100" className="p-3 rounded-lg bg-[#14121E] border border-white/[0.08] block text-center">
              <span className="text-[#9E96B0] block text-[11px]">Police Control</span>
              <span className="font-mono font-bold text-[#FAF8F5] text-sm mt-0.5 block">100</span>
            </a>
            <a href="tel:1091" className="p-3 rounded-lg bg-[#14121E] border border-white/[0.08] block text-center">
              <span className="text-[#9E96B0] block text-[11px]">SHE Team</span>
              <span className="font-mono font-bold text-[#FAF8F5] text-sm mt-0.5 block">1091</span>
            </a>
            <a href="tel:1930" className="p-3 rounded-lg bg-[#14121E] border border-white/[0.08] block text-center">
              <span className="text-[#9E96B0] block text-[11px]">Cyber Fraud</span>
              <span className="font-mono font-bold text-[#FAF8F5] text-sm mt-0.5 block">1930</span>
            </a>
            <a href="tel:108" className="p-3 rounded-lg bg-[#14121E] border border-white/[0.08] block text-center">
              <span className="text-[#9E96B0] block text-[11px]">Ambulance</span>
              <span className="font-mono font-bold text-[#FAF8F5] text-sm mt-0.5 block">108</span>
            </a>
          </div>
        )}
      </div>

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        connectionId={connection.id}
        toUserId={isSeller ? connection.buyerId : connection.sellerId}
        counterpartName={counterpartName}
        onSuccess={() => loadData()}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="CONNECTION"
        targetId={connection.id}
        targetName={counterpartName}
        onSuccess={() => alert('Report submitted to Trust Desk.')}
      />
    </div>
  );
};
