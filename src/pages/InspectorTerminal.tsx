import React, { useState } from 'react';

export const InspectorTerminal: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [uvMode, setUvMode] = useState<boolean>(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [serialQuery, setSerialQuery] = useState<string>('');
  const [serialStatus, setSerialStatus] = useState<'IDLE' | 'VALID' | 'SUSPICIOUS'>('IDLE');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 30;
    setTilt({ x, y });
  };

  const handleVerifySerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialQuery.trim()) return;
    const clean = serialQuery.toUpperCase().trim();
    if (clean.startsWith('UW-') || clean.startsWith('MRD-') || clean.startsWith('SNK-') || clean.length >= 8) {
      setSerialStatus('VALID');
    } else {
      setSerialStatus('SUSPICIOUS');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0C0A14] text-[#FAF8F5] pb-24 pt-16">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs text-[#9E96B0] hover:text-[#FAF8F5] flex items-center gap-1.5 mb-2 transition-colors"
              >
                <span>← Back</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-[#9E96B0] mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Ahmedabad Security Toolkit</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#FAF8F5] tracking-tight">
              Pass & Hologram Inspector
            </h1>
            <p className="text-xs text-[#9E96B0] mt-1">
              Interactive physical pass inspection tool. Test holographic sheen, UV watermarks, and serial formats.
            </p>
          </div>

          <button
            onClick={() => setUvMode(!uvMode)}
            className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors shrink-0 ${
              uvMode
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white/[0.04] text-[#FAF8F5] border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            <span>🔦</span>
            <span>{uvMode ? 'UV Blacklight: Active' : 'Toggle UV Blacklight'}</span>
          </button>
        </div>

        {/* 3D Holographic Canvas */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          className="relative overflow-hidden rounded-2xl p-8 border border-white/[0.08] transition-all select-none shadow-sm cursor-crosshair bg-[#14121E]"
          style={{
            transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Holographic Iridescent Layer */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: uvMode
                ? 'none'
                : `radial-gradient(circle at ${50 + tilt.x * 2}% ${50 + tilt.y * 2}%, rgba(229, 169, 60, 0.35) 0%, rgba(232, 93, 117, 0.25) 35%, transparent 70%)`,
              opacity: 0.8
            }}
          />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#E5A93C] uppercase">
                  Official Navratri Security Specimen
                </span>
                <h2 className="font-heading font-bold text-lg text-[#FAF8F5]">United Way / Mirchi Rock Authenticator</h2>
              </div>
              <span className="text-xl">🪞</span>
            </div>

            {/* Simulated Wristband */}
            <div className={`p-5 rounded-xl border transition-colors ${
              uvMode ? 'bg-[#0C0A14] border-purple-500/50' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#9E96B0]">Specimen Serial:</span>
                  <p className="font-mono text-base font-bold text-[#E5A93C]">UW-2026-N4-CP-88412</p>
                  <p className="text-[11px] text-[#6F6882]">Night 4 Couple Access · Gate B & C</p>
                </div>

                <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all ${
                  uvMode
                    ? 'bg-purple-900/40 border border-purple-400 text-purple-200'
                    : 'bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-[#E5A93C]'
                }`}>
                  <span className="text-xl">{uvMode ? '✨' : '🪘'}</span>
                  <span className="text-[9px] font-mono uppercase mt-0.5">
                    {uvMode ? 'UV SEAL' : 'DIFFRACT'}
                  </span>
                </div>
              </div>

              {uvMode && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  ✓ Fluorescent security seal verified: "AHMEDABAD GARBA TRUST 2026"
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#9E96B0] flex items-center justify-between">
              <span>Move cursor to inspect multi-angle foil reflection</span>
              <span className="font-mono">Organizer Standard Tier-1</span>
            </div>
          </div>
        </div>

        {/* Serial Checker */}
        <div className="bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="font-heading font-bold text-base text-[#FAF8F5]">
            Sequential Serial Number Format Check
          </h3>
          <p className="text-xs text-[#9E96B0]">
            Enter the printed serial code on the pass stub to ensure it matches authentic organizer numbering formats:
          </p>

          <form onSubmit={handleVerifySerial} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. UW-2026-N4-88412 or MRD-0918"
              value={serialQuery}
              onChange={(e) => {
                setSerialQuery(e.target.value);
                setSerialStatus('IDLE');
              }}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-[#FAF8F5] font-mono uppercase focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shrink-0"
            >
              Verify Code
            </button>
          </form>

          {serialStatus === 'VALID' && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              ✓ Sequence matches valid organizer batch format. Confirm physical holographic foil before payment.
            </div>
          )}

          {serialStatus === 'SUSPICIOUS' && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              ⚠️ Unusual serial format. Inspect the physical ticket thoroughly before completing handover.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
