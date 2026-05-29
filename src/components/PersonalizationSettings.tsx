/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Check, Sliders, Type, Grid, Activity, Palette, ShieldCheck, LogOut, Sun, Moon } from 'lucide-react';
import { playTick, playSnap } from '../utils/audio';

interface PersonalizationSettingsProps {
  accentColor: string;
  setAccentColor: (color: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  animationIntensity: 'gentle' | 'normal' | 'none';
  setAnimationIntensity: (intensity: 'gentle' | 'normal' | 'none') => void;
  calendarDensity: 'cozy' | 'compact' | 'roomy';
  setCalendarDensity: (density: 'cozy' | 'compact' | 'roomy') => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  userEmail: string | null;
  onLogout: () => void;
}

const ACCENT_OPTIONS = [
  { id: 'blue', name: 'Cobalt Blue', hex: '#007aff' },
  { id: 'purple', name: 'Modern Lavender', hex: '#bf5af2' },
  { id: 'red', name: 'Elegant Crimson', hex: '#ff453a' },
  { id: 'green', name: 'Soft Emerald', hex: '#30d158' },
  { id: 'orange', name: 'Warm Orange', hex: '#ff9f0a' },
  { id: 'yellow', name: 'Amber Gold', hex: '#ffcc00' },
  { id: 'teal', name: 'Soft Teal', hex: '#64d2ff' },
  { id: 'pink', name: 'Premium Pink', hex: '#ff375f' },
];

export default function PersonalizationSettings({
  accentColor,
  setAccentColor,
  theme,
  setTheme,
  animationIntensity,
  setAnimationIntensity,
  calendarDensity,
  setCalendarDensity,
  fontSize,
  setFontSize,
  userEmail,
  onLogout,
}: PersonalizationSettingsProps) {

  const handleSelectAccent = (colorId: string) => {
    playSnap();
    setAccentColor(colorId);
  };

  const handleSelectTheme = (themeId: 'dark' | 'light') => {
    playSnap();
    setTheme(themeId);
  };

  const handleSelectAnimation = (intensity: 'gentle' | 'normal' | 'none') => {
    playTick();
    setAnimationIntensity(intensity);
    localStorage.setItem('riseAnimationIntensity', intensity);
  };

  const handleSelectDensity = (density: 'cozy' | 'compact' | 'roomy') => {
    playTick();
    setCalendarDensity(density);
    localStorage.setItem('riseCalendarDensity', density);
  };

  const handleSelectFontSize = (size: 'small' | 'medium' | 'large') => {
    playTick();
    setFontSize(size);
  };

  return (
    <div className="space-y-6 animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin font-sans max-w-2xl mx-auto">
      
      {/* Title */}
      <div className="px-1 py-1 space-y-1">
        <h2 className="text-xl font-extrabold font-display text-text-primary tracking-tight">Personalization Settings</h2>
        <p className="text-xs text-text-secondary">Sculpt your optimal premium distraction-free productivity environment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card A: Dynamic Accent Colors */}
        <div className="bg-glass-bg border border-glass-border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Accent Theme</span>
          </div>

          <div className="grid grid-cols-4 gap-3.5">
            {ACCENT_OPTIONS.map((item) => {
              const isSelected = accentColor === item.id;
              return (
                <div key={item.id} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleSelectAccent(item.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer relative hover:scale-105 active:scale-95 transition-transform"
                    style={{ backgroundColor: item.hex }}
                    title={item.name}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-accent-tick"
                        className="absolute inset-0 flex items-center justify-center text-white"
                      >
                        <Check className="w-4.5 h-4.5 stroke-[3.5]" />
                      </motion.div>
                    )}
                  </button>
                  <span className="text-[9px] font-mono font-bold text-text-tertiary mt-1 text-center scale-90">{item.id}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card B: Theme Toggling */}
        <div className="bg-glass-bg border border-glass-border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Theme Mode</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSelectTheme('light')}
              className={`p-3.5 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                theme === 'light' 
                  ? 'bg-text-primary border-glass-border text-brand-bg shadow-md' 
                  : 'bg-glass-pill hover:bg-glass-pill-hover border-transparent hover:border-glass-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Canvas</span>
            </button>
            <button
              onClick={() => handleSelectTheme('dark')}
              className={`p-3.5 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                theme === 'dark' 
                  ? 'bg-text-primary border-glass-border text-brand-bg shadow-md' 
                  : 'bg-glass-pill hover:bg-glass-pill-hover border-transparent hover:border-glass-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Matte</span>
            </button>
          </div>
        </div>

        {/* Card C: Display Text Scaling */}
        <div className="bg-glass-bg border border-glass-border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Font Size Scale</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['small', 'medium', 'large'] as const).map((size) => {
              const isSelected = fontSize === size;
              return (
                <button
                  key={size}
                  onClick={() => handleSelectFontSize(size)}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase font-mono cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-text-primary border-glass-border text-brand-bg shadow-sm'
                      : 'bg-glass-pill hover:bg-glass-pill-hover border-transparent text-text-secondary'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card D: Layout density config */}
        <div className="bg-glass-bg border border-glass-border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Calendar Layout</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['cozy', 'compact', 'roomy'] as const).map((density) => {
              const isSelected = calendarDensity === density;
              return (
                <button
                  key={density}
                  onClick={() => handleSelectDensity(density)}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase font-mono cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-text-primary border-glass-border text-brand-bg shadow-sm'
                      : 'bg-glass-pill hover:bg-glass-pill-hover border-transparent text-text-secondary'
                  }`}
                >
                  {density}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card E: Animation Springs Tuning */}
        <div className="bg-glass-bg border border-glass-border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Spring Motions</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['gentle', 'normal', 'none'] as const).map((intensity) => {
              const isSelected = animationIntensity === intensity;
              return (
                <button
                  key={intensity}
                  onClick={() => handleSelectAnimation(intensity)}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase font-mono cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-text-primary border-glass-border text-brand-bg shadow-sm'
                      : 'bg-glass-pill hover:bg-glass-pill-hover border-transparent text-text-secondary'
                  }`}
                >
                  {intensity}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card F: Secrets Cryptography Sync Info */}
        <div className="bg-glass-bg border border-glass-border rounded-[28px] p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Authentication Sync</span>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-text-primary">
                {userEmail ? 'Verified Cloud Sync Session' : 'Offline Standalone Mode'}
              </p>
              <p className="text-[10px] font-medium text-text-tertiary leading-relaxed pr-1">
                {userEmail 
                  ? `Logged in as ${userEmail}. Your pages, calendars, and routines are synced securely via Firestore.`
                  : 'Not logged in. Your data operations are compiled locally inside your client storage block.'}
              </p>
            </div>
          </div>

          {userEmail && (
            <button
              onClick={() => { playSnap(); onLogout(); }}
              className="w-full mt-3 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 border border-red-500/10 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out of session</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
