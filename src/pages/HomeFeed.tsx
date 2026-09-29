import React, { useState, useEffect } from 'react';
import { Listing, WantedPost, GarbaEvent, User } from '../types/index.ts';
import { fetchListings, fetchWantedPosts, fetchEvents } from '../lib/api.ts';
import { formatDistance } from '../lib/geo.ts';
import { Language, translations } from '../lib/i18n.ts';

export interface HomeFeedProps {
  onSelectListing?: (id: string) => void;
  onOpenListing?: (id: string) => void;
  onSelectWanted?: (id: string) => void;
  onNavigatePost?: () => void;
  onNavigateRequests?: () => void;
  onNavigateRadar?: () => void;
  onNavigateHologram?: () => void;
  onOpenInspector?: () => void;
  currentUser: User | null;
  lang?: Language;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onSelectListing,
  onOpenListing,
  onSelectWanted,
  onNavigatePost,
  onNavigateRequests,
  onNavigateRadar,
  onNavigateHologram,
  onOpenInspector,
  currentUser,
  lang = 'en'
}) => {
  const handleListingClick = onOpenListing || onSelectListing || (() => {});
  const handleInspectorClick = onOpenInspector || onNavigateHologram || (() => {});
  const t = translations[lang] || translations.en;

  const [feedMode, setFeedMode] = useState<'available' | 'wanted'>('available');
  const [radiusFilter, setRadiusFilter] = useState<'2km' | '5km' | 'all'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedNight, setSelectedNight] = useState<number | 'all'>('all');
  const [selectedPassType, setSelectedPassType] = useState<string>('all');

  const [listings, setListings] = useState<Listing[]>([]);
  const [wantedPosts, setWantedPosts] = useState<WantedPost[]>([]);
  const [events, setEvents] = useState<GarbaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [radiusFilter, selectedEventId, selectedNight, selectedPassType]);

  async function loadData() {
    setLoading(true);
    try {
      const [listingsData, wantedData, eventsData] = await Promise.all([
        fetchListings({
          eventId: selectedEventId === 'all' ? undefined : selectedEventId,
          night: selectedNight === 'all' ? undefined : selectedNight,
          type: selectedPassType === 'all' ? undefined : selectedPassType,
          maxDistanceKm: radiusFilter === '2km' ? 2 : radiusFilter === '5km' ? 5 : undefined
        }),
        fetchWantedPosts({
          eventId: selectedEventId === 'all' ? undefined : selectedEventId,
          night: selectedNight === 'all' ? undefined : selectedNight
        }),
        fetchEvents()
      ]);

      setListings(Array.isArray(listingsData) ? listingsData : (listingsData as any).listings || []);
      setWantedPosts(Array.isArray(wantedData) ? wantedData : (wantedData as any).wantedPosts || []);
      setEvents(Array.isArray(eventsData) ? eventsData : (eventsData as any).events || []);
    } catch (err) {
      console.error('Error loading feed data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      {/* Editorial Hero Banner */}
      <section className="relative w-full border-b border-white/[0.08] overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-[#E5A93C]/[0.06] blur-[100px]" />
          <div className="absolute top-10 right-10 w-[400px] h-[300px] bg-[#E85D75]/[0.04] blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-10 pb-8 relative z-10">
          {/* Unboxed Metadata Status Line */}
          <div className="flex items-center gap-2.5 text-xs text-[#9E96B0] mb-4">
            <span className="flex items-center gap-1.5 text-[#E5A93C] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#E5A93C] animate-pulse" />
              Night 4 of 9 Active
            </span>
            <span aria-hidden="true">·</span>
            <span>SG Highway & Bodakdev</span>
            <span aria-hidden="true">·</span>
            <span>184 Authentic Passes Exchanged Today</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline text-emerald-400 font-medium">₹0 Above-MRP Scalping Enforced</span>
          </div>

          {/* Main Title & Value Proposition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-6">
            <div className="lg:col-span-8">
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#FAF8F5] tracking-tight text-balance leading-[1.15]">
                Fair-Price Garba Pass Exchange in Ahmedabad
              </h1>
              <p className="mt-3 text-base text-[#9E96B0] max-w-2xl leading-relaxed">
                Connect directly with verified khelaiyas for physical pass handovers outside event gates. Strictly capped at statutory organizer MRP.
              </p>
            </div>

            {/* Proximity Radius Segmented Selector */}
            <div className="lg:col-span-4 flex flex-col lg:items-end gap-2">
              <span className="text-xs font-medium text-[#9E96B0]">Proximity Radius</span>
              <div className="inline-flex p-1 rounded-xl bg-[#14121E] border border-white/[0.08] shadow-sm">
                {(['2km', '5km', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      radiusFilter === r
                        ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold shadow-sm'
                        : 'text-[#9E96B0] hover:text-[#FAF8F5]'
                    }`}
                  >
                    {r === '2km' ? 'Within 2km' : r === '5km' ? 'Within 5km' : 'All City'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Bar: Segmented Tabs & Filters */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
            {/* Mode: Available vs Wanted */}
            <div className="inline-flex p-1 rounded-xl bg-[#14121E] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setFeedMode('available')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  feedMode === 'available'
                    ? 'bg-[#E5A93C] text-[#0C0A14] shadow-sm'
                    : 'text-[#9E96B0] hover:text-[#FAF8F5]'
                }`}
              >
                <span>Available Passes</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  feedMode === 'available' ? 'bg-[#0C0A14]/20 text-[#0C0A14]' : 'bg-white/[0.08] text-[#9E96B0]'
                }`}>
                  {listings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFeedMode('wanted')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  feedMode === 'wanted'
                    ? 'bg-[#E5A93C] text-[#0C0A14] shadow-sm'
                    : 'text-[#9E96B0] hover:text-[#FAF8F5]'
                }`}
              >
                <span>Looking For Pass</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  feedMode === 'wanted' ? 'bg-[#0C0A14]/20 text-[#0C0A14]' : 'bg-white/[0.08] text-[#9E96B0]'
                }`}>
                  {wantedPosts.length}
                </span>
              </button>
            </div>

            {/* Night Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                type="button"
                onClick={() => setSelectedNight('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedNight === 'all'
                    ? 'bg-white/[0.12] text-[#FAF8F5] font-semibold'
                    : 'text-[#9E96B0] hover:text-[#FAF8F5] hover:bg-white/[0.04]'
                }`}
              >
                All Nights
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelectedNight(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedNight === n
                      ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold shadow-sm'
                      : 'text-[#9E96B0] hover:text-[#FAF8F5] hover:bg-white/[0.04]'
                  }`}
                >
                  Night {n} {n === 4 && '· Tonight'}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filter Row: Venues & Category Chips */}
          <div className="pt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedEventId('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedEventId === 'all'
                  ? 'text-[#FAF8F5] font-semibold bg-white/[0.08]'
                  : 'text-[#9E96B0] hover:text-[#FAF8F5]'
              }`}
            >
              All Venues
            </button>
            {events.map((evt) => (
              <button
                key={evt.id}
                type="button"
                onClick={() => setSelectedEventId(evt.id)}
                className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                  selectedEventId === evt.id
                    ? 'text-[#FAF8F5] font-semibold bg-white/[0.08]'
                    : 'text-[#9E96B0] hover:text-[#FAF8F5]'
                }`}
              >
                {evt.name.split(' - ')[0]}
              </button>
            ))}

            <span className="text-[#6F6882] px-1">|</span>

            {(['COUPLE', 'FEMALE', 'MALE'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedPassType(selectedPassType === type ? 'all' : type)}
                className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                  selectedPassType === type
                    ? 'text-[#E5A93C] font-semibold bg-[#E5A93C]/10 border border-[#E5A93C]/30'
                    : 'text-[#9E96B0] hover:text-[#FAF8F5]'
                }`}
              >
                {type === 'COUPLE' ? 'Couple Pass' : type === 'FEMALE' ? 'Female Pass' : 'Male Stag'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Feed Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {feedMode === 'available' ? (
              <>
                <div className="flex items-center justify-between pb-2">
                  <div className="text-sm font-semibold text-[#FAF8F5]">
                    Available Passes ({listings.length})
                  </div>
                  <span className="text-xs text-[#9E96B0]">Refreshed in real-time</span>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-40 rounded-2xl bg-[#14121E] border border-white/[0.06] animate-pulse" />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-[#14121E] border border-white/[0.08] text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] text-[#E5A93C] flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[#FAF8F5]">No passes match your filters</h3>
                      <p className="text-xs text-[#9E96B0] max-w-sm mx-auto mt-1">
                        Try expanding the distance slider or post a "Passes Wanted" request to alert nearby sellers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onNavigatePost}
                      className="px-4 py-2 rounded-lg bg-[#E5A93C] text-[#0C0A14] font-semibold text-xs hover:bg-[#F3B94E] transition-colors"
                    >
                      Post Passes Wanted
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map((item) => {
                      const coupleItem = item.items.find((i) => i.type === 'COUPLE') || item.items[0];
                      const totalQty = item.items.reduce((acc, it) => acc + it.remaining, 0);

                      return (
                        <div
                          key={item.id}
                          className="bg-[#14121E] hover:bg-[#1A162B] border border-white/[0.08] hover:border-[#E5A93C]/40 rounded-2xl p-6 transition-all duration-200 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            {/* Venue & Metadata */}
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 text-xs text-[#9E96B0]">
                                <span className="font-semibold text-[#E5A93C]">Night {item.night}</span>
                                <span aria-hidden="true">·</span>
                                <span>{item.event?.venueName || 'Garba Venue'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{formatDistance(item.distanceKm)} away</span>
                              </div>

                              <h3
                                onClick={() => handleListingClick(item.id)}
                                className="font-heading font-bold text-xl text-[#FAF8F5] hover:text-[#E5A93C] cursor-pointer transition-colors"
                              >
                                {item.event?.name}
                              </h3>

                              <div className="text-xs text-[#9E96B0] flex items-center gap-1.5">
                                <span className="text-[#FAF8F5] font-medium">Meetup:</span>
                                <span>{item.meetingPoint.landmark}</span>
                              </div>

                              {/* Pass details */}
                              <div className="pt-2 flex items-center gap-4 text-xs text-[#9E96B0]">
                                <span>
                                  Available:{' '}
                                  <strong className="text-[#FAF8F5] font-semibold">
                                    {totalQty}x {item.items.map((i) => i.type).join(', ')}
                                  </strong>
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>Physical Hologram Badge</span>
                              </div>
                            </div>

                            {/* Price & Action */}
                            <div className="sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                              <div>
                                <span className="text-[11px] text-[#9E96B0] block uppercase tracking-wide">
                                  Statutory MRP
                                </span>
                                <span className="font-mono text-2xl font-bold text-[#E5A93C]">
                                  ₹{coupleItem?.askingPrice || 800}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleListingClick(item.id)}
                                className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                <span>Inspect & Request</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                              </button>
                            </div>
                          </div>

                          {/* Seller Quiet Trust Seal */}
                          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9E96B0]">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-[#FAF8F5]">
                                {item.seller?.name ? item.seller.name[0] : 'K'}
                              </div>
                              <span className="font-medium text-[#FAF8F5]">
                                {item.seller?.name || 'Verified Khelaiya'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-400 font-medium">
                                {item.seller?.positivePercentage || 100}% Trust ({item.seller?.completedExchanges || 14} trades)
                              </span>
                            </div>

                            <span className="text-[11px] text-[#6F6882]">No Advance Payment · UPI at Gate</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Wanted Posts View */
              <>
                <div className="flex items-center justify-between pb-2">
                  <div className="text-sm font-semibold text-[#FAF8F5]">
                    Requests Wanted ({wantedPosts.length})
                  </div>
                  <span className="text-xs text-[#9E96B0]">Connect with buyers directly</span>
                </div>

                <div className="space-y-4">
                  {wantedPosts.map((w) => (
                    <div
                      key={w.id}
                      className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.16] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 text-xs text-[#9E96B0]">
                            <span className="text-[#E5A93C] font-semibold">Night {w.night}</span>
                            <span aria-hidden="true">·</span>
                            <span>{w.area}</span>
                            <span aria-hidden="true">·</span>
                            <span>Buyer: {w.buyer?.name || 'Garba Enthusiast'}</span>
                          </div>

                          <h4 className="font-bold text-base text-[#FAF8F5]">
                            Looking for {w.items.map((i) => `${i.quantity}x ${i.type}`).join(', ')} at{' '}
                            {w.event?.name.split(' - ')[0]}
                          </h4>

                          {w.note && <p className="text-xs text-[#9E96B0]">{w.note}</p>}
                        </div>

                        <div className="sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2">
                          <div>
                            <span className="text-[11px] text-[#9E96B0] block">Max Budget</span>
                            <span className="font-mono text-xl font-bold text-[#FAF8F5]">
                              ₹{w.maxPricePerPass}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectWanted) onSelectWanted(w.id);
                              else if (onNavigatePost) onNavigatePost();
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-[#FAF8F5] text-xs font-semibold transition-colors"
                          >
                            Send Pass Offer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Designated Safe Node Feature Card with Image */}
            <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-7 p-6 space-y-3">
                  <div className="text-xs font-semibold text-[#E5A93C]">Verified Safe Handover Node</div>
                  <h3 className="font-heading font-bold text-xl text-[#FAF8F5]">
                    Ahmedabad Police & Khelaiya Verification Canopies
                  </h3>
                  <p className="text-xs text-[#9E96B0] leading-relaxed">
                    Well-lit public meeting zones near gate turnstiles equipped with UV blacklights and ticket barcode inspectors. Never exchange passes in secluded alleys.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleInspectorClick}
                      className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-[#FAF8F5] text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#E5A93C]">qr_code_scanner</span>
                      <span>Launch Hologram Inspector Terminal</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 relative h-48 md:h-auto min-h-[160px] bg-[#1B1828]">
                  <img
                    src="/src/assets/images/pass_security_node_1790688513044.jpg"
                    alt="Safe handover reception kiosk"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#14121E] via-transparent to-transparent opacity-60" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail Sidebar Column (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Quick Post Pass Card */}
            <div className="bg-[#14121E] border border-[#E5A93C]/30 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#E5A93C]">Got Spare Passes Tonight?</span>
                <span className="material-symbols-outlined text-[#E5A93C] text-[20px]">confirmation_number</span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-lg text-[#FAF8F5]">
                  Pass To Extra Revelers
                </h3>
                <p className="text-xs text-[#9E96B0] mt-1 leading-relaxed">
                  Friend unable to attend? Hand over passes at statutory MRP in under 5 minutes outside your venue.
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#9E96B0]">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>100% scam-free hand-to-hand exchange</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Zero platform fees · Buyer pays direct</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigatePost}
                className="w-full py-2.5 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm"
              >
                Post Your Spare Pass
              </button>
            </div>

            {/* Tonight's Gate Schedule */}
            <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-[#FAF8F5]">Tonight's Gate Cutoffs</h4>
                <span className="text-xs text-[#E5A93C] font-semibold">Night 4</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-2">
                  <div>
                    <span className="text-[#FAF8F5] font-medium block">United Way of Baroda</span>
                    <span className="text-[11px] text-[#6F6882]">Entry cutoff strictly observed</span>
                  </div>
                  <span className="font-mono text-[#E5A93C] font-semibold">11:00 PM</span>
                </div>

                <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-2">
                  <div>
                    <span className="text-[#FAF8F5] font-medium block">Mirchi Rock 'N Dhol</span>
                    <span className="text-[11px] text-[#6F6882]">YMCA International</span>
                  </div>
                  <span className="font-mono text-[#E5A93C] font-semibold">10:30 PM</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[#FAF8F5] font-medium block">Shankus Dandiya Arena</span>
                    <span className="text-[11px] text-[#6F6882]">Gandhinagar corridor</span>
                  </div>
                  <span className="font-mono text-[#E5A93C] font-semibold">10:45 PM</span>
                </div>
              </div>
            </div>

            {/* Fair-Price Protection Pledge */}
            <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-5 text-xs text-[#9E96B0] space-y-2">
              <div className="font-semibold text-[#FAF8F5] flex items-center gap-1.5">
                <span className="text-[#E5A93C]">🛡️</span>
                <span>Anti-Scalping Directive</span>
              </div>
              <p className="leading-relaxed">
                By order of Ahmedabad City Administration, reselling passes above printed statutory MRP is a punishable civil infraction. PassMitra automatically reports offending phone numbers.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
