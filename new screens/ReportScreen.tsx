/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen } from '../types';
import { TrendingUp, ArrowUp, Coins, Bell, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
}

export default function ReportScreen({ onNavigate }: ReportScreenProps) {
  // Navigation Mode state: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  const getStats = () => {
    switch (viewMode) {
      case 'day':
        return {
          totalText: '9,432',
          labelText: 'Today\'s Steps',
          changeText: '4% more than yesterday',
          changeColor: 'text-[#8140F3]',
          bars: [0, 0, 0, 0, 59, 0, 0] // only today (Fri) has data
        };
      case 'month':
        return {
          totalText: '312,480',
          labelText: 'Monthly Total',
          changeText: '8% more than last month',
          changeColor: 'text-emerald-500',
          bars: [70, 85, 60, 90, 80, 50, 45]
        };
      case 'week':
      default:
        return {
          totalText: '74,230',
          labelText: 'Weekly Total',
          changeText: '12% more than last week',
          changeColor: 'text-emerald-500',
          bars: [60, 75, 45, 90, 82, 0, 0] // M, T, W, T, F (Today), S, S
        };
    }
  };

  const currentStats = getStats();

  return (
    <div id="report_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* TopAppBar */}
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
        <button 
          onClick={() => onNavigate(Screen.NOTIFICATIONS)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-6 h-6 text-[#8140F3]" />
        </button>
      </header>

      {/* Main Analytics Canvas */}
      <main className="flex-1 px-5 pb-28 pt-4 space-y-6">
        
        {/* Segmented Switcher Controls */}
        <section className="flex p-1 bg-[#F0EDED] rounded-full max-w-sm mx-auto shadow-inner">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-2 text-xs font-bold capitalize transition-all rounded-full ${
                viewMode === mode
                  ? 'bg-white text-[#8140F3] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </section>

        {/* Dynamic Cumulative Hero metrics */}
        <section className="text-center space-y-1">
          <p className="text-[10px] font-bold text-[#4A4455] uppercase tracking-widest opacity-80">
            {currentStats.labelText}
          </p>
          <motion.h2 
            key={viewMode}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[48px] font-black tracking-tight text-[#8140F3] leading-none"
          >
            {currentStats.totalText}
          </motion.h2>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-emerald-500">{currentStats.changeText}</span>
          </div>
        </section>

        {/* Dynamic vertical bar comparison charts */}
        <section className="bg-white border border-[#EDEFEF] p-5 rounded-3xl shadow-[0_12px_40px_rgba(26,26,26,0.04)]">
          <div className="flex justify-between items-end h-52 gap-3.5 pt-6 pb-2">
            {/* Days indicator bars map */}
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
              const heightPercentage = currentStats.bars[idx];
              const isToday = day === 'F' && viewMode === 'week'; // Simulating today on Friday
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                  <div className="w-full bg-[#F6F3F2] rounded-full h-full relative overflow-hidden group">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`absolute bottom-0 w-full rounded-full ${
                        isToday 
                          ? 'bg-[#8140F3] shadow-[0_0_8px_rgba(129,64,243,0.4)]' 
                          : 'bg-[#8140F3]/40'
                      }`}
                    >
                      {isToday && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1C1B1B] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap">
                          Today
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-[#8140F3]' : 'text-[#7B7487]'}`}>{day}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Analytics Insights Grid */}
        <section className="space-y-3">
          {/* Performance Peak Cover */}
          <div className="bg-[#8140F3] p-5 rounded-3xl text-white flex items-center justify-between shadow-[0_8px_20px_rgba(129,64,243,0.3)] border border-[#8140F3]/10">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold tracking-tight">Performance Peak</h3>
              <p className="text-xs text-white/80 leading-snug">You walked 12% more than last week!</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
              <ArrowUp className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Daily Avg */}
            <div className="bg-white border border-[#EDEFEF] p-5 rounded-3xl space-y-3 flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DAILY AVG</p>
                <p className="text-[20px] font-black text-[#1C1B1B] leading-none mt-1">10,604</p>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-3/4" />
              </div>
            </div>

            {/* Best day */}
            <div className="bg-white border border-[#EDEFEF] p-5 rounded-3xl space-y-1 flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BEST DAY</p>
                <p className="text-[20px] font-black text-[#1C1B1B] leading-none mt-1">Thursday</p>
              </div>
              <p className="text-[10px] font-extrabold text-[#8140F3] uppercase tracking-wide">14.2k steps</p>
            </div>
          </div>
        </section>

        {/* Weekly Coin Goal Tracker */}
        <section className="bg-white/80 border border-dashed border-[#ccc3d8] p-5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 shadow-inner">
              <Coins className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#1C1B1B]">
                <span>Weekly Coin Goal</span>
                <span className="text-[#8140F3]">850 / 1000</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#8140F3] to-[#ff6b6b] w-[85%] rounded-full" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
