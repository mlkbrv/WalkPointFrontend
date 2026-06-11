/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Screen, WorkoutData } from '../types';
import { Award, CheckCircle, Navigation, Flame, Activity, Timer, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface WorkoutSummaryScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  workoutData: WorkoutData | null;
  onAccumulateSteps: (stepsEarned: number) => void;
}

export default function WorkoutSummaryScreen({
  onNavigate,
  workoutData,
  onAccumulateSteps,
}: WorkoutSummaryScreenProps) {
  // Safe Fallback mockup values if workoutData was empty
  const data: WorkoutData = workoutData || {
    duration: '00:42:15',
    avgSpeed: 5.2,
    distance: 3.84,
    calories: 312,
    name: 'Morning Central Park Run',
    tokensEarned: 250,
  };

  const handleSaveWorkout = () => {
    // Simulating adding 9,432 steps (starting) + 3,840 steps (approx distance) -> updates global balance!
    onAccumulateSteps(Math.round(data.distance * 1000));
    onNavigate(Screen.HOME);
  };

  return (
    <div id="workout_summary_screen" className="flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B]">
      
      {/* Celebration Header space */}
      <header className="px-5 py-6 bg-gradient-to-b from-[#8140F3]/10 to-transparent flex flex-col items-center text-center space-y-4 pt-10 select-none">
        <div className="w-16 h-16 bg-[#8140F3] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#8140F3]/25 animate-bounce">
          <Award className="w-8 h-8 fill-current" />
        </div>
        
        <div className="space-y-1">
          <h1 className="text-sm font-black text-[#8140F3] uppercase tracking-widest leading-none">WORKOUT COMPLETED!</h1>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">Phenomenal Stride, Felix!</h2>
        </div>
      </header>

      {/* Main stats board summary */}
      <main className="flex-1 px-5 pb-16 space-y-6">
        
        {/* Massive celebratory Purple token rewards banner */}
        <section className="bg-gradient-to-r from-[#8140F3] to-[#ff6b6b] p-6 rounded-[28px] text-white shadow-xl relative overflow-hidden flex flex-col select-none border border-white/15">
          {/* subtle abstract background nodes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-[40px] pointer-events-none" />
          
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80 leading-none">LIFESTYLE REWARD</span>
          <h3 className="text-3xl font-black tracking-tight mt-2">
            +{data.tokensEarned} Step-Tokens!
          </h3>
          <p className="text-xs text-white/80 font-medium mt-1 leading-relaxed max-w-[280px]">
            Your activity metrics earned you premium tokens. Trade them inside the Reward Store!
          </p>
        </section>

        {/* Dynamic 4-Column stats metrics comparison grids */}
        <section className="grid grid-cols-2 gap-3">
          {/* Distance */}
          <div className="bg-white rounded-3xl p-4.5 border border-[#EDEFEF] shadow-sm flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between text-[#8140F3]">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">DISTANCE</span>
              <Navigation className="w-4 h-4 fill-current rotate-45" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 leading-none tabular-nums">
                {data.distance} <span className="text-xs font-semibold text-gray-400">km</span>
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-3xl p-4.5 border border-[#EDEFEF] shadow-sm flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between text-indigo-500">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">DURATION</span>
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 leading-none tabular-nums">
                {data.duration}
              </p>
            </div>
          </div>

          {/* Speed */}
          <div className="bg-white rounded-3xl p-4.5 border border-[#EDEFEF] shadow-sm flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between text-amber-500">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">SPEED</span>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 leading-none tabular-nums">
                {data.avgSpeed} <span className="text-xs font-semibold text-gray-400">km/h</span>
              </p>
            </div>
          </div>

          {/* Calories */}
          <div className="bg-white rounded-3xl p-4.5 border border-[#EDEFEF] shadow-sm flex flex-col justify-between min-h-[105px]">
            <div className="flex items-center justify-between text-red-500">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">CALORIES</span>
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 leading-none tabular-nums">
                {data.calories} <span className="text-xs font-semibold text-gray-400">kcal</span>
              </p>
            </div>
          </div>
        </section>

        {/* Small Central map track card route preview */}
        <section className="bg-white border border-[#EDEFEF] rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-[10px] font-black text-gray-400 tracking-wider uppercase">ROUTE COMPLETED</h4>
            <span className="text-xs font-bold text-[#8140F3]">{data.name}</span>
          </div>

          <div className="aspect-[2/1] w-full rounded-2xl overflow-hidden relative border border-gray-100 shadow-inner">
            <img 
              alt="Track route thumbnail map" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDF3elrovdHoorFeeQvlJh6umD0JzkFeaiUK4hB7z_sVjtkhwkyjmOVDv0Iw8llUQjJSWSaXoYPcQJFYT3fhttvkZ1hMRKRCBVVQG84nazWI-UtI4P7b9nfkZO-lv0-427_eSYrbJ-odcGch20DV859LgnUwzXyId4_lSX74_5b_e4h03LleljYj3ZdY-vEv6amdqc30GEfOWj1nsM5kP-r7Q4-HKkfx5IoucS8KZbQ6K_PnV3-EjDp9NI41J5Ufor_UeqfQQAvPoc" 
              className="w-full h-full object-cover grayscale opacity-90 filter brightness-95"
            />
            {/* simple map track marker */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path 
                d="M 120,150 Q 150,110 220,100 T 260,50" 
                fill="none" 
                stroke="#8140F3" 
                strokeWidth="5" 
                strokeLinecap="round" 
                className="opacity-90"
              />
              <circle cx="260" cy="50" r="6" fill="#8140F3" />
            </svg>
          </div>
        </section>

        {/* Share achievements details block */}
        <div className="bg-[#8140F3]/5 p-4 rounded-2xl text-center">
          <p className="text-[11px] text-[#8140F3] font-bold">
            ⚡ Shared with Stride Community Squad! Your +3.8k daily metrics are verified.
          </p>
        </div>

        {/* Save Workouts absolute footer trigger */}
        <div className="pt-4 select-none">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveWorkout}
            className="w-full bg-[#8140F3] hover:opacity-95 text-white py-4.5 rounded-2xl font-black text-sm tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-[#8140F3]/25 active:scale-95 transition-all text-center uppercase"
          >
            <CheckCircle className="w-5 h-5 fill-current text-white" />
            <span>Save &amp; Complete Workout</span>
          </motion.button>
        </div>
      </main>
    </div>
  );
}
