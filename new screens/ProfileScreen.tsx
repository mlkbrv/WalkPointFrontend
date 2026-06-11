/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Screen, UserProfile } from '../types';
import { ChevronLeft, Edit2, Lock, HelpCircle, HardDrive, ShieldAlert, LogOut } from 'lucide-react';
import { MOCK_USER } from '../data';
import { motion } from 'motion/react';

interface ProfileScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export default function ProfileScreen({ onNavigate, userProfile, onUpdateProfile }: ProfileScreenProps) {
  // Local edit states triggers
  const [isEditingMetrics, setIsEditingEditingMetrics] = useState(false);
  const [tempWeight, setTempWeight] = useState(userProfile.weight);
  const [tempHeight, setTempHeight] = useState(userProfile.height);

  return (
    <div id="profile_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full px-5 py-4 bg-[#FCF9F8]/80 backdrop-blur-xl border-b border-[#F0EDED]">
        <button 
          onClick={() => onNavigate(Screen.HOME)}
          className="flex items-center gap-1.5 font-bold text-xs text-[#8140F3] hover:underline"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Home</span>
        </button>
        <h1 className="text-base font-extrabold text-gray-900 tracking-tight">User Profile</h1>
        <div className="w-14" /> {/* Spacer */}
      </header>

      <main className="flex-1 px-5 pb-16 pt-6 space-y-6">
        
        {/* User Badge Details */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-[#8140F3] p-1 shadow-lg shadow-[#8140F3]/10">
              <img 
                alt="Profile Avatar" 
                src={userProfile.avatar} 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            {/* Round edit edit button overlay */}
            <button className="absolute bottom-1 right-1 bg-[#8140F3] text-white p-2 rounded-full border-2 border-[#FCF9F8] shadow-md hover:opacity-95 active:scale-95 transition-all">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{userProfile.name}</h2>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Active Member Since {userProfile.joinYear}</p>
          </div>
        </section>

        {/* Physical metrics cards */}
        <section className="grid grid-cols-3 gap-3">
          {/* Weight */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDEFEF] shadow-sm flex flex-col items-center justify-center relative group">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">WEIGHT</span>
            {isEditingMetrics ? (
              <input 
                type="number" 
                value={tempWeight} 
                onChange={(e) => setTempWeight(+e.target.value)}
                className="w-16 text-center border-b border-[#8140F3] text-base font-black text-[#8140F3] focus:outline-none focus:ring-0 p-0"
              />
            ) : (
              <span className="text-base font-black text-[#8140F3]">{userProfile.weight} kg</span>
            )}
          </div>

          {/* Height */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDEFEF] shadow-sm flex flex-col items-center justify-center relative group">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">HEIGHT</span>
            {isEditingMetrics ? (
              <input 
                type="number" 
                value={tempHeight} 
                onChange={(e) => setTempHeight(+e.target.value)}
                className="w-16 text-center border-b border-[#8140F3] text-base font-black text-[#8140F3] focus:outline-none focus:ring-0 p-0"
              />
            ) : (
              <span className="text-base font-black text-[#8140F3]">{userProfile.height} cm</span>
            )}
          </div>

          {/* Goal */}
          <div className="bg-white rounded-2xl p-4 border border-[#EDEFEF] shadow-sm flex flex-col items-center justify-center relative">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">GOAL</span>
            <span className="text-base font-black text-[#8140F3]">16k</span>
          </div>
        </section>

        {/* Dynamic Metric Save Action under cards when editing */}
        <div className="flex justify-center select-none">
          <button
            onClick={() => {
              if (isEditingMetrics) {
                onUpdateProfile({ weight: tempWeight, height: tempHeight });
              }
              setIsEditingEditingMetrics(!isEditingMetrics);
            }}
            className="text-xs font-black text-[#8140F3] hover:underline flex items-center gap-1"
          >
            {isEditingMetrics ? 'Save Metrics' : 'Edit Physical Metrics'}
          </button>
        </div>

        {/* List of Settings elements */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">SETTINGS</h3>
          
          <div className="space-y-3">
            {/* Connected devices card */}
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-[#EDEFEF] shadow-sm group hover:border-[#8140F3]/25 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#8140F3]/10 text-[#8140F3] rounded-xl flex items-center justify-center shadow-inner">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1C1B1B]">Connected Devices</h4>
                  <p className="text-[11px] font-bold text-gray-400">Apple Health &amp; Fit Synced</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider bg-emerald-100/50 px-2 py-1 rounded-md">CONNECTED</span>
            </div>

            {/* Privacy toggle card */}
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-[#EDEFEF] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#8140F3]/10 text-[#8140F3] rounded-xl flex items-center justify-center shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1C1B1B]">Privacy &amp; Permissions</h4>
                  <p className="text-[11px] font-bold text-gray-400">Control profile rankings visibility</p>
                </div>
              </div>
              
              {/* Animated Switch toggle button */}
              <button 
                onClick={() => onUpdateProfile({ privacyEnabled: !userProfile.privacyEnabled })}
                className={`relative w-11 h-6 transition-colors rounded-full ${userProfile.privacyEnabled ? 'bg-[#8140F3]' : 'bg-gray-200'}`}
              >
                <motion.div 
                  layout
                  className="absolute left-[3px] top-[3px] bg-white rounded-full h-[18px] w-[18px] shadow-sm"
                  animate={{ x: userProfile.privacyEnabled ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Help Support */}
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-[#EDEFEF] shadow-sm hover:border-[#8140F3]/25 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#8140F3]/10 text-[#8140F3] rounded-xl flex items-center justify-center shadow-inner">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1C1B1B]">Help &amp; Support</h4>
                  <p className="text-[11px] font-bold text-gray-400">FAQs &amp; secure assistance support</p>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </div>
          </div>
        </section>

        {/* Footer Credit & Log out */}
        <section className="flex flex-col items-center pt-8 space-y-4">
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              alert('Logging out of virtual sessions successfully.');
              onNavigate(Screen.HOME);
            }}
            className="flex items-center gap-2 text-red-500 font-extrabold text-sm py-2 px-6 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </motion.button>
          
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">STRIDE VERSION 4.2.0-ALPHA</p>
        </section>

      </main>
    </div>
  );
}
