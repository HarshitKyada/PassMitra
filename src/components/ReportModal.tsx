import React, { useState } from 'react';
import { submitReport } from '../lib/api.ts';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'LISTING' | 'WANTED' | 'USER' | 'CONNECTION';
  targetId: string;
  targetTitle?: string;
  targetName?: string;
  onSuccess?: () => void;
}

const REASONS = [
  { id: 'SCALPING_OVER_MRP', label: 'Over-MRP Scalping / Demanding Premium' },
  { id: 'FAKE_PASS', label: 'Suspicious / Counterfeit Hologram or Band' },
  { id: 'ADVANCE_UPI_DEMAND', label: 'Demanded Advance UPI Prior to Gate Inspection' },
  { id: 'NO_SHOW', label: 'No-Show at Agreed Gate Meeting Point' },
  { id: 'MISLEADING_DETAILS', label: 'Incorrect Venue / Gate / Pass Category' },
  { id: 'OTHER', label: 'Other Safety or Policy Violation' }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetName,
  onSuccess
}) => {
  const [reason, setReason] = useState(REASONS[0].id);
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitReport({
        targetType,
        targetId,
        reason,
        details,
        blockUser
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = targetName || targetTitle || targetId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#14121E] border border-white/[0.08] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-[#FAF8F5]">Report Violation</h3>
          <button onClick={onClose} className="text-[#9E96B0] hover:text-[#FAF8F5] text-xs">
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-2">
            <span className="text-2xl text-emerald-400">✓</span>
            <p className="font-bold text-xs text-[#FAF8F5]">Report Submitted</p>
            <p className="text-[11px] text-[#9E96B0]">PassMitra trust desk is actively reviewing this incident.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[#9E96B0]">
              Reporting: <strong className="text-[#FAF8F5]">{displayName}</strong>
            </p>

            <div>
              <label className="text-[11px] text-[#9E96B0] block mb-1.5 font-medium">Select Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none"
              >
                {REASONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#14121E]">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#9E96B0] block mb-1.5 font-medium">Additional Context</label>
              <textarea
                rows={3}
                placeholder="Describe what occurred during the exchange..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg p-3 text-xs text-[#FAF8F5] focus:outline-none placeholder:text-[#6F6882]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[#9E96B0] cursor-pointer">
              <input
                type="checkbox"
                checked={blockUser}
                onChange={(e) => setBlockUser(e.target.checked)}
                className="rounded border-white/20 text-[#E5A93C] focus:ring-[#E5A93C] bg-[#14121E]"
              />
              <span>Block user from contacting me again</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Report to Trust Desk'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
