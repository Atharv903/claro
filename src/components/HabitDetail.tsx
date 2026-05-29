/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Calendar, Sparkles, Trash2, Check, CloudLightning, Activity, Clock, CircleDot } from 'lucide-react';
import { Habit } from '../types';
import { playTick, playSuccessChime, playSnap } from '../utils/audio';
import PhotoVerifierModal from './PhotoVerifierModal';
import { 
  formatLocalDate, 
  generateCalendarCells, 
  getDisplayDate,
  calculateCurrentStreak,
  calculateBestStreak
} from '../utils/date';
import { getCoachingMessage, getRandomQuote, Quote } from '../utils/quotes';

interface HabitDetailProps {
  habit: Habit;
  onToggleDate: (habitId: string, dateStr: string) => void;
  onDeleteHabit: (id: string) => void;
  onVerifyPhoto: (habitId: string, dateStr: string, photo: string, comment: string) => void;
}

export default function HabitDetail({ habit, onToggleDate, onDeleteHabit, onVerifyPhoto }: HabitDetailProps) {
  const [quote, setQuote] = useState<Quote>({ text: '', author: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // States for AI Photographic Verification
  const [activeVerificationDate, setActiveVerificationDate] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; confidence: number; comment: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = formatLocalDate(new Date());

  // Load a random quote on mounting or habit changing, and reset AI inputs
  useEffect(() => {
    setQuote(getRandomQuote());
    setShowDeleteConfirm(false);
    setImagePreview(null);
    setVerificationLoading(false);
    setVerificationResult(null);
    setErrorMessage(null);
    setActiveVerificationDate(null);
  }, [habit.id]);

  // Streak computations
  const currentStreak = calculateCurrentStreak(habit.completedDays);
  const borderStreak = calculateBestStreak(habit.completedDays);

  // Generate 28-day calendar cells
  const calendarCells = generateCalendarCells(28);

  // Percentage of completion over last 28 days
  const completedCount28 = calendarCells.filter(cell => habit.completedDays.includes(cell.dateString)).length;
  const progressPercent28 = Math.round((completedCount28 / 28) * 100);

  // Generate sparkline values: last 7 days completion rate
  const sparklineDays = Array.from({ length: 7 }, (_, idx) => 6 - idx); // [6, 5, 4, 3, 2, 1, 0] days ago
  const sparklineData = sparklineDays.map(daysAgo => {
    const dStr = formatLocalDate(new Date(Date.now() - daysAgo * 24 * 3600 * 1000));
    return habit.completedDays.includes(dStr) ? 1 : 0;
  });

  // Calculate coordinates for SVG sparkline (width = 160, height = 40)
  const sparklineCoords = sparklineData.map((val, idx) => {
    const x = Math.round((idx / 6) * 160);
    const y = val === 1 ? 8 : 34;
    return `${x},${y}`;
  });
  const sparklinePath = `M ${sparklineCoords.join(' L ')}`;

  // Interactive 7-day checklist (visual representation of current week)
  const currentWeekDays = generateCalendarCells(7);

  const handleCellClick = (dateStr: string) => {
    const alreadyCompleted = habit.completedDays.includes(dateStr);
    
    if (!alreadyCompleted) {
      // Open the photo verifier window/modal instead of instant toggle
      setActiveVerificationDate(dateStr);
    } else {
      playSnap();
      onToggleDate(habit.id, dateStr);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Photo size is too large (max 10MB)");
      return;
    }

    setErrorMessage(null);
    setVerificationResult(null);
    playTick();

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const verifyProofWithAI = async () => {
    if (!imagePreview) return;

    setVerificationLoading(true);
    setErrorMessage(null);
    setVerificationResult(null);
    playTick();

    try {
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          habitName: habit.name,
          habitDescription: habit.description,
          imageBase64: imagePreview
        })
      });

      if (!response.ok) {
        throw new Error(`AI checking server returned status ${response.status}`);
      }

      const result = await response.json();
      setVerificationResult(result);

      if (result.verified === true) {
        // Record completed date and photo proof details
        onVerifyPhoto(habit.id, todayStr, imagePreview, result.comment);
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 1500);
      } else {
        playSnap();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Verification failed. Please check your network and try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const executeDelete = () => {
    playSnap();
    onDeleteHabit(habit.id);
  };

  // Inspect if today is verified via photo
  const todayVerification = habit.verifiedPhotos?.[todayStr];
  const isTodayVerified = !!todayVerification;

  return (
    <motion.div
      key={habit.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1 pb-10 scrollbar-thin scroll-smooth"
    >
      {/* 1. Header Card: Sleek Glass Surface with Accent Color Ambient Underglow */}
      <div className="relative group overflow-hidden bg-glass-bg border border-glass-border rounded-[32px] p-4 sm:p-6 md:p-8 backdrop-blur-2xl shadow-xl">
        <div 
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] opacity-25 group-hover:scale-125 transition-all duration-700 pointer-events-none -z-10"
          style={{ backgroundColor: habit.color }}
        />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-4xl shadow-inner select-none cursor-default"
                style={{ backgroundColor: `${habit.color}15` }}
              >
                <span>{habit.emoji}</span>
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono text-text-secondary bg-glass-pill border border-glass-border">
                    {habit.category}
                  </span>
                  {habit.reminderTime && (
                    <span className="flex items-center gap-1 text-[10px] text-text-tertiary font-mono">
                      <Clock className="w-3 h-3" />
                      {habit.reminderTime}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary font-display mt-0.5">
                  {habit.name}
                </h2>
              </div>
            </div>
            <p className="text-sm text-text-secondary max-w-xl pr-5 leading-relaxed">
              {habit.description}
            </p>
          </div>

          {/* Quick Info Badges */}
          <div className="flex gap-3.5 self-stretch md:self-auto">
            {/* Streak card */}
            <div className="flex-1 md:flex-none flex items-center gap-3 bg-glass-pill border border-glass-border shadow-inner px-4 p-3.5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5.5 h-5.5 text-orange-400 fill-orange-400/10 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Streak</p>
                <p className="text-xl font-bold text-text-primary font-mono leading-tight">{currentStreak} <span className="text-xs text-text-tertiary font-medium">days</span></p>
              </div>
            </div>

            {/* Best historical streak card */}
            <div className="flex-1 md:flex-none flex items-center gap-3 bg-glass-pill border border-glass-border shadow-inner px-4 p-3.5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <CloudLightning className="w-5.5 h-5.5 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Best Peak</p>
                <p className="text-xl font-bold text-text-primary font-mono leading-tight">{borderStreak} <span className="text-xs text-text-tertiary font-medium">days</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Celebration Overlays on ring closure */}
        <AnimatePresence>
          {confettiActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/[0.01] pointer-events-none flex items-center justify-center overflow-hidden"
            >
              <div className="relative w-full h-full">
                {Array.from({ length: 15 }).map((_, i) => {
                  const xStart = Math.random() * 100;
                  const duration = 0.8 + Math.random() * 0.6;
                  const scale = 0.4 + Math.random() * 0.6;
                  return (
                    <motion.div
                      key={i}
                      initial={{ y: "110%", x: `${xStart}%`, opacity: 1, scale }}
                      animate={{ y: "-10%", opacity: 0, rotate: 360 }}
                      transition={{ duration, ease: "easeOut" }}
                      className="absolute w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side Col (8 spans): Calendar Tracker & Heatmap */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Box A: Interactive Weekly Checklist */}
          <div className="bg-glass-bg border border-glass-border rounded-[32px] p-4 sm:p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4.5 h-4.5 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary tracking-wide font-display">Target Week Timeline</h3>
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-text-tertiary font-mono">TAP BUBBLE TO CHECK</p>
            </div>

            {/* Checklist Loop */}
            <div className="grid grid-cols-7 gap-1 sm:gap-3">
              {currentWeekDays.map((cell) => {
                const isCompleted = habit.completedDays.includes(cell.dateString);
                return (
                  <button
                    key={cell.dateString}
                    onClick={() => handleCellClick(cell.dateString)}
                    type="button"
                    className="relative group flex flex-col items-center gap-1.5 sm:gap-2.5 p-1 px-1.5 sm:p-3 rounded-2xl bg-glass-pill hover:bg-glass-pill-hover border border-glass-border transition-all cursor-pointer outline-none"
                  >
                    {/* Weekday Label */}
                    <span className="text-[9px] sm:text-[10px] font-bold text-text-tertiary font-mono">{cell.dayName}</span>
                    
                    {/* Large circle tick frame */}
                    <div 
                      className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                        isCompleted 
                          ? 'scale-105 border-transparent shadow-lg text-white' 
                          : 'border-glass-border hover:border-text-quaternary'
                      }`}
                      style={{ 
                        backgroundColor: isCompleted ? habit.color : 'transparent',
                        boxShadow: isCompleted ? `0 4px 12px ${habit.color}35` : ''
                      }}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0.5, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                          <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[3] text-white" />
                        </motion.div>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-semibold text-text-tertiary group-hover:text-text-secondary font-mono">{cell.dayNumber}</span>
                      )}
                    </div>

                    {/* Simple underglow element */}
                    {cell.isToday && (
                      <span className="absolute bottom-1 w-1 px-0.5 rounded-full bg-text-primary shadow animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Box B: Full 28-day Activity grid */}
          <div className="bg-glass-bg border border-glass-border rounded-[32px] p-4 sm:p-6 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary tracking-wide font-display">Activity Heatmap (Past 28 Days)</h3>
              </div>
              <span className="text-[10px] text-text-tertiary font-mono tracking-wider animate-pulse">
                Total completed: {completedCount28} / 28 days
              </span>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {calendarCells.map((cell) => {
                const isCompleted = habit.completedDays.includes(cell.dateString);
                return (
                  <button
                    key={cell.dateString}
                    onClick={() => handleCellClick(cell.dateString)}
                    type="button"
                    className="relative aspect-square rounded-lg sm:rounded-xl flex items-center justify-center border transition-all duration-300 outline-none cursor-pointer"
                    style={{
                      backgroundColor: isCompleted ? habit.color : 'var(--color-glass-pill)',
                      borderColor: isCompleted ? 'transparent' : 'var(--color-glass-border)',
                      opacity: cell.isFuture ? 0.35 : 1
                    }}
                    title={`${getDisplayDate(cell.dateString)} | ${isCompleted ? 'Completed' : 'Pending'}`}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-white"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </motion.div>
                    ) : (
                      <span className="text-[10px] font-semibold text-text-quaternary font-mono">{cell.dayNumber}</span>
                    )}

                    {/* Highlight outline today */}
                    {cell.isToday && (
                      <span className="absolute -inset-0.5 border border-text-primary rounded-[14px]" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Color keys */}
            <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-glass-border text-[10px] font-mono text-text-tertiary">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-glass-pill border border-glass-border" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: habit.color }} />
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Col (4 spans): Circular Progress Rings, AI Verifier and Quotes */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card A: Premium Apple-style Progress Ring */}
          <div className="bg-glass-bg border border-glass-border rounded-[32px] p-6 shadow-md flex flex-col items-center justify-center text-center gap-5">
            <div className="w-full flex items-center justify-between text-left">
              <h3 className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Consolidated Rate</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-apple-green/10 text-apple-green dark:text-emerald-400 font-mono rounded-lg">REST 28D</span>
            </div>

            {/* Circular Ring Construction */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="var(--color-glass-pill-hover)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Primary Progress Ring */}
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={habit.color}
                  strokeWidth="10"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray="439.8"
                  initial={{ strokeDashoffset: 439.8 }}
                  animate={{ strokeDashoffset: 439.8 - (439.8 * Math.min(progressPercent28, 100)) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              {/* Inner details centered layout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center font-display">
                <span className="text-3xl font-extrabold text-text-primary font-mono leading-none">{progressPercent28}%</span>
                <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold mt-1 font-mono">Accuracy</span>
              </div>
            </div>

            {/* Smart dynamic coaching card description */}
            <p className="text-xs text-text-secondary leading-relaxed max-w-[200px]">
              {getCoachingMessage(progressPercent28)}
            </p>
          </div>

          {/* Card C: Sparkling Analytics Sparkline Chart */}
          <div className="bg-glass-bg border border-glass-border rounded-[32px] p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-text-tertiary" />
                <h3 className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Trajectory Sparkline</h3>
              </div>
              <span className="text-[9px] font-semibold text-emerald-400 font-mono">Past 7 Days</span>
            </div>

            {/* Custom SVG line painter */}
            <div className="h-10 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 160 40">
                <path
                  d={`${sparklinePath} L 160,35 L 0,35 Z`}
                  fill={habit.color}
                  fillOpacity="0.08"
                  className="transition-all duration-700"
                />

                {/* Main Curve Stroke */}
                <motion.path
                  d={sparklinePath}
                  fill="none"
                  stroke={habit.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="transition-all duration-700"
                />

                {/* Point Nodes */}
                {sparklineCoords.map((coord, i) => {
                  const [cx, cy] = coord.split(',').map(Number);
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r="2"
                      fill={habit.color}
                      className="transition-all duration-700"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Quick status indicators row */}
            <div className="grid grid-cols-7 text-[9px] font-semibold text-text-tertiary text-center font-mono select-none">
              <span>W6</span>
              <span>W5</span>
              <span>W4</span>
              <span>W3</span>
              <span>W2</span>
              <span>W1</span>
              <span>TOD</span>
            </div>
          </div>

          {/* Card D: Motivational Quote of the Day */}
          <div className="p-5 bg-glass-pill border border-glass-border rounded-3xl italic block tracking-wide select-none">
            <p className="text-xs text-text-tertiary leading-relaxed font-serif">
              "{quote.text}"
            </p>
            <p className="text-[9px] font-bold text-text-quaternary tracking-widest uppercase font-mono mt-2 text-right">
              — {quote.author}
            </p>
          </div>

          {/* Card E: Premium Actions Control (Delete with confirm layer) */}
          <div className="pt-3 border-t border-glass-border">
            <AnimatePresence mode="wait">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => { playTick(); setShowDeleteConfirm(true); }}
                  type="button"
                  className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-red-500/70 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-transparent transition-all outline-none cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Archive Routine</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/15 text-center space-y-3"
                >
                  <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest font-mono">Permanent Destructive Action</p>
                  <p className="text-xs text-text-secondary leading-relaxed">This completely wipes all historic logging data. Confirm archive?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { playTick(); setShowDeleteConfirm(false); }}
                      type="button"
                      className="flex-1 py-1.5 bg-glass-pill text-text-secondary hover:text-text-primary hover:bg-glass-pill-hover rounded-lg text-xs font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeDelete}
                      type="button"
                      className="flex-1 py-1.5 bg-red-600/90 text-white hover:bg-red-600 rounded-lg text-xs font-semibold shadow-md transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      <PhotoVerifierModal 
        isOpen={activeVerificationDate !== null}
        onClose={() => setActiveVerificationDate(null)}
        habit={habit}
        dateStr={activeVerificationDate || ''}
        onVerified={(hId, dStr, pData, cMsg) => {
          onVerifyPhoto(hId, dStr, pData, cMsg);
          setConfettiActive(true);
          setTimeout(() => setConfettiActive(false), 1200);
        }}
        onQuickLog={(hId, dStr) => {
          onToggleDate(hId, dStr);
          setConfettiActive(true);
          setTimeout(() => setConfettiActive(false), 1200);
        }}
      />

    </motion.div>
  );
}
