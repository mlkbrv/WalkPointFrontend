/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen, LeaderboardUser } from '../types';
import { Award, Bell } from 'lucide-react';
import { LEADERBOARD_USERS } from '../data';
import { motion } from 'motion/react';

interface ScoreboardScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  mySteps: number;
}

export default function ScoreboardScreen({ onNavigate, mySteps }: ScoreboardScreenProps) {
  // Sub-tabs: 'global' | 'friends' | 'squad'
  const [boardType, setBoardType] = useState<'global' | 'friends' | 'squad'>('global');

  // Top 3 positions
  const top1 = LEADERBOARD_USERS[0]; // Marcus T
  const top2 = LEADERBOARD_USERS[1]; // Sarah K
  const top3 = LEADERBOARD_USERS[2]; // Alex M

  // Position 4 onwards
  const remainingUsers = LEADERBOARD_USERS.slice(3);

  // Dynamic user list based on subtabs
  const getLeaderboardList = () => {
    switch (boardType) {
      case 'friends':
        return [
          { rank: 4, name: 'James L.', steps: 15820, stepsFormatted: '15.8k', statusText: 'Yesterday: 12.1k', avatar: LEADERBOARD_USERS[3].avatar },
          { rank: 5, name: 'Chris P.', steps: 13950, stepsFormatted: '13.9k', statusText: 'Level 24', avatar: LEADERBOARD_USERS[5].avatar }
        ];
      case 'squad':
        return [
          { rank: 4, name: 'Maya W.', steps: 14200, stepsFormatted: '14.2k', statusText: 'On a streak!', avatar: LEADERBOARD_USERS[4].avatar },
          { rank: 5, name: 'Squad Goal Team Alpha', steps: 154000, stepsFormatted: '154k', statusText: 'Combined progress', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiPqFDLXROalGxo1xC3ynfnqAULPARhaagm9RW4uZp-iKQMVQedD5EgNRHG6At7bzlyGg8_H_Gvw0mxu4ClEJgQL8ZEh-QOiXUjWK72y0vBfIJ_bK8y4nzL7f_TNPKqbOl2lxBV7oVItOwa1h8-itarTvYJXfhPwVSX3FCoFRoe7o65NGosonB0waw-RxClgtl5tyKXFNLfA3p4oLZrJT5uCyhKPbZJOE9pSRZ2Xo4BffmtRJ_TZJSyTVZjIUh4X7__VPHpZN5iKQ' }
        ];
      case 'global':
      default:
        return remainingUsers;
    }
  };

  const activeRanks = getLeaderboardList();

  return (
    <div id="scoreboard_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
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

      {/* Main Scoreboard Scrollable Area */}
      <main className="flex-1 px-5 pb-28 pt-4 space-y-6">
        
        {/* Toggle sub-controls */}
        <section className="flex p-1 bg-surface-container rounded-xl max-w-sm mx-auto shadow-inner bg-[#F0EDED]">
          {(['global', 'friends', 'squad'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setBoardType(type)}
              className={`flex-1 py-2 text-xs font-bold capitalize transition-all rounded-lg ${
                boardType === type
                  ? 'bg-white text-[#8140F3] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {type}
            </button>
          ))}
        </section>

        {/* Podium Visualization */}
        <section className="bg-gradient-to-b from-[#8140F3]/5 to-transparent rounded-3xl py-8 px-4 flex items-end justify-center gap-4 relative">
          
          {/* Position 2 (Silver) */}
          <div className="flex flex-col items-center gap-2 mb-2 w-24">
            <div className="relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-slate-400">
                <Award className="w-6 h-6" />
              </div>
              <div className="w-18 h-18 rounded-full border-4 border-slate-200 overflow-hidden shadow-md">
                <img 
                  alt={top2.name} 
                  src={top2.avatar} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">
                2
              </div>
            </div>
            <p className="text-[11px] font-bold text-gray-700 truncate w-full text-center mt-2">{top2.name}</p>
            <p className="text-sm font-black text-[#8140F3]">{top2.stepsFormatted}</p>
          </div>

          {/* Position 1 (Gold) */}
          <div className="flex flex-col items-center gap-2 w-28 scale-105">
            <div className="relative">
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                <Award className="w-8 h-8 fill-amber-500" />
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-amber-400 overflow-hidden shadow-[0_12px_24px_rgba(245,158,11,0.25)]">
                <img 
                  alt={top1.name} 
                  src={top1.avatar} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[#1C1B1B] font-black text-xs px-3 py-1 rounded-full shadow-lg">
                1
              </div>
            </div>
            <p className="text-xs font-black text-gray-900 truncate w-full text-center mt-3">{top1.name}</p>
            <p className="text-xl font-black text-[#8140F3]">{top1.stepsFormatted}</p>
            <p className="text-[9px] font-black text-[#8140F3]/60 uppercase tracking-widest leading-none">STEPS</p>
          </div>

          {/* Position 3 (Bronze) */}
          <div className="flex flex-col items-center gap-2 mb-2 w-24">
            <div className="relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-amber-700">
                <Award className="w-6 h-6" />
              </div>
              <div className="w-18 h-18 rounded-full border-4 border-amber-600/40 overflow-hidden shadow-md">
                <img 
                  alt={top3.name} 
                  src={top3.avatar} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">
                3
              </div>
            </div>
            <p className="text-[11px] font-bold text-gray-700 truncate w-full text-center mt-2">{top3.name}</p>
            <p className="text-sm font-black text-[#8140F3]">{top3.stepsFormatted}</p>
          </div>
        </section>

        {/* Current Rankings Header & Vertical list */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-[#7B7487] uppercase tracking-widest px-2">CURRENT RANKINGS</h3>
          
          <div className="space-y-2.5">
            {/* Highlights "Felix (You)" on Global, or show personalized ranks */}
            {boardType === 'global' && (
              <div 
                onClick={() => onNavigate(Screen.PROFILE)}
                className="flex items-center gap-4 p-4 border border-[#8140F3]/30 rounded-3xl bg-[#8140F3]/10 shadow-sm cursor-pointer hover:bg-[#8140F3]/15 transition-colors"
              >
                <span className="text-lg font-black italic text-[#8140F3] w-6 text-center">12</span>
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow">
                  <img 
                    alt="Felix Avatar" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyfhpFz7UNF5kFV7SEcvKOgD8aBjwxMcXWzxQ_6rRiZkF_PdQM29OEzC5g2bqsl7iY8DcF8fsEX03CzncWyy_tZhEHrwx7gzleaHKfGBBUHLQzYThbJrag-yPMfBtujhr0WGmDLr-z9Y9HW-eVVz2RVflf1mwku5VvR7j4w904b_L35hqWM_G-8tjXXXSyixTom8bO9dU_b_soUg5lMjpElOmeqPjpEbhOi7O1Xr49Pv_8CORRlJYGulUseldm3pRKMEZ4YlSssq8" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-[#1C1B1B] text-sm">Felix (You)</h4>
                  <p className="text-[11px] font-bold text-gray-500 opacity-80">Keep going!</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#1C1B1B] tabular-nums">{mySteps.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-[#8140F3] uppercase tracking-wider">STEPS</p>
                </div>
              </div>
            )}

            {/* List remaining position cards */}
            {activeRanks.map((user: any, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-4 p-4 border border-[#EDEFEF] rounded-3xl bg-white shadow-sm hover:border-[#8140F3]/10 transition-colors"
              >
                <span className="text-base font-bold text-gray-400 w-6 text-center">{user.rank}</span>
                <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                  <img 
                    alt={user.name} 
                    src={user.avatar} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#1C1B1B] text-sm truncate">{user.name}</h4>
                  <p className="text-xs text-gray-400 font-semibold">{user.statusText}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-gray-700 tabular-nums">
                    {user.steps.toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">STEPS</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
