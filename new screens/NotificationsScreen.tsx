/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen, NotificationItem } from '../types';
import { ChevronLeft, Trophy, BellOff, Award, Copy, Check, TrendingUp } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
}

export default function NotificationsScreen({
  onNavigate,
  notifications,
  onMarkAllAsRead,
}: NotificationsScreenProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group notifications
  const todayNotifs = notifications.filter((n) => n.isToday);
  const yesterdayNotifs = notifications.filter((n) => !n.isToday);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div id="notifications_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* Header Banner */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full px-5 py-4 bg-[#FCF9F8]/80 backdrop-blur-xl border-b border-[#F0EDED]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate(Screen.HOME)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-[#8140F3]" />
          </button>
          <h1 className="text-lg font-black tracking-tight text-gray-900">Notifications</h1>
        </div>
        
        {notifications.length > 0 && (
          <button 
            onClick={onMarkAllAsRead}
            className="text-xs font-bold text-[#8140F3] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </header>

      {/* Main Containers */}
      <main className="flex-1 px-5 pb-16 pt-6">
        <AnimatePresence mode="wait">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-[#8140F3]/10 text-[#8140F3] rounded-full flex items-center justify-center shadow-inner">
                <BellOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-800">All caught up!</h3>
                <p className="text-xs text-gray-400 font-semibold max-w-[200px] mx-auto leading-relaxed">
                  No new alerts. Keep walking to earn step-tokens and achieve milestones!
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="notif-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Today Group items */}
              {todayNotifs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">TODAY</h2>
                  <div className="space-y-3">
                    {todayNotifs.map((n) => (
                      <div 
                        key={n.id}
                        className="bg-white rounded-2xl p-4 border border-[#EDEFEF] shadow-sm flex gap-4 relative overflow-hidden group hover:border-[#8140F3]/25 transition-all"
                      >
                        {/* Purple leading tag bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8140F3]" />
                        
                        {/* Left avatar/icon section */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {n.avatar ? (
                            <img 
                              alt="Social Avatar" 
                              src={n.avatar} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#8140F3]/10 text-[#8140F3] rounded-full flex items-center justify-center shadow-inner">
                              <Trophy className="w-6 h-6 stroke-[2]" />
                            </div>
                          )}
                          
                          {/* Mini flare marker badges on overtake */}
                          {n.type === 'social' && (
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-white text-white">
                              <TrendingUp className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Content text side */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-semibold text-gray-700 leading-relaxed min-w-0 pr-2">
                              {n.type === 'social' ? (
                                <>
                                  <span className="font-extrabold text-gray-900 pr-1">Emil</span> 
                                  just overtook you on the <span className="text-[#8140F3] font-extrabold">Leaderboard</span>!
                                </>
                              ) : (
                                n.description
                              )}
                            </p>
                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap pt-0.5">{n.timeText}</span>
                          </div>

                          {/* reclaim rank CTA */}
                          {n.actionText && (
                            <button 
                              onClick={() => onNavigate(Screen.TRACK)}
                              className="mt-3 bg-[#8140F3] text-white text-[10px] font-black px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(129,64,243,0.2)] hover:opacity-95 active:scale-95 transition-all uppercase tracking-wider"
                            >
                              {n.actionText}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday Group items */}
              {yesterdayNotifs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">YESTERDAY</h2>
                  <div className="space-y-3">
                    {yesterdayNotifs.map((n) => (
                      <div 
                        key={n.id}
                        className="bg-white/80 rounded-2xl p-4 border border-[#EDEFEF] shadow-sm flex gap-4 opacity-90 hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 flex-shrink-0">
                          {n.avatar ? (
                            <img 
                              alt="Brand Avatar" 
                              src={n.avatar} 
                              className="w-full h-full rounded-full object-cover border border-[#F0EDED]"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#EDEFEF] text-gray-500 rounded-full flex items-center justify-center shadow-inner">
                              <Trophy className="w-6 h-6 text-[#7B7487]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-black text-gray-900">{n.title}</h3>
                              <p className="text-xs font-semibold text-gray-500 mt-0.5 leading-relaxed">{n.description}</p>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap pt-0.5">{n.timeText}</span>
                          </div>

                          {/* Clipboard voucher code container card */}
                          {n.couponCode && (
                            <div className="mt-3.5 p-3 bg-gray-50 rounded-xl border border-dashed border-[#8140F3]/30 flex items-center justify-between">
                              <span className="font-mono text-xs font-black tracking-widest text-[#1C1B1B]">{n.couponCode}</span>
                              <button 
                                onClick={() => handleCopyCode(n.couponCode!, n.id)}
                                className="text-[#8140F3] hover:text-[#8140F3]/80 p-1"
                              >
                                {copiedId === n.id ? (
                                  <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
