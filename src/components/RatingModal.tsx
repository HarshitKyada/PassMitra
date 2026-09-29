import React, { useState } from 'react';
import { submitRating } from '../lib/api.ts';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
  toUserId: string;
  counterpartName: string;
  onSuccess?: () => void;
}

const UP_TAGS = ['On time', 'Genuine pass', 'Smooth handover', 'Fair MRP', 'Courteous'];
const DOWN_TAGS = ["Didn't show up", 'Suspicious pass', 'Asked advance payment', 'Late arrival', 'Price markup attempt'];

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  connectionId,
  toUserId,
  counterpartName,
  onSuccess
}) => {
  const [value, setValue] = useState<'UP' | 'DOWN'>('UP');
  const [selectedTags, setSelectedTags] = useState<string[]>(['On time', 'Genuine pass']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitRating({
        connectionId,
        toUserId,
        value,
        tags: selectedTags,
        comment
      });
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#14121E] border border-white/[0.08] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-[#FAF8F5]">Rate Exchange with {counterpartName}</h3>
          <button onClick={onClose} className="text-[#9E96B0] hover:text-[#FAF8F5] text-xs">
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-2">
            <span className="text-2xl text-emerald-400">✓</span>
            <p className="font-bold text-xs text-[#FAF8F5]">Rating Submitted!</p>
            <p className="text-[11px] text-[#9E96B0]">Thank you for keeping Ahmedabad Garba safe & fair.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Thumbs selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setValue('UP');
                  setSelectedTags(['On time', 'Genuine pass']);
                }}
                className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  value === 'UP'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#9E96B0]'
                }`}
              >
                <span className="text-xl">👍</span>
                <span className="text-xs font-semibold">Positive Experience</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue('DOWN');
                  setSelectedTags(["Didn't show up"]);
                }}
                className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  value === 'DOWN'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#9E96B0]'
                }`}
              >
                <span className="text-xl">👎</span>
                <span className="text-xs font-semibold">Report Issue</span>
              </button>
            </div>

            {/* Quick tag chips */}
            <div>
              <span className="text-[11px] text-[#9E96B0] block mb-2">Select quick feedback tags:</span>
              <div className="flex flex-wrap gap-1.5">
                {(value === 'UP' ? UP_TAGS : DOWN_TAGS).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-[#E5A93C] text-[#0C0A14] font-semibold'
                        : 'bg-white/[0.04] text-[#9E96B0] hover:text-[#FAF8F5]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional comment */}
            <div>
              <input
                type="text"
                placeholder="Optional notes for moderator review"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#E5A93C] rounded-lg px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
