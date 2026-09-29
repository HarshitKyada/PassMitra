import React, { useState, useEffect } from 'react';
import { User, Area } from '../types/index.ts';
import { updateProfile, fetchAreas } from '../lib/api.ts';

interface TrustProfileProps {
  currentUser: User | null;
  onUpdateUser: (updated: User) => void;
  onSwitchUser: (userId: string) => void;
  onOpenAdmin: () => void;
}

export const TrustProfile: React.FC<TrustProfileProps> = ({
  currentUser,
  onUpdateUser,
  onSwitchUser,
  onOpenAdmin
}) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [homeArea, setHomeArea] = useState<string>(currentUser?.homeArea || 'Bodakdev');
  const [alertRadiusKm, setAlertRadiusKm] = useState<number>(currentUser?.alertRadiusKm || 3);
  const [theme, setTheme] = useState<'DARK' | 'LIGHT'>(
    currentUser?.theme?.toUpperCase() === 'LIGHT' ? 'LIGHT' : 'DARK'
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchAreas().then(setAreas).catch(console.error);
    if (currentUser) {
      setName(currentUser.name);
      setHomeArea(currentUser.homeArea || 'Bodakdev');
      setAlertRadiusKm(currentUser.alertRadiusKm || 3);
      setTheme(currentUser.theme?.toUpperCase() === 'LIGHT' ? 'LIGHT' : 'DARK');
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedAreaObj = areas.find((a) => a.name === homeArea);
      const coords: [number, number] = selectedAreaObj
        ? [selectedAreaObj.location.coordinates[0], selectedAreaObj.location.coordinates[1]]
        : [72.5074, 23.0338];

      const updated = await updateProfile({
        name,
        homeArea,
        alertRadiusKm,
        theme,
        homeLocation: {
          type: 'Point',
          coordinates: coords
        }
      });
      onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const trustScore = currentUser?.trustRating ?? 98;

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* User Identity Card */}
        <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#E5A93C]/15 border border-[#E5A93C]/30 flex items-center justify-center text-3xl font-extrabold text-[#E5A93C] shrink-0">
              {currentUser?.name?.charAt(0) || 'K'}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-heading font-extrabold text-2xl text-[#FAF8F5]">
                  {currentUser?.name || 'Ahmedabad Khelaiya'}
                </h1>
                <span className="text-xs font-semibold text-[#E5A93C] bg-[#E5A93C]/10 px-2 py-0.5 rounded-md border border-[#E5A93C]/20">
                  {isAdmin ? 'Trust Moderator' : 'Verified Khelaiya'}
                </span>
              </div>

              <p className="text-xs text-[#9E96B0]">
                {currentUser?.phoneNumber} · Based in <span className="text-[#FAF8F5] font-medium">{currentUser?.homeArea}</span>
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#9E96B0]">
                <span className="text-emerald-400">✓ +91 Phone OTP Verified</span>
                <span aria-hidden="true">·</span>
                <span>Zero Scalping Record</span>
                <span aria-hidden="true">·</span>
                <span>Anti-Black-Market Pledge Signed</span>
              </div>
            </div>

            {/* Score box */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center shrink-0 w-32">
              <span className="font-mono text-3xl font-bold text-[#E5A93C]">{trustScore}%</span>
              <p className="text-[10px] text-[#9E96B0] uppercase mt-0.5">Trust Score</p>
              <div className="text-[11px] text-[#6F6882] mt-1">
                👍 {currentUser?.thumbsUp ?? 28} · 👎 {currentUser?.thumbsDown ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* Persona Switcher for Quick Verification */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#9E96B0]">
          <div>
            <span className="font-semibold text-[#FAF8F5] block">Prototype Persona Switcher</span>
            <span>Test seller, buyer, or admin flows with 1 click:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onSwitchUser('demo-seller-1')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentUser?.id === 'demo-seller-1'
                  ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold'
                  : 'bg-white/[0.04] text-[#FAF8F5] hover:bg-white/[0.08]'
              }`}
            >
              Jignesh (Seller)
            </button>
            <button
              onClick={() => onSwitchUser('demo-buyer-1')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentUser?.id === 'demo-buyer-1'
                  ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold'
                  : 'bg-white/[0.04] text-[#FAF8F5] hover:bg-white/[0.08]'
              }`}
            >
              Pooja (Buyer)
            </button>
            <button
              onClick={() => onSwitchUser('demo-admin-1')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentUser?.id === 'demo-admin-1'
                  ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold'
                  : 'bg-white/[0.04] text-[#FAF8F5] hover:bg-white/[0.08]'
              }`}
            >
              Priya (Admin)
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="p-5 rounded-2xl bg-[#14121E] border border-[#E5A93C]/30 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-sm text-[#FAF8F5] block">Moderator Control Console</span>
              <p className="text-xs text-[#9E96B0]">Manage reports, examine live listings, and enforce fair-pricing.</p>
            </div>
            <button
              onClick={onOpenAdmin}
              className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shrink-0"
            >
              Open Console
            </button>
          </div>
        )}

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h2 className="font-heading font-bold text-lg text-[#FAF8F5]">Locality & Dispatch Settings</h2>

          {savedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              ✓ Preferences updated successfully.
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#9E96B0] block mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-2">Neighborhood Base</label>
              <select
                value={homeArea}
                onChange={(e) => setHomeArea(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.name} className="bg-[#14121E] text-[#FAF8F5]">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-2">Radar Range</label>
              <select
                value={alertRadiusKm}
                onChange={(e) => setAlertRadiusKm(Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
              >
                <option value={1} className="bg-[#14121E]">1 km (Gate Vicinity)</option>
                <option value={2} className="bg-[#14121E]">2 km</option>
                <option value={3} className="bg-[#14121E]">3 km (Neighborhood)</option>
                <option value={5} className="bg-[#14121E]">5 km (Ward)</option>
                <option value={10} className="bg-[#14121E]">10 km (City)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
};
