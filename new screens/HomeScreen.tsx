/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Screen } from '../types';
import { User, Bell, Flame, Route, Clock, ArrowUpRight, Trophy, Store, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  stepsToday: number;
  stepsGoal: number;
  caloriesBurned: number;
  distanceCovered: number;
  activeMinutes: number;
}

export default function HomeScreen({
  onNavigate,
  stepsToday,
  stepsGoal,
  caloriesBurned,
  distanceCovered,
  activeMinutes,
}: HomeScreenProps) {
  const progressRatio = Math.min(stepsToday / stepsGoal, 1);
  const strokeDashoffset = 691.15 - (progressRatio * 691.15);

  const mockTrendingBrands = [
    {
      id: 'starbucks',
      name: 'Starbucks',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNQ9Tbk0iQOPucs6vUJe9X4i4Muh6LkqhBKLX-iN3Xz-ot2lHT30fNIOp5kEzl61GxhMm2IZ9kgy61THWMR5hNH7W9NTxVY8x_pGBBb-P__7WVi1S9hNEWrWrOtXzCBFk9YaILXN_66PEg4uEWGJXfyv0u7wc-yFSZxT1HeF8_3GrwIYZozUwp50eOG_bcjc4grcTe86cWQfj9W6lOsETLJl_QbSKq1wpsnAyoK1NWK-FZO4PBm2G7mun8gH_OusKERcglP8pYUlg',
      borderColor: 'border-emerald-500/20',
    },
    {
      id: 'mcdonalds',
      name: "McDonald's",
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqFgNdHkYrlLrCJ79P27sfdes5bqM4vTjjUtLNjLKiWRcP0-W6exDXkYGTGUaN5Go74dmUYhHXMCa9LC6VuLUyjc8kAW1DLMZT0dIi6E95T8Zkt1eToLoHVmz3LlCmoOFfAEbx9hQod5XjFaRhyw__NBHczVF5_Xw-F2GkknYICT5eSYfSZlrfatK8e8i0cUL_8xy83iaErVoqotK727oQkVZUUmkUYqFU0ZQpMKG2iRwJcHDrUcgPchhrRQ0VXjbR8DlAfH0IUlY',
      borderColor: 'border-yellow-500/20',
    },
    {
      id: 'kfc',
      name: 'KFC',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcNJhQwJ5CqsNtQ_rZ6TTSCDs0NDrdf3atdESubeKbdef2BRjnzgGmpQdZYXlOLbsbll6oEVT-U411NPZ5VI31EqwpBYw-mvj3EsXV0Q0mBcExjzXEV9o-Mw-tJ9RFp6XTnctqifoRJJ4KJv9RX8RuZe3BgKSVEopjmuWqWWaGjexrRJvfcOCmYY25TgjrxD5gKIL5poMM7WMfrpBBf_h5SpSCQ9Tq2BI70rrCsxx1NOlkCrpdy5VjfhoskqdRxBZW89gPhShhk04',
      borderColor: 'border-red-500/20',
    },
    {
      id: 'nike',
      name: 'Nike Store',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDr8ocqGNiDR3IkOp_G2kiGXDHSRTlw2NLrZcnnIGYPlJwi_YawgqGGVtAfTUD0PjuCL7QxbecKt3d9u_01EYxAUsjFC_myQFiwViBA2XecWIJV6A9Qyh2jD6O7LiJer9kcojPWwcCaBbTtp42f-ETDl5FfJ7F4hPCrFQMy6FsaMvt_cRLMhdojL90aOZTGjMylgpCnQGF0P_vi95Wvp00a6r1GxdO3BWfXkqk_UCzaM2lMp23hS0nWEUa_Y0KfU-wNBSZ_9oJQdy8',
      borderColor: 'border-primary/20',
    }
  ];

  return (
    <div id="home_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* Top Banner Row */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full px-5 py-4 bg-[#FCF9F8]/80 backdrop-blur-xl border-b border-[#F0EDED]">
        <div 
          onClick={() => onNavigate(Screen.PROFILE)}
          className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform duration-200"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#8140F3]/20 group-hover:ring-[#8140F3]/40 transition-shadow">
            <img 
              alt="Xaliq Portrait" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLt_bPOT03UWfr6BZOLZDLgeQosxr0OoIlM6EeFpLgNthjGakwFdIRzWafHgrrP6NuEAYt4Fq5fQKJ0G2RzNG3rEM5B1tcBMSlY5e3GFk1ky50yjnP5sVZ9wtj4PJrXDFpXfVE_F-Ykmng7bopLF2XK0xKLI82gmwJAg8756b7RdKh1O2-iVrhOvvy1gwJnWwsSTwFIBVVWzIl-u78DysK0-AxdlLuJWUAcXiH0eG_y4hRTX2bzE-cBvoYw" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-[#8140F3]">STRIDE</span>
        </div>
        <button 
          onClick={() => onNavigate(Screen.NOTIFICATIONS)}
          className="relative p-2 rounded-full hover:bg-[#F2F4F6] transition-colors active:scale-95 duration-200"
        >
          <Bell className="w-6 h-6 text-[#8140F3]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </header>

      {/* Main Stats Scrollable Cover */}
      <main className="flex-1 px-5 pb-28 pt-4 space-y-6">
        {/* Step Circular Indicator */}
        <section className="flex flex-col items-center py-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Ring Background and Dynamic Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer circle track */}
              <circle 
                cx="128" 
                cy="128" 
                r="110" 
                fill="none" 
                stroke="#E5E7EB" 
                strokeWidth="12"
              />
              {/* Dash lines tick markers inside */}
              <g className="opacity-20 stroke-current text-[#7B7487]" strokeWidth="2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line
                    key={i}
                    x1="128"
                    y1="22"
                    x2="128"
                    y2="30"
                    transform={`rotate(${i * 30} 128 128)`}
                  />
                ))}
              </g>
              {/* Filled active tracking path */}
              <motion.circle 
                cx="128" 
                cy="128" 
                r="110" 
                fill="none" 
                stroke="#8140F3" 
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ strokeDasharray: 691.15, strokeDashoffset: 691.15 }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ filter: 'drop-shadow(0 0 6px rgba(129, 64, 243, 0.4))' }}
              />
            </svg>
            {/* Center Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[44px] font-black tracking-tight text-[#1C1B1B] tabular-nums">
                {stepsToday.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-[#4A4455] tracking-widest uppercase opacity-85">
                GOAL: {stepsGoal.toLocaleString()}
              </span>
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(Screen.TRACK)}
            className="mt-6 px-8 py-3.5 bg-[#8140F3] text-white rounded-full text-xs font-bold tracking-widest shadow-[0_8px_20px_rgba(129,64,243,0.3)] hover:opacity-95 transition-all"
          >
            START TRACKING
          </motion.button>
        </section>

        {/* Stats Grid Matrix */}
        <section className="grid grid-cols-3 gap-3">
          {/* KCAL */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 border border-[#EDEFEF] shadow-sm">
            <Flame className="w-5 h-5 text-red-500" />
            <div className="text-center">
              <span className="text-[20px] font-bold text-[#1C1B1B] tabular-nums">{caloriesBurned}</span>
              <p className="text-[10px] font-bold text-[#4A4455] uppercase tracking-wider opacity-60">kcal</p>
            </div>
          </div>
          {/* DISTANCE */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 border-b-2 border-b-[#8140F3]/40 border-l border-t border-r border-[#EDEFEF] shadow-sm">
            <Route className="w-5 h-5 text-[#8140F3]" />
            <div className="text-center">
              <span className="text-[20px] font-bold text-[#1C1B1B] tabular-nums">{distanceCovered.toFixed(1)}</span>
              <p className="text-[10px] font-bold text-[#4A4455] uppercase tracking-wider opacity-60">km</p>
            </div>
          </div>
          {/* MINUTES */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 border border-[#EDEFEF] shadow-sm">
            <Clock className="w-5 h-5 text-emerald-500" />
            <div className="text-center">
              <span className="text-[20px] font-bold text-[#1C1B1B] tabular-nums">{activeMinutes}</span>
              <p className="text-[10px] font-bold text-[#4A4455] uppercase tracking-wider opacity-60">mins</p>
            </div>
          </div>
        </section>

        {/* Trending Rewards horizontal scroll */}
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-extrabold text-[#1C1B1B] tracking-tight">Trending Rewards</h2>
            <button 
              onClick={() => onNavigate(Screen.STORE)}
              className="text-[11px] font-bold text-[#8140F3] hover:underline flex items-center gap-0.5"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-5 px-5">
            {mockTrendingBrands.map((brand) => (
              <motion.div
                key={brand.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(Screen.BRAND_STORE, { brandId: brand.id, brandName: brand.name })}
                className="flex-shrink-0 w-28 bg-white border border-[#EDEFEF] rounded-2xl p-3 flex flex-col items-center gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] cursor-pointer hover:border-[#8140F3]/20"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100 p-1 shadow-inner">
                  <img 
                    alt={brand.name} 
                    src={brand.image} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-full" 
                  />
                </div>
                <span className="text-[11px] font-bold text-[#4A4455] line-clamp-1">{brand.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Weekly Momentum Teaser chart */}
        <section 
          onClick={() => onNavigate(Screen.REPORT)}
          className="bg-white border border-[#EDEFEF] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden cursor-pointer hover:border-[#8140F3]/10"
        >
          <div className="relative z-10">
            <h3 className="text-base font-extrabold text-[#1C1B1B] flex items-center justify-between">
              Weekly Momentum
              <ChevronRight className="w-4 h-4 text-[#8140F3]" />
            </h3>
            <p className="text-xs text-[#4A4455] opacity-75 mt-0.5 mb-5">You're 12% more active than last week!</p>
            
            {/* Minimal vertical bars */}
            <div className="flex items-end gap-3.5 h-20">
              <div className="flex-1 bg-gray-100 rounded-full h-[50%]" />
              <div className="flex-1 bg-gray-100 rounded-full h-[65%]" />
              <div className="flex-1 bg-gray-100 rounded-full h-[45%]" />
              <div className="flex-1 bg-[#8140F3] rounded-full h-[95%] shadow-[0_0_8px_rgba(129,64,243,0.3)]" />
              <div className="flex-1 bg-gray-100 rounded-full h-[40%]" />
              <div className="flex-1 bg-gray-100 rounded-full h-[60%]" />
              <div className="flex-1 bg-gray-100 rounded-full h-[30%]" />
            </div>
            
            <div className="flex justify-between text-[9px] font-bold text-[#4A4455] opacity-50 mt-2 px-1">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span className="text-[#8140F3] font-extrabold font-sans">F</span>
              <span>S</span>
              <span>S</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
