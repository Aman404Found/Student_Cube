import React, { useEffect, useState } from 'react';
import { X, Mail, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRING_SNAPPY, prefersReducedMotion } from '../lib/motion';
import { BrutalButton } from './ui/brutal-button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState(0);
  const isOtpExpired = step === 2 && otpSecondsRemaining <= 0;
  const formattedOtpTime = `${Math.floor(otpSecondsRemaining / 60)}:${String(otpSecondsRemaining % 60).padStart(2, '0')}`;

  const [errorShake, setErrorShake] = useState(false);

  const triggerShake = () => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
  };

  useEffect(() => {
    if (!isOpen || step !== 2 || otpSecondsRemaining <= 0) return;

    const timerId = window.setInterval(() => {
      setOtpSecondsRemaining((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isOpen, step, otpSecondsRemaining]);

  const handleSendOtp = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      setOtp('');
      setOtpSecondsRemaining(5 * 60);
      setStep(2); // Move to OTP step
    }catch (error) {
      triggerShake();
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to send OTP");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      triggerShake();
      return toast.error("Please fill all fields");
    }
    if (isOtpExpired) {
      triggerShake();
      return toast.error("OTP has expired. Please resend the OTP.");
    }
    if (newPassword.length < 6) {
      triggerShake();
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success(res.data.message);
      // Reset state and close modal
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setOtpSecondsRemaining(0);
      onClose();
    } catch (error) {
      triggerShake();
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to reset password");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return toast.error("Please enter your email");

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      setOtp('');
      setOtpSecondsRemaining(5 * 60);
    } catch (error) {
      triggerShake();
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to resend OTP");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const shouldReduceMotion = prefersReducedMotion();

  const shakeAnimation = {
    x: errorShake && !shouldReduceMotion ? [-8, 8, -6, 6, -4, 4, 0] : 0,
    backgroundColor: errorShake ? ["var(--color-stamp-red)", "var(--color-stamp-red)", "var(--color-paper)"] : "var(--color-paper)",
    color: errorShake ? ["var(--color-paper)", "var(--color-paper)", "var(--color-ink)"] : "var(--color-ink)",
    transition: { duration: 0.5 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY}
            className="bg-paper brutal-block w-full max-w-md overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="bg-paper-blue px-6 py-4 border-b-[var(--border-w)] border-ink flex justify-between items-center">
              <h3 className="font-display text-xl font-bold text-ink uppercase flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-ledger-blue" /> Reset Password
              </h3>
              <button onClick={onClose} className="p-1 text-ink hover:text-paper hover:bg-stamp-red brutal-block-sm transition-all shadow-none hover:translate-y-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <p className="font-body text-sm font-medium text-ink/70 mb-2">Enter your registered email address and we'll send you a 6-digit OTP to reset your password.</p>
                  <div>
                    <label className="block font-mono text-xs font-bold text-ink uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-ink/40" />
                      <motion.input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@college.edu" 
                        animate={shakeAnimation}
                        className="w-full pl-10 pr-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
                      />
                    </div>
                  </div>
                  <BrutalButton 
                    type="submit" 
                    disabled={loading}
                    variant="primary"
                    className="w-full py-3 mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? "Sending..." : "Send OTP"} <ArrowRight className="w-4 h-4" />
                  </BrutalButton>
                </form>
          ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div className="bg-campus-green brutal-block-sm text-ink text-sm font-medium p-3 flex items-start gap-2 mb-2 border-[var(--border-w-sm)] border-ink">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>OTP sent to <strong className="font-bold">{email}</strong>. Check your inbox and spam folder. If it lands in spam, mark us as not spam so you do not miss future notifications.</p>
                  </div>
                  <div className={`font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 border-[var(--border-w-sm)] brutal-block-sm ${isOtpExpired ? 'bg-stamp-red text-paper border-ink' : 'bg-paper text-ink border-ink'}`}>
                    {isOtpExpired ? 'OTP expired. Please resend the OTP.' : `Time remaining: ${formattedOtpTime}`}
                  </div>
                  
                  <div>
                    <label className="block font-mono text-xs font-bold text-ink uppercase tracking-widest mb-2">Enter 6-Digit OTP</label>
                    <motion.input 
                      type="text" 
                      required
                      maxLength={6}
                      disabled={isOtpExpired}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Sirf numbers allow karega
                      placeholder="------" 
                      animate={shakeAnimation}
                      className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink text-center text-xl tracking-[1em] font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all disabled:opacity-50 disabled:bg-ink/5 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-bold text-ink uppercase tracking-widest mb-2">New Password</label>
                    <motion.input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password" 
                      animate={shakeAnimation}
                      className="w-full px-4 py-3 bg-paper border-[var(--border-w)] border-ink font-body font-medium text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ledger-blue focus:ring-offset-paper transition-all placeholder:text-ink/40"
                    />
                  </div>

                  <BrutalButton 
                    type="submit" 
                    disabled={loading || isOtpExpired}
                    variant="primary"
                    className="w-full py-3 mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? "Resetting..." : "Verify & Reset Password"}
                  </BrutalButton>
                  {isOtpExpired && (
                    <BrutalButton
                      type="button"
                      disabled={loading}
                      onClick={handleResendOtp}
                      variant="secondary"
                      className="w-full py-3 mt-1"
                    >
                      {loading ? "Resending..." : "Resend OTP"}
                    </BrutalButton>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
