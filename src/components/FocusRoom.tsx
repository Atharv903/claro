/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Wind, Compass, Sparkles, Minus, Plus, Music2, VolumeX } from 'lucide-react';
import { playTick, playSuccessChime, playSnap, startAmbientSound, stopAmbientBreathPad, AmbientSound } from '../utils/audio';

const CALM_QUOTES = [
  "Your concentration is sacred. Protect it with deep presence.",
  "Quiet the noise. The most elegant ideas arrive in silence.",
  "Simplicity is the art of clean, focused attention.",
  "Continuous flow is the ultimate human craftsmanship.",
  "Protect your rhythm. Stillness is a force, not stagnant air.",
  "Craft your workspace in absolute clarity. Deep work follows."
];

export default function FocusRoom() {
  const [mode, setMode] = useState<'timer' | 'breathe'>('timer');
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('breath');

  // Breathe status: 0=Breathe In, 1=Hold, 2=Breathe Out, 3=Rest
  const [breathePhase, setBreathePhase] = useState<'in' | 'hold' | 'out' | 'hold-empty'>('in');
  const [breatheCount, setBreatheCount] = useState(4);

  // Quote rotation carousel
  useEffect(() => {
    const qInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % CALM_QUOTES.length);
    }, 12000);
    return () => clearInterval(qInterval);
  }, []);

  // Pomodoro Countdown Timer Logic
  useEffect(() => {
    let timer: any = null;
    if (isRunning && mode === 'timer') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playSuccessChime();
            return sessionMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, mode, sessionMinutes]);

  // Breathing Loop cycles (Box Breathing: 4s In, 4s Hold, 4s Out, 4s Hold)
  useEffect(() => {
    let bTimer: any = null;
    if (mode === 'breathe') {
      bTimer = setInterval(() => {
        setBreatheCount(prev => {
          if (prev <= 1) {
            // Cycle phases
            setBreathePhase(current => {
              playTick();
              if (current === 'in') return 'hold';
              if (current === 'hold') return 'out';
              if (current === 'out') return 'hold-empty';
              return 'in';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(bTimer);
  }, [mode, breathePhase]);

  useEffect(() => {
    if (mode === 'breathe' && ambientEnabled) {
      startAmbientSound(ambientSound);
    } else {
      stopAmbientBreathPad();
    }

    return () => stopAmbientBreathPad();
  }, [mode, ambientEnabled, ambientSound]);

  const toggleTimer = () => {
    playSnap();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    playTick();
    setIsRunning(false);
    setTimeLeft(sessionMinutes * 60);
  };

  const updateSessionMinutes = (nextMinutes: number) => {
    const normalized = Math.min(120, Math.max(1, nextMinutes));
    playTick();
    setSessionMinutes(normalized);
    setIsRunning(false);
    setTimeLeft(normalized * 60);
  };

  const formatTimerStr = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const activeQuote = CALM_QUOTES[quoteIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-6 font-sans select-none text-center gap-10">
      
      {/* Quote Banner Board */}
      <div className="h-14 max-w-lg flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="flex items-center gap-2.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-accent/50 shrink-0" />
            <p className="text-xs text-text-secondary italic font-semibold leading-relaxed">
              "{activeQuote}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab Selectors (Timer vs conscious breathing) */}
      <div className="flex p-1 bg-glass-pill border border-glass-border/70 rounded-2xl shadow-sm">
        <button
          onClick={() => { playTick(); setMode('timer'); }}
          className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            mode === 'timer' 
              ? 'bg-text-primary text-brand-bg shadow-md' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Flow Timer</span>
        </button>
        <button
          onClick={() => { playTick(); setMode('breathe'); setIsRunning(false); }}
          className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            mode === 'breathe' 
              ? 'bg-text-primary text-brand-bg shadow-md' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>Breath Control</span>
        </button>
      </div>

      {/* Control Display Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {mode === 'timer' ? (
          /* TIMER SCREEN */
          <div className="space-y-8 flex flex-col items-center">
            {/* Countdown layout */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 scale-95">
                <circle cx="128" cy="128" r="110" stroke="var(--color-glass-pill-hover)" strokeWidth="5" fill="transparent" />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="var(--accent-color)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray="691"
                  animate={{ strokeDashoffset: 691 - (691 * timeLeft) / (sessionMinutes * 60) }}
                  transition={{ ease: 'linear' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center gap-1.5 pt-2">
                <span className="text-5xl font-black font-mono tracking-tighter text-text-primary select-all">
                  {formatTimerStr(timeLeft)}
                </span>
                <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-text-tertiary">
                  {isRunning ? 'Flow state active' : 'Session standing'}
                </span>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => updateSessionMinutes(sessionMinutes - 5)}
                  className="w-9 h-9 rounded-xl bg-glass-pill hover:bg-glass-pill-hover border border-glass-border flex items-center justify-center text-text-secondary hover:text-text-primary"
                  title="Shorten timer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <label className="flex-1 bg-glass-bg border border-glass-border rounded-2xl px-3 py-2">
                  <span className="block text-[8px] font-bold font-mono uppercase tracking-widest text-text-tertiary mb-1">
                    Session Length
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={sessionMinutes}
                    onChange={(event) => updateSessionMinutes(Number(event.target.value) || 1)}
                    className="w-full bg-transparent text-center text-sm font-black font-mono text-text-primary outline-none"
                  />
                </label>
                <button
                  onClick={() => updateSessionMinutes(sessionMinutes + 5)}
                  className="w-9 h-9 rounded-xl bg-glass-pill hover:bg-glass-pill-hover border border-glass-border flex items-center justify-center text-text-secondary hover:text-text-primary"
                  title="Extend timer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 25, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => updateSessionMinutes(minutes)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold font-mono border transition-colors ${
                      sessionMinutes === minutes
                        ? 'bg-text-primary text-brand-bg border-transparent'
                        : 'bg-glass-pill text-text-tertiary border-glass-border hover:text-text-primary'
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>

            {/* Micro Buttons */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTimer}
                className={`w-14 h-14 rounded-full border border-glass-border/60 flex items-center justify-center cursor-pointer shadow-md transition-all ${
                  isRunning 
                    ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/15 text-amber-553' 
                    : 'bg-brand-accent hover:bg-brand-accent-hover text-white shadow-brand-accent-glow'
                }`}
              >
                {isRunning ? <Pause className="w-6 h-6 stroke-[2.5]" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetTimer}
                className="w-14 h-14 rounded-full bg-glass-pill hover:bg-glass-pill-hover hover:border-text-quaternary flex items-center justify-center cursor-pointer border border-glass-border/40 text-text-secondary"
                title="Reset session timer"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              </motion.button>
            </div>
          </div>
        ) : (
          /* CONSCIOUS BREATHING BOX SCREEN */
          <div className="space-y-10 flex flex-col items-center">
            
            {/* Tactile concentric ring breathing expansion container */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Box Breathing Guides border */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-text-quaternary/40" />

              {/* Pulsing Concentric Visualizer circles */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={breathePhase}
                  initial={{ scale: 0.85, opacity: 0.3 }}
                  animate={{
                    scale: breathePhase === 'in' 
                      ? 1.45 
                      : breathePhase === 'out' 
                        ? 0.75 
                        : breathePhase === 'hold' 
                          ? 1.45 
                          : 0.75, // hold empty
                    opacity: breathePhase === 'hold' || breathePhase === 'in' ? 0.9 : 0.45
                  }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                  className="absolute w-44 h-44 rounded-full bg-brand-accent-glow" style={{ mixBlendMode: 'multiply' }}
                />
              </AnimatePresence>

              {/* Inner Circle displaying Instructions */}
              <div className="absolute w-36 h-36 rounded-full bg-glass-bg border border-glass-border/60 shadow flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={breathePhase}
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <span className="text-xl font-bold font-display tracking-tight text-brand-accent capitalize">
                      {breathePhase === 'in' && 'Breathe In'}
                      {breathePhase === 'hold' && 'Hold'}
                      {breathePhase === 'out' && 'Breathe Out'}
                      {breathePhase === 'hold-empty' && 'Rest'}
                    </span>
                    <span className="text-2xl font-black font-mono mt-1 text-text-primary">
                      {breatheCount}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="text-center max-w-sm space-y-1 select-none">
              <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-text-tertiary">
                Harmonic Box Breathing Mode
              </p>
              <p className="text-xs text-text-secondary leading-relaxed px-4">
                4-second loops for somatic calm. Align your breath to the dynamic concentric ring contraction.
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    const next = !ambientEnabled;
                    setAmbientEnabled(next);
                    playTick();
                  }}
                  className={`mx-auto px-4 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    ambientEnabled
                      ? 'bg-brand-accent text-white border-transparent shadow-lg shadow-brand-accent-glow'
                      : 'bg-glass-pill hover:bg-glass-pill-hover border-glass-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {ambientEnabled ? <Music2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{ambientEnabled ? 'Ambient On' : 'Ambient Off'}</span>
                </button>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {([
                    { id: 'breath', label: 'Breath' },
                    { id: 'rain', label: 'Rain' },
                    { id: 'forest', label: 'Forest' },
                    { id: 'white-noise', label: 'White' },
                    { id: 'brown-noise', label: 'Brown' },
                  ] as const).map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => {
                        stopAmbientBreathPad();
                        setAmbientSound(sound.id);
                        if (!ambientEnabled) setAmbientEnabled(true);
                        playSnap();
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        ambientSound === sound.id && ambientEnabled
                          ? 'bg-text-primary text-brand-bg border-transparent'
                          : 'bg-glass-pill text-text-tertiary border-glass-border hover:text-text-primary'
                      }`}
                    >
                      {sound.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
