/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen, ProductReward, Coupon } from '../types';
import { ShoppingBag, CreditCard, ChevronRight, Bell, Coins, Footprints } from 'lucide-react';
import { MARKETPLACE_PRODUCTS, MY_WALLET_COUPONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface StoreScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  mySteps: number;
}

export default function StoreScreen({ onNavigate, mySteps }: StoreScreenProps) {
  // Store Tab Section: 'shop' | 'wallet'
  const [storeTab, setStoreTab] = useState<'shop' | 'wallet'>('shop');

  // Category filter for shop
  const [activeCategory, setActiveCategory] = useState<'All' | 'Food' | 'Coffee' | 'Fitness' | 'Shopping'>('All');

  // Filtered products list
  const filteredProducts = MARKETPLACE_PRODUCTS.filter((product) => {
    if (activeCategory === 'All') return true;
    return product.category === activeCategory;
  });

  return (
    <div id="store_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full px-5 py-4 bg-[#FCF9F8]/80 backdrop-blur-xl border-b border-[#F0EDED]">
        <div 
          onClick={() => onNavigate(Screen.PROFILE)} 
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img 
              alt="User" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLt_bPOT03UWfr6BZOLZDLgeQosxr0OoIlM6EeFpLgNthjGakwFdIRzWafHgrrP6NuEAYt4Fq5fQKJ0G2RzNG3rEM5B1tcBMSlY5e3GFk1ky50yjnP5sVZ9wtj4PJrXDFpXfVE_F-Ykmng7bopLF2XK0xKLI82gmwJAg8756b7RdKh1O2-iVrhOvvy1gwJnWwsSTwFIBVVWzIl-u78DysK0-AxdlLuJWUAcXiH0eG_y4hRTX2bzE-cBvoYw" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-[#8140F3]">STRIDE</span>
        </div>
        
        {/* Step-Token Balance Pill top-right */}
        <div className="flex items-center gap-3">
          <div className="bg-[#EADDFF] text-[#25005A] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-[#8140F3]/10">
            <Footprints className="w-4 h-4" />
            <span className="text-xs font-black tracking-tight tabular-nums">{mySteps.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => onNavigate(Screen.NOTIFICATIONS)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-6 h-6 text-[#8140F3]" />
          </button>
        </div>
      </header>

      {/* Header and Toggle Button Section */}
      <main className="flex-1 px-5 pb-28 pt-4 space-y-6">
        
        {/* Toggle between Store and My Wallet */}
        <div className="flex p-1 bg-[#F0EDED] rounded-full max-w-sm mx-auto shadow-inner">
          <button
            onClick={() => setStoreTab('shop')}
            className={`flex-1 py-2 text-xs font-bold transition-all rounded-full flex items-center justify-center gap-1.5 ${
              storeTab === 'shop'
                ? 'bg-[#8140F3] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Reward Store</span>
          </button>
          <button
            onClick={() => setStoreTab('wallet')}
            className={`flex-1 py-2 text-xs font-bold transition-all rounded-full flex items-center justify-center gap-1.5 ${
              storeTab === 'wallet'
                ? 'bg-[#8140F3] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>My Wallet</span>
          </button>
        </div>

        {/* View switching panel */}
        <AnimatePresence mode="wait">
          {storeTab === 'shop' ? (
            <motion.div
              key="shop-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Category Pills Slider */}
              <section className="overflow-x-auto no-scrollbar -mx-5 px-5 py-1">
                <div className="flex gap-2 whitespace-nowrap">
                  {(['All', 'Food', 'Coffee', 'Fitness', 'Shopping'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                        activeCategory === cat
                          ? 'bg-[#8140F3] text-white shadow-md shadow-[#8140F3]/20'
                          : 'bg-white border border-[#EDEFEF] text-[#4A4455] hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </section>

              {/* Masonry 2-Column Marketplace Grid */}
              <section className="grid grid-cols-2 gap-4">
                {filteredProducts.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onNavigate(Screen.COUPON_DETAIL, { productId: p.id })}
                    className={`bg-white rounded-3xl p-3 border border-[#EDEFEF] shadow-sm flex flex-col space-y-3 cursor-pointer group hover:border-[#8140F3]/30 ${
                      idx % 2 === 1 ? 'mt-8' : '' // simulating a beautiful masonry staggered grid offset!
                    }`}
                  >
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                      <img 
                        alt={p.title} 
                        src={p.image} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                        <span className="text-[9px] font-bold text-[#4A4455] tracking-wider uppercase">{p.category}</span>
                      </div>
                    </div>
                    
                    <div className="px-1 space-y-1">
                      <h3 className="font-extrabold text-sm text-[#1C1B1B] leading-tight line-clamp-1 group-hover:text-[#8140F3] transition-colors">{p.title}</h3>
                      <p className="text-[11px] font-bold text-[#4A4455] opacity-50">{p.brand}</p>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(Screen.COUPON_DETAIL, { productId: p.id });
                      }}
                      className="w-full bg-[#8140F3] text-white py-2.5 rounded-2xl text-[11px] font-bold tracking-widest shadow-sm hover:opacity-95 transition-opacity"
                    >
                      {p.stepsPrice.toLocaleString()} Steps
                    </button>
                  </motion.div>
                ))}
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="wallet-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Informative Header */}
              <div className="bg-[#8140F3]/5 p-4 rounded-3xl border border-[#8140F3]/10">
                <p className="text-xs text-[#8140F3] font-semibold text-center leading-relaxed">
                  Redeem coupons securely details. Tap each coupon to generate its dynamic security verification barcodes!
                </p>
              </div>

              {/* Coupons List */}
              <div className="space-y-3.5">
                {MY_WALLET_COUPONS.map((coupon, idx) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onNavigate(Screen.SECURE_VERIFICATION, { couponId: coupon.id })}
                    className="relative bg-white border border-[#EDEFEF] rounded-2xl overflow-hidden shadow-sm flex items-stretch min-h-[120px] cursor-pointer group hover:border-[#8140F3]/20"
                  >
                    {/* Brand Left Cutout Section styled like ticket */}
                    <div className="w-1/3 bg-gray-50 flex flex-col items-center justify-center p-4 border-r border-dashed border-gray-200 relative select-none">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-1.5 overflow-hidden border border-gray-100">
                        <img 
                          alt={coupon.brand} 
                          src={coupon.brandLogo} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase">{coupon.category}</span>
                      
                      {/* Ticket Rounded cutouts */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FCF9F8] rounded-full border-r border-[#EDEFEF] shadow-inner" />
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FCF9F8] rounded-full border-l border-[#EDEFEF] shadow-inner" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1C1B1B] leading-tight line-clamp-1 group-hover:text-[#8140F3] transition-colors">
                          {coupon.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-gray-400 mt-1 italic leading-none">{coupon.expiryDateText}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-bold text-[#8140F3] uppercase tracking-widest leading-none group-hover:underline">
                          TAP TO REVEAL
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#8140F3] opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress unlock banner */}
              <div className="p-5 bg-white border-2 border-dashed border-[#ccc3d8] rounded-3xl text-center space-y-2">
                <Coins className="w-8 h-8 text-[#8140F3] mx-auto opacity-70" />
                <p className="text-xs text-[#4A4455] font-semibold leading-relaxed max-w-xs mx-auto">
                  Walk 5,000 more steps today to unlock your next exclusive partner reward coupon.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
