/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen, ProductReward, Coupon } from '../types';
import { ChevronLeft, Calendar, ShieldCheck, ArrowRight, HeartPulse, Sparkles, Check, Clock } from 'lucide-react';
import { MARKETPLACE_PRODUCTS } from '../data';
import { motion } from 'motion/react';

interface CouponDetailScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  productId: string;
  mySteps: number;
  onConfirmPurchase: (coupon: Coupon) => void;
}

export default function CouponDetailScreen({
  onNavigate,
  productId = 'sbux-latte',
  mySteps,
  onConfirmPurchase,
}: CouponDetailScreenProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Retrieve current product details
  const product = MARKETPLACE_PRODUCTS.find((p) => p.id === productId) || MARKETPLACE_PRODUCTS[2];

  const stepsRequired = product.stepsPrice;
  const progressRatio = Math.min(mySteps / stepsRequired, 1);
  const progressPercentage = Math.round(progressRatio * 100);
  const stepsRemaining = Math.max(0, stepsRequired - mySteps);
  const canAfford = mySteps >= stepsRequired;

  const handlePurchase = () => {
    if (!canAfford) {
      alert(`Insufficent Steps! You currently have ${mySteps.toLocaleString()} steps but need ${stepsRequired.toLocaleString()} steps for this coupon. Keep moving!`);
      return;
    }

    setIsPurchasing(true);
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseSuccess(true);
      
      const newCoupon: Coupon = {
        id: `purchased-${product.id}-${Date.now()}`,
        title: product.title,
        brand: product.brand,
        brandLogo: product.id === 'sbux-latte' 
          ? 'https://lh3.googleusercontent.com/aida/AP1WRLtvLYdK3UbYx_Rt-5pSeDmYW9wS5Y-LwX-sQghaEA5w-P7Zf9XP-EIHF3bjNdX00xDW89Db4Qi2zr7Q7jhy3MehB4gKjd2CF5rSwkuxvHGIvEAvK4BQURrTf8UhbFt86paxWdX5f6M1sldKwdN3ft0JAE-idIoOL93UFhLwXcB35u17bUoOzlP4y4PRwUU1zlbtzVPZMK5cw7zd6B2ggS7fbCUnXG1DlaF2gM0DpPcYS4HF8u9L53ot4is'
          : product.image,
        category: product.category,
        expiryDateText: 'Valid for 30 days',
        isActive: true,
        stepRequirement: stepsRequired,
        stepCurrent: mySteps,
        about: `Redeem your steps for a premium ${product.title} from ${product.brand}. Valid in any participating store nationwide.`,
        code: `RED-${product.id.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        revealed: false
      };

      onConfirmPurchase(newCoupon);
      alert(`Successfully Purchased! "${product.title}" has been claimed for ${stepsRequired.toLocaleString()} steps. It was added to your secure wallet.`);
      onNavigate(Screen.STORE);
    }, 1500);
  };

  return (
    <div id="coupon_detail_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full px-5 py-4 bg-[#FCF9F8]/80 backdrop-blur-xl border-b border-[#F0EDED]">
        <button 
          onClick={() => onNavigate(Screen.STORE)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-6 h-6 text-[#8140F3]" />
        </button>
        <h1 className="text-base font-extrabold text-gray-900 tracking-tight">Reward Details</h1>
        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shadow-inner">
          <img 
            alt="My Profile" 
            src="https://lh3.googleusercontent.com/aida/AP1WRLt_bPOT03UWfr6BZOLZDLgeQosxr0OoIlM6EeFpLgNthjGakwFdIRzWafHgrrP6NuEAYt4Fq5fQKJ0G2RzNG3rEM5B1tcBMSlY5e3GFk1ky50yjnP5sVZ9wtj4PJrXDFpXfVE_F-Ykmng7bopLF2XK0xKLI82gmwJAg8756b7RdKh1O2-iVrhOvvy1gwJnWwsSTwFIBVVWzIl-u78DysK0-AxdlLuJWUAcXiH0eG_y4hRTX2bzE-cBvoYw"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Main Container contents */}
      <main className="flex-grow pb-32">
        {/* Lifestyle Banner image represent relative */}
        <section className="relative w-full h-[320px] overflow-hidden">
          <img 
            alt={product.title} 
            src={product.image} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {/* overlay bottom cover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FCF9F8] via-transparent to-transparent flex flex-col justify-end p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#8140F3] text-white p-2.5 rounded-2xl shadow-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8140F3] uppercase tracking-widest leading-none">PREMIUM VOUCHER</span>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">{product.title}</h2>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 space-y-6">
          {/* Requirement Steps verification gauge */}
          <div className="bg-white border border-[#EDEFEF] rounded-3xl p-5 shadow-[0_12px_45px_rgba(26,26,26,0.04)] space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">VOUCHER PROGRESS</p>
                <h2 className="text-xl font-black text-gray-900 leading-none mt-1.5 tabular-nums">
                  {mySteps.toLocaleString()} <span className="text-gray-300 font-bold text-xs">/ {stepsRequired.toLocaleString()} steps</span>
                </h2>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                canAfford ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-[#8140F3]'
              }`}>
                {progressPercentage}% Eligible
              </span>
            </div>

            {/* Thick gradient progress bar */}
            <div className="h-3 w-full bg-gray-150 bg-[#F0EDED] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                className="h-full bg-gradient-to-r from-[#8140F3] to-[#ff6b6b] rounded-full"
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>

            <p className="text-xs text-gray-500 font-medium italic mt-2">
              {canAfford 
                ? 'Your steps qualify for this reward! Scroll below to confirm your redemption purchase.'
                : `Keep moving! You need another ${stepsRemaining.toLocaleString()} steps to claim this ${product.brand} voucher.`
              }
            </p>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-[#1C1B1B]">About this Reward</h3>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed">
              We reward your loyalty to health! Exchange your daily physical metrics steps for standard {product.title} from {product.brand}. This coupon is fully dynamic and valid securely inside any local outlet globally. No cash refunds allowed.
            </p>
          </div>

          {/* Icons breakdown stats row */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white rounded-2xl p-4 border border-[#EDEFEF] flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#8140F3]" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wider">EXPIRY</p>
                <p className="text-xs font-black text-gray-700">30 Days</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#EDEFEF] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wider">VERIFIED</p>
                <p className="text-xs font-black text-gray-700">Digital Coupon</p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions checklist */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-[10px] font-black text-gray-400 tracking-wider uppercase">VOUCHER TERMS AND GUIDELINES</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2.5 text-xs text-gray-500 font-semibold leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span>Requires QR scanning code at the physical counter for store validation.</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-gray-500 font-semibold leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span>Single-transaction only. Valid only for products under the {product.category} scope.</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* Persistent Bottom confirmation checkout sheet */}
      <footer className="fixed bottom-0 left-0 right-0 p-5 bg-[#FCF9F8]/90 backdrop-blur-xl border-t border-gray-150 z-30 select-none">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handlePurchase}
          disabled={isPurchasing || purchaseSuccess}
          className={`w-full py-4.5 rounded-2xl font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${
            purchaseSuccess
              ? 'bg-emerald-500 text-white shadow-emerald-500/10'
              : !canAfford
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#8140F3] hover:opacity-95 text-white shadow-[#8140F3]/25 active:scale-95'
          }`}
        >
          {isPurchasing ? (
            <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest animate-pulse">
              Deducting steps...
            </span>
          ) : purchaseSuccess ? (
            <span className="flex items-center gap-1.5 uppercase font-black text-xs font-sans tracking-widest">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Coupon Claimed</span>
            </span>
          ) : (
            <>
              <span>CLAIM REWARD VOUCHER</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </motion.button>
      </footer>
    </div>
  );
}
