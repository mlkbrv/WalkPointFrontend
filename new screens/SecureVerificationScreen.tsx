/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Screen, Coupon } from '../types';
import { ChevronLeft, ShieldCheck, Timer, HelpCircle, Check, X, ShieldAlert } from 'lucide-react';
import { MY_WALLET_COUPONS } from '../data';
import { motion } from 'motion/react';

interface SecureVerificationScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  couponId: string;
}

export default function SecureVerificationScreen({
  onNavigate,
  couponId = 'sbux-latte-coupon',
}: SecureVerificationScreenProps) {
  // Coupon detail retrieving
  const coupon = MY_WALLET_COUPONS.find((c) => c.id === couponId) || MY_WALLET_COUPONS[0];

  // Counting down state inside timer: 2m 59s initial values (179 seconds)
  const [timeLeft, setTimeLeft] = useState(179);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    if (secs === 0) return 'EXPIRED';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div id="secure_verification_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* Suppressed Header for transactional absolute security focus */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full px-5 py-4 bg-white/70 backdrop-blur-md border-b border-[#F0EDED]">
        <button 
          onClick={() => onNavigate(Screen.STORE)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-6 h-6 text-[#8140F3]" />
        </button>
        <span className="text-sm font-black tracking-tight text-gray-900">Secure Scan</span>
        <button 
          onClick={() => onNavigate(Screen.STORE)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </header>

      {/* Main scanning body */}
      <main className="flex-1 px-5 pb-16 pt-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Soft background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#8140F3]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* The Card wrapper */}
        <div className="w-full max-w-sm bg-white border border-[#EDEFEF] rounded-[32px] p-6 shadow-2xl relative z-10 flex flex-col">
          
          {/* Top security tags */}
          <div className="flex flex-col items-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full shadow-inner mb-2 border border-amber-500/10">
              <ShieldCheck className="w-4 h-4 fill-amber-500 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">SECURE ACCESS</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">Verify Reward</h2>
            <p className="text-xs font-semibold text-gray-400 mt-1">{coupon.brand} Partner Redemption</p>
          </div>

          {/* QR Container graphic window with scan lasers */}
          <div className="relative group mb-8">
            <div className="aspect-square w-full bg-white rounded-2xl border-2 border-gray-100 p-6 flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
              
              {/* High res purple QR display */}
              <img 
                alt="Verification QR code" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSuUTQFVs9FfY7vdz-kANHpGY85pbdYg0XvTEc4zNhMtw6bD0vDw0v0DDLcw7VIwCpgMGVGOUflKpozafh6d3rq0UodwFwdaEEh-wfgJ-zFa3jcb9Jwz8ZoJwo0dk3tCbe5CxJDrqoBhoXImvnqWqaBzlaeWGwts4__5ALeFDE6W9dDqqI8CP624F88jz2_dNgWJ_FrN6tou1SjFZxb6sHYONq_69F__caKOKpFvBUJmjhWtutiLHJz8NYi2wkE0rfSSfq2dIxKCo" 
                className="w-4/5 h-auto object-contain z-10"
              />

              {/* Barcode representation overlay underneath */}
              <div className="mt-4 w-full flex flex-col items-center z-10">
                <div className="flex gap-[1.5px] h-8 w-2/3 justify-center opacity-80 select-none">
                  {/* Stripes patterns */}
                  <div className="w-[1.5px] bg-[#1C1B1B] h-full" />
                  <div className="w-[3px] bg-[#1C1B1B] h-full ml-[1px]" />
                  <div className="w-[1px] bg-[#1C1B1B] h-full ml-[2px]" />
                  <div className="w-[4px] bg-[#1C1B1B] h-full ml-[1px]" />
                  <div className="w-[2px] bg-[#1C1B1B] h-full ml-[3px]" />
                  <div className="w-[1px] bg-[#1C1B1B] h-full ml-[2px]" />
                  <div className="w-[3px] bg-[#1C1B1B] h-full" />
                  <div className="w-[1.5px] bg-[#1C1B1B] h-full ml-[2px]" />
                </div>
                <span className="text-[10px] font-mono font-black text-gray-400 mt-1 tracking-[0.3em] font-sans">
                  {coupon.code || 'STR-7729-AX'}
                </span>
              </div>

              {/* Rolling electric green neon lasers animation scanner */}
              <motion.div 
                initial={{ y: 0 }}
                animate={{ y: [0, 240, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#8140F3] to-transparent shadow-[0_0_12px_#8140F3] z-20 pointer-events-none"
              />
            </div>

            {/* Countdown timer ticker pill layout */}
            <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full flex items-center gap-2.5 shadow-xl border text-white transition-colors duration-350 z-30 ${
              timeLeft === 0 ? 'bg-red-500 border-red-500/20' : 'bg-[#1C1B1B] border-transparent'
            }`}>
              <Timer className={`w-4 h-4 ${timeLeft > 0 ? 'text-[#8140F3]/80 animate-spin h-[14px]' : 'text-white'}`} style={{ animationDuration: timeLeft > 0 ? '4s' : '0s' }} />
              <span className="text-base font-black tracking-wider tabular-nums font-sans leading-none">
                {formatCountdown(timeLeft)}
              </span>
            </div>
          </div>

          {/* Description footnotes */}
          <div className="text-center mt-6">
            <p className="text-xs font-semibold text-gray-500 leading-relaxed max-w-[240px] mx-auto opacity-80">
              Present this secure code at the store partner register window to confirm your reward redemption.
            </p>
          </div>

          {/* Action Row */}
          <div className="mt-8 border-t border-gray-100 pt-5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(Screen.STORE)}
              className="w-full bg-[#8140F3] hover:opacity-95 text-white py-3.5 rounded-2xl font-bold tracking-widest text-xs shadow-[0_8px_20px_rgba(129,64,243,0.25)] active:scale-95 transition-all text-center uppercase"
            >
              Done
            </motion.button>
          </div>
        </div>

        {/* Footer dynamic safety badge credits */}
        <section className="mt-8 flex gap-5 opacity-40 select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-500">Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-500">Dynamic Code</span>
          </div>
        </section>
      </main>
    </div>
  );
}
