import React, { useState, useEffect } from 'react';
import { AppNotification, Listing, GarbaEvent, User } from '../types/index.ts';
import { fetchNotifications, markNotificationRead, fetchListings, fetchEvents } from '../lib/api.ts';
import { formatDistance, calculateHaversineDistance } from '../lib/geo.ts';

interface AlertsRadarProps {
  currentUser: User | null;
  onOpenListing: (listingId: string) => void;
  onNavigatePost: () => void;
}

export const AlertsRadar: React.FC<AlertsRadarProps> = ({
  currentUser,
  onOpenListing,
  onNavigatePost
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [liveDrops, setLiveDrops] = useState<Listing[]>([]);
  const [, setEvents] = useState<GarbaEvent[]>([]);
  const [radarRadiusKm, setRadarRadiusKm] = useState<number>(currentUser?.alertRadiusKm || 3);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'COUPLE' | 'FEMALE' | 'MALE'>('ALL');
  const [requestPushActive, setRequestPushActive] = useState<boolean>(false);

  const userCoords: [number, number] = currentUser?.homeLocation?.coordinates || [72.5074, 23.0338];

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [radarRadiusKm]);

  const loadAlerts = async () => {
    try {
      const [notifs, listings, evs] = await Promise.all([
        fetchNotifications(),
        fetchListings(),
        fetchEvents()
      ]);
      setNotifications(notifs);
      setLiveDrops(listings);
      setEvents(evs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDrops = liveDrops.filter((item) => {
    const dist = calculateHaversineDistance(userCoords, item.meetingPoint.location.coordinates);
    if (dist > radarRadiusKm) return false;

    if (selectedFilter === 'COUPLE') {
      return item.items.some((i) => i.type === 'COUPLE');
    }
    if (selectedFilter === 'FEMALE') {
      return item.items.some((i) => i.type === 'FEMALE');
    }
    if (selectedFilter === 'MALE') {
      return item.items.some((i) => i.type === 'MALE');
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header & Geofence Slider Card */}
        <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#9E96B0] mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ahmedabad Proximity Radar</span>
                <span aria-hidden="true">·</span>
                <span>Active near {currentUser?.homeArea || 'Bodakdev / SG Highway'}</span>
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#FAF8F5] tracking-tight">
                Instant Pass Drops & Beacons
              </h1>
              <p className="text-xs text-[#9E96B0] mt-1 max-w-xl">
                Be alerted in real-time when khelaiyas with spare passes post within your walking or driving perimeter.
              </p>
            </div>

            {/* Slider Control */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] shrink-0 w-full sm:w-56 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#9E96B0]">Perimeter Radius</span>
                <span className="font-mono font-bold text-[#E5A93C]">{radarRadiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={radarRadiusKm}
                onChange={(e) => setRadarRadiusKm(Number(e.target.value))}
                className="w-full accent-[#E5A93C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#6F6882]">
                <span>1km (Gate)</span>
                <span>5km</span>
                <span>10km</span>
              </div>
            </div>
          </div>

          {/* Clean Segmented Filter Bar */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              {[
                { id: 'ALL', label: 'All Live Drops' },
                { id: 'COUPLE', label: 'Couple Passes' },
                { id: 'FEMALE', label: 'Female Entry' },
                { id: 'MALE', label: 'Male Stag' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedFilter(chip.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    selectedFilter === chip.id
                      ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold shadow-sm'
                      : 'text-[#9E96B0] hover:text-[#FAF8F5] hover:bg-white/[0.04]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setRequestPushActive(!requestPushActive)}
              className="text-xs text-[#9E96B0] hover:text-[#FAF8F5] flex items-center gap-1.5 transition-colors"
            >
              <span>🔔</span>
              <span>{requestPushActive ? 'Web Push Active' : 'Enable Web Push'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Drops */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-semibold text-[#FAF8F5]">
                Passes Within {radarRadiusKm}km ({filteredDrops.length})
              </h2>
              <span className="text-xs text-[#9E96B0]">Updated every 10s</span>
            </div>

            {filteredDrops.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#14121E] border border-white/[0.08] text-center space-y-3">
                <p className="font-semibold text-sm text-[#FAF8F5]">No extra passes in immediate radius</p>
                <p className="text-xs text-[#9E96B0] max-w-sm mx-auto">
                  Expand your perimeter slider above or post a "Passes Wanted" request to alert nearby sellers.
                </p>
                <button
                  onClick={onNavigatePost}
                  className="px-4 py-2 rounded-lg bg-[#E5A93C] text-[#0C0A14] font-semibold text-xs hover:bg-[#F3B94E] transition-colors"
                >
                  Post "Passes Wanted"
                </button>
              </div>
            ) : (
              filteredDrops.map((item) => {
                const dist = calculateHaversineDistance(userCoords, item.meetingPoint.location.coordinates);
                const minPrice = Math.min(...item.items.map((i) => i.askingPrice));
                const totalRemaining = item.items.reduce((s, it) => s + it.remaining, 0);

                return (
                  <div
                    key={item.id}
                    className="bg-[#14121E] border border-white/[0.08] hover:border-[#E5A93C]/40 rounded-2xl p-5 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#9E96B0]">
                        <span className="text-[#E5A93C] font-semibold">{formatDistance(dist)} away</span>
                        <span aria-hidden="true">·</span>
                        <span>Night {item.night}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.event?.venueName}</span>
                      </div>

                      <h3 className="font-heading font-bold text-base text-[#FAF8F5]">
                        {item.event?.name}
                      </h3>

                      <p className="text-xs text-[#9E96B0]">
                        {totalRemaining} available ({item.items.map((i) => `${i.remaining}x ${i.type}`).join(', ')}) · Meetup at {item.meetingPoint.landmark}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                      <div className="sm:text-right">
                        <span className="text-[10px] text-[#9E96B0] block uppercase">MRP</span>
                        <span className="font-mono text-xl font-bold text-[#E5A93C]">₹{minPrice}</span>
                      </div>

                      <button
                        onClick={() => onOpenListing(item.id)}
                        className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm"
                      >
                        Inspect & Claim
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Live Broadcasts Log */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-sm font-semibold text-[#FAF8F5]">Live Broadcasts</h2>

            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkRead(notif.id)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-colors ${
                    notif.readAt
                      ? 'bg-[#14121E] border-white/[0.06] opacity-70'
                      : 'bg-[#14121E] border-[#E5A93C]/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#FAF8F5]">{notif.title}</span>
                    {!notif.readAt && <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C]" />}
                  </div>
                  <p className="text-[#9E96B0] leading-relaxed mb-2">{notif.body}</p>
                  <span className="text-[10px] text-[#6F6882]">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
