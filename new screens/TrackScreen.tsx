/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Screen, WorkoutData } from '../types';
import { Navigation, Layers, Play, Pause, Square, Check, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrackScreenProps {
  onNavigate: (screen: Screen, params?: any) => void;
  onWorkoutCompleted: (data: WorkoutData) => void;
}

export default function TrackScreen({ onNavigate, onWorkoutCompleted }: TrackScreenProps) {
  // Layers State: 'standard' | 'satellite' | 'dark'
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite' | 'dark'>('dark');
  const [showLayerSheet, setShowLayerSheet] = useState(false);

  // Simulation Running State
  const [isRunning, setIsRunning] = useState(true);
  const [seconds, setSeconds] = useState(2535); // Initialized to 42:15 (2535s)
  const [distance, setDistance] = useState(3.84);
  const [calories, setCalories] = useState(312);
  const [speed, setSpeed] = useState(5.2);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
        setDistance((prev) => prev + 0.0012); // slow gradual simulation increase
        setCalories((prev) => prev + 0.09); // gradual calorie burn
        // fluctuate speed slightly for dynamic feel
        setSpeed((prev) => {
          const delta = (Math.random() - 0.5) * 0.2;
          const newSpeed = +(prev + delta).toFixed(1);
          return Math.max(4.5, Math.min(newSpeed, 6.0));
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':');
  };

  // Map Source depends on layer
  const getMapImage = () => {
    if (mapLayer === 'standard') {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCj6yJz346cU8-2uwxyCenTt45WIm2Hh_TcQVcUwkw20UoXmi7Rrm4Hya9LLEMs6zh48ZmepbhCH45uVGLEYQvOA6khEM15DSH1VeosZeMRmqzz7H8VX5mDD1imCtRtIhSpsIwHrMEouVmvHoGfsUUYAJrnjTY7YbvK3HSKByxYiCN5sLH-49EuwR6d-_0vMvsyjEbuCrsXVhEgSGCTeSNmBNw2TDMt6nTf7uQ9xbXUNaN3IXiKFYlmY0LuqvwfXytpB-NQ8m2aEAU';
    }
    if (mapLayer === 'satellite') {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaO0SroLpZg-87n7X7sMA5-zBxUqeZuZFKScvgLzjdCdHw8QwDnHLMNRczs3WlyO0YtGjc_jIZ7OYy2GDmIW-7VIwnbv_9sCUU0jmn6TXYLy2QUpb1iVgcxessOCeSn76UXlYnYwi2sXSNkO7vi1QLC9eGM53iz1UnGd6pnEllN58Y8T6f-kGLjRvvdDdljXABVh2aph21TlpWv9vNTsRNEfg3NTiPN1etXmGvYKysRknfpmtNuXIvRto7snGAPICJLQe4zLW6okM';
    }
    // Deep dark vector map
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF3elrovdHoorFeeQvlJh6umD0JzkFeaiUK4hB7z_sVjtkhwkyjmOVDv0Iw8llUQjJSWSaXoYPcQJFYT3fhttvkZ1hMRKRCBVVQG84nazWI-UtI4P7b9nfkZO-lv0-427_eSYrbJ-odcGch20DV859LgnUwzXyId4_lSX74_5b_e4h03LleljYj3ZdY-vEv6amdqc30GEfOWj1nsM5kP-r7Q4-HKkfx5IoucS8KZbQ6K_PnV3-EjDp9NI41J5Ufor_UeqfQQAvPoc';
  };

  const handleStopWorkout = () => {
    const finalData: WorkoutData = {
      duration: formatTime(seconds),
      avgSpeed: 5.2, // standard mean
      distance: +distance.toFixed(2),
      calories: Math.round(calories),
      name: 'Morning Run Route',
      tokensEarned: 250,
    };
    onWorkoutCompleted(finalData);
  };

  return (
    <div id="track_screen" className="relative flex flex-col min-h-screen bg-[#FCF9F8] text-[#1C1B1B] overflow-hidden">
      {/* Absolute Full View Map */}
      <div className="absolute inset-0 w-full h-full z-0 bg-gray-200">
        <img
          alt="Live Tracking Map"
          src={getMapImage()}
          className="w-full h-full object-cover transition-all duration-500"
        />
        {/* Glow overlay path simulated over map */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#8140f3" />
              <stop offset="100%" stopColor="#006040" />
            </linearGradient>
          </defs>
          <path
            d="M 120,600 Q 150,500 220,440 T 260,250"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90 shadow-lg"
            style={{ filter: 'drop-shadow(0 0 8px rgba(129, 64, 243, 0.8))' }}
          />
          {/* Tracking position marker indicator */}
          <circle cx="260" cy="250" r="10" fill="#8140F3" className="animate-pulse" />
          <circle cx="260" cy="250" r="18" fill="none" stroke="#8140F3" strokeWidth="2" className="animate-pulse opacity-75" />
        </svg>
      </div>

      {/* Shared Glass Header overlay */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between w-full px-5 py-4 bg-white/70 backdrop-blur-md border-b border-[#F0EDED]/30 select-none">
        <div 
          onClick={() => onNavigate(Screen.PROFILE)} 
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img 
              alt="Profile" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLt_bPOT03UWfr6BZOLZDLgeQosxr0OoIlM6EeFpLgNthjGakwFdIRzWafHgrrP6NuEAYt4Fq5fQKJ0G2RzNG3rEM5B1tcBMSlY5e3GFk1ky50yjnP5sVZ9wtj4PJrXDFpXfVE_F-Ykmng7bopLF2XK0xKLI82gmwJAg8756b7RdKh1O2-iVrhOvvy1gwJnWwsSTwFIBVVWzIl-u78DysK0-AxdlLuJWUAcXiH0eG_y4hRTX2bzE-cBvoYw" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-[#8140F3]">STRIDE</span>
        </div>
        <button 
          onClick={() => onNavigate(Screen.NOTIFICATIONS)}
          className="p-2 rounded-full hover:bg-white/40 active:scale-95 transition-all"
        >
          <Bell className="w-6 h-6 text-[#8140F3]" />
        </button>
      </header>

      {/* Floating Utilities */}
      <div className="absolute top-24 right-5 z-20 flex flex-col gap-2.5">
        <button 
          className="w-12 h-12 bg-white/70 backdrop-blur-md rounded-xl shadow-md border border-white/50 flex items-center justify-center text-[#8140F3] active:scale-95 cursor-pointer hover:bg-white"
        >
          <Navigation className="w-5 h-5 fill-current" />
        </button>
        <button 
          onClick={() => setShowLayerSheet(true)}
          className="w-12 h-12 bg-white/70 backdrop-blur-md rounded-xl shadow-md border border-white/50 flex items-center justify-center text-[#8140F3] active:scale-95 cursor-pointer hover:bg-white"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Interactive HUD overlay card */}
      <div className="absolute bottom-28 left-5 right-5 z-20">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[32px] p-6 shadow-2xl flex flex-col">
          
          <div className="flex justify-between items-end mb-5">
            <div>
              <p className="text-[10px] font-bold text-[#4A4455] tracking-widest uppercase opacity-70">DURATION</p>
              <h2 className="text-[38px] font-black tracking-tight text-[#1C1B1B] tabular-nums leading-none mt-1">
                {formatTime(seconds)}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#4A4455] tracking-widest uppercase opacity-70">AVG SPEED</p>
              <p className="text-xl font-bold text-[#1C1B1B] mt-1">
                {speed.toFixed(1)} <span className="text-xs font-semibold">km/h</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/40 rounded-2xl p-3 border border-white/60">
              <p className="text-[9px] font-bold text-[#4A4455] tracking-wider opacity-60">DISTANCE</p>
              <p className="text-lg font-extrabold text-[#1C1B1B] tabular-nums mt-0.5">
                {distance.toFixed(2)} <span className="text-xs font-semibold">km</span>
              </p>
            </div>
            <div className="bg-white/40 rounded-2xl p-3 border border-white/60">
              <p className="text-[9px] font-bold text-[#4A4455] tracking-wider opacity-60">CALORIES</p>
              <p className="text-lg font-extrabold text-red-500 tabular-nums mt-0.5">
                {Math.round(calories)} <span className="text-xs font-semibold text-gray-500">kcal</span>
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-3">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 ${isRunning ? 'bg-[#8140F3]' : 'bg-emerald-500'} text-white py-4 rounded-2xl font-bold text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </>
              )}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.94 }}
              onClick={handleStopWorkout}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <Square className="w-5 h-5 fill-current" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Map layer bottom sheet selector */}
      <AnimatePresence>
        {showLayerSheet && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLayerSheet(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative bg-white/95 backdrop-blur-2xl border-t border-gray-100 rounded-t-[32px] p-6 shadow-3xl z-10 flex flex-col pb-10"
            >
              {/* Close handle */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              {/* Title row */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-[#1C1B1B]">Select Map View</h2>
                <button 
                  onClick={() => setShowLayerSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Standard */}
                <div 
                  onClick={() => setMapLayer('standard')} 
                  className="group cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <div className={`aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 relative transition-all ${mapLayer === 'standard' ? 'border-[#8140F3] shadow-md shadow-[#8140F3]/10' : 'border-transparent opacity-80'}`}>
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj6yJz346cU8-2uwxyCenTt45WIm2Hh_TcQVcUwkw20UoXmi7Rrm4Hya9LLEMs6zh48ZmepbhCH45uVGLEYQvOA6khEM15DSH1VeosZeMRmqzz7H8VX5mDD1imCtRtIhSpsIwHrMEouVmvHoGfsUUYAJrnjTY7YbvK3HSKByxYiCN5sLH-49EuwR6d-_0vMvsyjEbuCrsXVhEgSGCTeSNmBNw2TDMt6nTf7uQ9xbXUNaN3IXiKFYlmY0LuqvwfXytpB-NQ8m2aEAU" 
                      className="w-full h-full object-cover filter grayscale"
                      alt="Standard"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {mapLayer === 'standard' && (
                      <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-sm text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] ${mapLayer === 'standard' ? 'font-bold text-[#8140F3]' : 'font-semibold text-gray-500'}`}>Standard</span>
                </div>

                {/* Satellite */}
                <div 
                  onClick={() => setMapLayer('satellite')} 
                  className="group cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <div className={`aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 relative transition-all ${mapLayer === 'satellite' ? 'border-[#8140F3] shadow-md shadow-[#8140F3]/10' : 'border-transparent opacity-80'}`}>
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaO0SroLpZg-87n7X7sMA5-zBxUqeZuZFKScvgLzjdCdHw8QwDnHLMNRczs3WlyO0YtGjc_jIZ7OYy2GDmIW-7VIwnbv_9sCUU0jmn6TXYLy2QUpb1iVgcxessOCeSn76UXlYnYwi2sXSNkO7vi1QLC9eGM53iz1UnGd6pnEllN58Y8T6f-kGLjRvvdDdljXABVh2aph21TlpWv9vNTsRNEfg3NTiPN1etXmGvYKysRknfpmtNuXIvRto7snGAPICJLQe4zLW6okM" 
                      className="w-full h-full object-cover"
                      alt="Satellite"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {mapLayer === 'satellite' && (
                      <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-sm text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] ${mapLayer === 'satellite' ? 'font-bold text-[#8140F3]' : 'font-semibold text-gray-500'}`}>Satellite</span>
                </div>

                {/* Dark Vector */}
                <div 
                  onClick={() => setMapLayer('dark')} 
                  className="group cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <div className={`aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 relative transition-all ${mapLayer === 'dark' ? 'border-[#8140F3] shadow-md shadow-[#8140F3]/10' : 'border-transparent opacity-80'}`}>
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3eNFDomYJnwb33h4GRgTAScvtBG2_u4UcWJ-QTdwLrzEL5x2IeogDNrt2HdpdCiiwOn-u_w0baruIdnIHRv5pL_kqRchRmOIA4MIEEx9lDD7wnfzIsEk1Aovh3AzHwkozmIkY6oFK7rMnOHV4pn_bGMHp1MUY0HDsoL70s8YRGiqT_UNqwymAaehrgsyn0kVYlcw6xlpfi1PVBtEEaszkrNZJ-ZwfFXy3uKOPjOt_39p5fzkgEe1B1F8hGdGLdlXCIcD5mXUjubc" 
                      className="w-full h-full object-cover"
                      alt="Dark Vector"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {mapLayer === 'dark' && (
                      <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-sm text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] ${mapLayer === 'dark' ? 'font-bold text-[#8140F3]' : 'font-semibold text-gray-500'}`}>Dark Vector</span>
                </div>
              </div>

              {/* Confirm */}
              <button 
                onClick={() => setShowLayerSheet(false)}
                className="w-full mt-6 py-4 bg-[#8140F3] text-white rounded-2xl font-bold tracking-widest text-[13px] shadow-lg shadow-[#8140F3]/25 active:scale-95 transition-all"
              >
                CONFIRM SELECTION
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
