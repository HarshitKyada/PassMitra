import React, { useState, useEffect } from 'react';
import { GarbaEvent, PassType, PassFormat, User } from '../types/index.ts';
import { fetchEvents, createListing, createWantedPost } from '../lib/api.ts';

export interface PostPassesProps {
  currentUser: User | null;
  onPostSuccess?: (newId: string) => void;
  onSuccess?: (newId: string) => void;
  onCancel?: () => void;
  onOpenAuth?: () => void;
}

export const PostPasses: React.FC<PostPassesProps> = ({
  currentUser,
  onPostSuccess,
  onSuccess,
  onCancel,
  onOpenAuth
}) => {
  const handleSuccess = onSuccess || onPostSuccess || (() => {});
  const [postMode, setPostMode] = useState<'HAVE' | 'WANTED'>('HAVE');
  const [events, setEvents] = useState<GarbaEvent[]>([]);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedNight, setSelectedNight] = useState<number>(4);
  const [selectedPassType, setSelectedPassType] = useState<PassType>('COUPLE');
  const [passFormat, setPassFormat] = useState<PassFormat>('WRISTBAND');
  const [quantity, setQuantity] = useState<number>(1);
  const [printedPrice, setPrintedPrice] = useState<number>(800);
  const [askingPrice, setAskingPrice] = useState<number>(800);
  const [landmark, setLandmark] = useState<string>('Main Gate Turnstile Bandobast');
  const [buyerNote, setBuyerNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents().then((res: any) => {
      const list: GarbaEvent[] = Array.isArray(res) ? res : res.events || [];
      setEvents(list);
      if (list.length > 0 && !selectedEventId) {
        setSelectedEventId(list[0].id);
      }
    });
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  useEffect(() => {
    if (activeEvent) {
      const matchedPrice = activeEvent.passPrices.find((p) => p.type === selectedPassType);
      if (matchedPrice) {
        setPrintedPrice(matchedPrice.officialPrice);
        setAskingPrice(matchedPrice.officialPrice);
      }
    }
  }, [selectedEventId, selectedPassType, activeEvent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (askingPrice > printedPrice) {
      setErrorMessage(`Strict Policy Violation: Asking price (₹${askingPrice}) cannot exceed printed official MRP (₹${printedPrice}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (postMode === 'HAVE') {
        const res = await createListing({
          eventId: selectedEventId,
          night: selectedNight,
          area: activeEvent?.area || 'Bodakdev & West',
          meetingPoint: {
            landmark,
            location: activeEvent?.location || { type: 'Point', coordinates: [72.5074, 23.0338] }
          },
          items: [
            {
              type: selectedPassType,
              format: passFormat,
              printedPrice,
              askingPrice,
              totalQuantity: quantity
            }
          ],
          photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
          genuineCertified: true
        });

        handleSuccess(res.listing.id);
      } else {
        const res = await createWantedPost({
          eventId: selectedEventId,
          night: selectedNight,
          area: activeEvent?.area || 'Bodakdev & West',
          items: [{ type: selectedPassType, quantity }],
          maxPricePerPass: askingPrice,
          note: buyerNote || `Need ${quantity}x ${selectedPassType} passes outside ${activeEvent?.venueName}`
        });

        handleSuccess(res.wantedPost.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[#9E96B0] mb-2">
            <span>Direct Khelaiya Exchange</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#E5A93C] font-semibold">Statutory MRP Capped</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#FAF8F5] tracking-tight">
            {postMode === 'HAVE' ? 'Post Spare Garba Pass' : 'Post Passes Wanted'}
          </h1>
          <p className="text-xs text-[#9E96B0] mt-1">
            PassMitra is strictly non-profit. Tickets are exchanged hand-to-hand at official printed MRP.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-[#14121E] border border-white/[0.08] mb-8 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPostMode('HAVE')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              postMode === 'HAVE'
                ? 'bg-[#E5A93C] text-[#0C0A14] shadow-sm'
                : 'text-[#9E96B0] hover:text-[#FAF8F5]'
            }`}
          >
            I Have Extra Passes
          </button>
          <button
            type="button"
            onClick={() => setPostMode('WANTED')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              postMode === 'WANTED'
                ? 'bg-[#E5A93C] text-[#0C0A14] shadow-sm'
                : 'text-[#9E96B0] hover:text-[#FAF8F5]'
            }`}
          >
            Looking For Passes
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Venue Selection */}
          <div>
            <label className="text-xs font-medium text-[#9E96B0] block mb-2">
              Garba Venue & Organizer
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id} className="bg-[#14121E] text-[#FAF8F5]">
                  {evt.name} ({evt.area})
                </option>
              ))}
            </select>
          </div>

          {/* Night Selector */}
          <div>
            <label className="text-xs font-medium text-[#9E96B0] block mb-2">
              Navratri Night
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelectedNight(n)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedNight === n
                      ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold shadow-sm'
                      : 'bg-white/[0.02] border border-white/[0.06] text-[#9E96B0] hover:text-[#FAF8F5]'
                  }`}
                >
                  N{n}
                </button>
              ))}
            </div>
          </div>

          {/* Pass Type & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-2">
                Pass Category
              </label>
              <select
                value={selectedPassType}
                onChange={(e) => setSelectedPassType(e.target.value as PassType)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
              >
                <option value="COUPLE" className="bg-[#14121E]">Couple Pass</option>
                <option value="FEMALE" className="bg-[#14121E]">Female Pass</option>
                <option value="MALE" className="bg-[#14121E]">Male Stag</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-2">
                Pass Format
              </label>
              <select
                value={passFormat}
                onChange={(e) => setPassFormat(e.target.value as PassFormat)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
              >
                <option value="WRISTBAND" className="bg-[#14121E]">Physical Fabric Wristband</option>
                <option value="PHYSICAL_CARD" className="bg-[#14121E]">Physical Pass Card (RFID/Stub)</option>
              </select>
            </div>
          </div>

          {/* Quantity & Official MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-2">
                Quantity Available
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2 text-xs text-[#FAF8F5] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-2">
                Printed Official MRP (₹)
              </label>
              <input
                type="number"
                value={askingPrice}
                onChange={(e) => setAskingPrice(Number(e.target.value))}
                max={printedPrice}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2 text-xs text-[#E5A93C] font-mono font-bold focus:outline-none"
              />
              <span className="text-[10px] text-[#6F6882] mt-1 block">
                Official cap: ₹{printedPrice} · Over-MRP asks are blocked
              </span>
            </div>
          </div>

          {/* Meeting Point Landmark */}
          <div>
            <label className="text-xs font-medium text-[#9E96B0] block mb-2">
              Designated Public Meeting Point
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Gate 2 Turnstile / Police Post"
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
              required
            />
          </div>

          {postMode === 'WANTED' && (
            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-2">
                Buyer Message / Timing
              </label>
              <input
                type="text"
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
                placeholder="e.g. Arriving near venue by 8:30 PM with friends"
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? 'Publishing...' : postMode === 'HAVE' ? 'Publish Pass Listing' : 'Broadcast Wanted Request'}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-3 rounded-lg bg-white/[0.04] text-[#9E96B0] hover:text-[#FAF8F5] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
