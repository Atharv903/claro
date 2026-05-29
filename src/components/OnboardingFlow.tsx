/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { playTick, playSuccessChime } from '../utils/audio';

interface OnboardingFlowProps {
  onClose: () => void;
}

export default function OnboardingFlow({ onClose }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Rise",
      subtitle: "Reimagine Your Daily Habits",
      icon: <Sparkles className="w-12 h-12 text-purple-400" />,
      description: "A premium, distraction-free environment crafted in harmony with your focus. Nourish, sustain, and master your core routines with pristine, elegant visuals.",
      accent: "#af52de",
      illustration: (
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Animated concentric circles */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/30"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-32 h-32 rounded-full border border-dashed border-cyan-500/40"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-brand-accent rounded-2xl flex items-center justify-center shadow-lg shadow-brand-accent-glow"
          >
            <Zap className="w-10 h-10 text-white fill-white/10" />
          </motion.div>
        </div>
      )
    },
    {
      title: "Tactile Landscapes",
      subtitle: "Sculpted for Sensory Clarity",
      icon: <CheckCircle2 className="w-12 h-12 text-blue-400" />,
      description: "Experience the pleasure of progress. Delight in high-fidelity synthesized chimes, fluid animations, and responsive micro-vibrations for every checked routine.",
      accent: "#007aff",
      illustration: (
        <div className="relative w-48 h-32 flex items-end justify-center gap-2">
          {/* Animated equalizer bars representing micro-tones */}
          {[1.2, 0.4, 1.8, 0.8, 1.5, 0.5, 1.3].map((heightScale, i) => (
            <motion.div
              key={i}
              animate={{ height: [`${20 * heightScale}px`, `${70 * heightScale}px`, `${20 * heightScale}px`] }}
              transition={{ duration: 1.5 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-3 rounded-full bg-brand-accent shadow-md shadow-brand-accent-glow"
            />
          ))}
        </div>
      )
    },
    {
      title: "Absolute Privacy",
      subtitle: "Secure Local Data Flow",
      icon: <ShieldCheck className="w-12 h-12 text-emerald-400" />,
      description: "Your focus is sacred. We maintain your habit sync and statistics entirely in your local hardware memory—no tracking, no forced profiling, 100% offline ownership.",
      accent: "#34c759",
      illustration: (
        <div className="relative w-44 h-44 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 bg-emerald-550 dark:bg-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10"
          >
            <ShieldCheck className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-36 h-36 rounded-[40px] border-2 border-emerald-500/20"
          />
        </div>
      )
    }
  ];

  const handleNext = () => {
    playTick();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      playSuccessChime();
      onClose();
    }
  };

  const handleBack = () => {
    playTick();
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative w-full max-w-2xl bg-glass-bg border border-glass-border rounded-[36px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto max-h-[92vh] md:h-[450px] overflow-y-auto md:overflow-hidden text-text-primary font-sans"
      >
        {/* Left Side: Illustrative Visual Stage */}
        <div className="w-full md:w-5/12 bg-glass-pill border-b md:border-b-0 md:border-r border-glass-border flex flex-col items-center justify-center p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="flex-1 flex items-center justify-center animate-once"
            >
              {current.illustration}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Setup Controls */}
        <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-between gap-6 md:h-full">
          <div className="space-y-4">
            {/* Top Indicator / Badges */}
            <div className="flex items-center gap-3">
              {current.icon}
              <div>
                <p className="text-xs font-semibold tracking-widest text-text-tertiary uppercase font-mono">ONBOARDING STAGE 0{currentSlide + 1}</p>
                <h3 className="text-2xl font-bold font-display tracking-tight text-text-primary">{current.title}</h3>
              </div>
            </div>

            {/* Narrative Body */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-2 min-h-[140px]"
              >
                <h4 className="text-lg font-semibold text-text-secondary">{current.subtitle}</h4>
                <p className="text-sm leading-relaxed text-text-tertiary">{current.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Setup Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-glass-border">
            {/* Dot indicators */}
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { playTick(); setCurrentSlide(i); }}
                  className="group relative h-2 transition-all p-1 cursor-pointer"
                >
                  <span 
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide 
                        ? 'w-6' 
                        : 'w-1.5 bg-glass-pill-hover hover:bg-text-quaternary'
                    }`}
                    style={{ backgroundColor: i === currentSlide ? current.accent : '' }}
                  />
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {currentSlide > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-all rounded-xl hover:bg-glass-pill cursor-pointer"
                >
                  Back
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-white/5 cursor-pointer"
                style={{ backgroundColor: current.accent, color: '#ffffff' }}
              >
                <span>{currentSlide === slides.length - 1 ? "Begin" : "Continue"}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
