import React, { useState } from 'react';
import { sendPhoneOtp, verifyPhoneOtp } from '../lib/api.ts';
import { User } from '../types/index.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanPhone = phoneNumber.startsWith('+91')
        ? phoneNumber
        : `+91${phoneNumber.replace(/^0+/, '')}`;

      const res = await sendPhoneOtp(cleanPhone);
      setStep('OTP');
      if (res.simulatedOtp) {
        setSimulatedCode(res.simulatedOtp);
        setOtp(res.simulatedOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Error sending verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanPhone = phoneNumber.startsWith('+91')
        ? phoneNumber
        : `+91${phoneNumber.replace(/^0+/, '')}`;

      const res = await verifyPhoneOtp(cleanPhone, otp);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#14121E] border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9E96B0] hover:text-[#FAF8F5] text-sm p-1"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 flex items-center justify-center mx-auto mb-3 text-[#E5A93C] font-bold">
            ✦
          </div>
          <h2 className="font-heading font-bold text-lg text-[#FAF8F5]">
            {step === 'PHONE' ? 'Sign In to PassMitra' : 'Enter OTP Code'}
          </h2>
          <p className="text-xs text-[#9E96B0] mt-1">
            {step === 'PHONE'
              ? 'Instant verification via Indian mobile number (+91).'
              : `Code sent to ${phoneNumber}`}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#E5A93C] font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98250 88219"
                  value={phoneNumber.replace(/^\+91/, '')}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={10}
                  required
                  className="w-full pl-12 pr-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#FAF8F5] font-mono text-xs focus:outline-none focus:border-[#E5A93C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? 'Sending Code...' : 'Send OTP'}
            </button>

            {/* Quick Demo Credentials */}
            <div className="pt-3 border-t border-white/[0.06] text-center">
              <span className="text-[10px] text-[#6F6882] block mb-2">Test with demo accounts:</span>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setPhoneNumber('9825088219')}
                  className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[#9E96B0] hover:text-[#FAF8F5] text-xs transition-colors"
                >
                  Jignesh (Seller)
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneNumber('9898012345')}
                  className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[#9E96B0] hover:text-[#FAF8F5] text-xs transition-colors"
                >
                  Pooja (Buyer)
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {simulatedCode && (
              <div className="p-2.5 rounded-lg bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-[#E5A93C] text-xs text-center font-mono">
                Development OTP: <strong>{simulatedCode}</strong>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#9E96B0] block mb-1.5 text-center">
                6-Digit Security Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] text-xl font-mono py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#E5A93C] focus:outline-none focus:border-[#E5A93C]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & Enter'}
            </button>

            <button
              type="button"
              onClick={() => setStep('PHONE')}
              className="w-full text-center text-xs text-[#9E96B0] hover:text-[#FAF8F5]"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
