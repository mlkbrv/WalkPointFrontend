/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen, Coupon } from '../types';
import { ChevronLeft, Info, Wallet, Footprints, Check, Bell } from 'lucide-react';
import { BRAND_VOUCHERS_STARBUCKS } from '../data';
import { motion } from 'motion/react';

interface BrandStoreScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  brandName: string;
  mySteps: number;
  onDeductSteps: (cost: number, couponToAdd: Coupon) => void;
}

export default function BrandStoreScreen({
  onNavigate,
  brandName = 'Starbucks',
  mySteps,
  onDeductSteps,
}: BrandStoreScreenProps) {
  // Local loading Claim indicators
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  // Starbucks vouchers
  const vouchers = BRAND_VOUCHERS_STARBUCKS;

  const handleClaimVoucher = (v: Coupon) => {
    const cost = v.stepRequirement || 3000;
    if (mySteps < cost) {
      alert(`Insufficient steps! You need ${cost.toLocaleString()} steps to claim this reward, but you have ${mySteps.toLocaleString()}. Keep stepping!`);
      return;
    }

    setClaimingId(v.id);
    setTimeout(() => {
      onDeductSteps(cost, {
        ...v,
        revealed: false,
        isActive: true,
        expiryDateText: 'Valid until Oct 31, 2026',
      });
      setClaimedIds((prev) => [...prev, v.id]);
      setClaimingId(null);
      alert(`Success! "${v.title}" purchased successfully using ${cost.toLocaleString()} Steps. Check the 'My Wallet' tab in store!`);
    }, 1200);
  };

  return (
    <div id="brand_store_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full px-5 py-4 bg-[#FCF9F8]/80 backdrop-blur-xl border-b border-[#F0EDED]">
        <button 
          onClick={() => onNavigate(Screen.STORE)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#8140F3]" />
        </button>
        <h1 className="text-sm font-black tracking-widest text-[#8140F3] uppercase">{brandName}</h1>
        <button 
          onClick={() => onNavigate(Screen.NOTIFICATIONS)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <Bell className="w-6 h-6 text-[#8140F3]" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-grow pb-16">
        
        {/* Lifestyle Full Hero Banner */}
        <section className="relative w-full h-56 overflow-hidden shadow-md">
          <img 
            alt="Coffee shop lifestyle banner image" 
            src="https://lh3.googleusercontent.com/aida/AP1WRLsZUd1C7YXz100ETzNMJR2KV3f0_l60TCio7Qt31uhdPV2R-vvOMUWBk1aWtJ4qLFdFsquhzBRL3POeGJ1KnxW-R1H8xwoznv4xtag7EXWM3WKAcOJKHa6TIBi4njtY-sGZp_YwnJcAqRbInERu-bLfywVKdEOAPi-t9oN2kV3anzHoCyT24OmgA22Dj2Z3HLq_nyPP1hWj5p9QWsZj923j7eTJpLHoVQ8tmUaaTutM1zkCgCHrl5yJwg" 
            className="w-full h-full object-cover"
          />
          {/* dark gradient cover */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-end p-6 pb-8">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 p-2 shadow border-2 border-white/20">
                <img 
                  alt="Starbucks logo icon" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLtvLYdK3UbYx_Rt-5pSeDmYW9wS5Y-LwX-sQghaEA5w-P7Zf9XP-EIHF3bjNdX00xDW89Db4Qi2zr7Q7jhy3MehB4gKjd2CF5rSwkuxvHGIvEAvK4BQURrTf8UhbFt86paxWdX5f6M1sldKwdN3ft0JAE-idIoOL93UFhLwXcB35u17bUoOzlP4y4PRwUU1zlbtzVPZMK5cw7zd6B2ggS7fbCUnXG1DlaF2gM0DpPcYS4HF8u9L53ot4is" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8140F3] bg-[#EADDFF] px-2 py-0.5 rounded-full uppercase tracking-wider">EXCLUSIVE REWARD</span>
                <h2 className="text-xl font-black text-white leading-tight capitalize mt-0.5">{brandName} vouchers</h2>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Steps-Wallet bar overlaps slightly */}
        <div className="relative -mt-5 px-5 z-20">
          <div className="bg-[#8140F3] text-white py-3.5 px-5 rounded-2xl shadow-lg flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-white/90 fill-current" />
              <span className="font-extrabold text-xs uppercase tracking-widest text-white/90">YOUR STEPS</span>
            </div>
            <div className="flex items-center gap-1 font-semibold">
              <span className="text-lg font-black tracking-tight tabular-nums">{mySteps.toLocaleString()}</span>
              <span className="text-xs font-bold text-white/70">Steps</span>
            </div>
          </div>
        </div>

        {/* Coupons Tickets listing */}
        <section className="mt-8 px-5 space-y-4">
          <h2 className="font-extrabold text-base text-gray-400 uppercase tracking-widest px-1">Available Vouchers</h2>
          
          <div className="space-y-3.5">
            {vouchers.map((v) => {
              const isClaimed = claimedIds.includes(v.id);
              const isClaiming = claimingId === v.id;
              const cost = v.stepRequirement || 3000;
              const hasEnoughSteps = mySteps >= cost;

              return (
                <div 
                  key={v.id}
                  className="bg-white border border-[#EDEFEF] rounded-2xl overflow-hidden shadow-sm flex items-stretch min-h-[120px] relative"
                >
                  {/* Brand Section */}
                  <div className="w-[30%] bg-gray-50 flex flex-col items-center justify-center p-3 border-r border-dashed border-gray-250 relative select-none">
                    <img 
                      alt="Brand icon" 
                      src={v.brandLogo} 
                      className="w-10 h-10 object-contain rounded-full shadow-inner border border-white p-0.5" 
                    />
                    
                    {/* Ticket rounded gaps */}
                    <div className="absolute -left-3 top-1/4 w-6 h-6 bg-[#FCF9F8] rounded-full border-r border-[#EDEFEF] shadow-inner" />
                    <div className="absolute -right-3 top-1/4 w-6 h-6 bg-[#FCF9F8] rounded-full border-l border-[#EDEFEF] shadow-inner" />
                    <div className="absolute -left-3 top-3/4 w-6 h-6 bg-[#FCF9F8] rounded-full border-r border-[#EDEFEF] shadow-inner" />
                    <div className="absolute -right-3 top-3/4 w-6 h-6 bg-[#FCF9F8] rounded-full border-l border-[#EDEFEF] shadow-inner" />
                  </div>

                  {/* Content area description */}
                  <div className="flex-1 p-5 flex flex-col justify-between pr-4">
                    <div>
                      <span className="text-[9px] font-black text-[#8140F3] uppercase tracking-wider">{v.category}</span>
                      <h3 className="font-extrabold text-sm text-[#1C1B1B] mt-0.5 leading-snug">{v.title}</h3>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 italic">{v.expiryDateText}</p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleClaimVoucher(v)}
                        disabled={isClaimed || isClaiming}
                        className={`text-[11px] font-black px-4 py-2.5 rounded-xl shadow-sm tracking-wider uppercase transition-all duration-200 ${
                          isClaimed
                            ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                            : isClaiming
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed animate-pulse'
                            : hasEnoughSteps
                            ? 'bg-[#8140F3] text-white hover:opacity-95 shadow-[#8140F3]/10 active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isClaimed ? (
                          <span className="flex items-center gap-1 font-sans">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Claimed</span>
                          </span>
                        ) : isClaiming ? (
                          'Claiming...'
                        ) : (
                          `${cost.toLocaleString()} Steps`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Motivational Footer Information */}
        <section className="mt-8 px-6 text-center text-xs text-gray-400/80 leading-relaxed">
          <Info className="w-4 h-4 text-[#8140F3] inline mr-1 opacity-70 align-text-bottom" />
          Walk more, earn more. Conversions of step-tokens are tracked dynamically. Keep moving to reveal secret discounts.
        </section>
      </main>
    </div>
  );
}
