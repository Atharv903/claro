/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Bell, Sparkles } from 'lucide-react';
import { Habit } from '../types';
import { playTick, playSuccessChime } from '../utils/audio';
import { useRippleOrigin } from '../utils/ripple';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'completedDays' | 'createdAt'>) => void;
}

const CONSTANT_EMOJIS = ['🧘‍♀️', '💧', '🏃‍♂️', '📚', '🌙', '💪', '🍎', '🦷', '🧠', '✍️', '🥦', '🚶‍♂️', '⌨️', '🎨', '🎯', '🥑', '🧗', '🔋', '🗣️', '🎻'];

const COLOR_TILES = [
  { hex: '#af52de', name: 'Purple' },
  { hex: '#007aff', name: 'Blue' },
  { hex: '#ff2d55', name: 'Pink' },
  { hex: '#ff9500', name: 'Orange' },
  { hex: '#34c759', name: 'Green' }
];

const CATEGORIES = ['Mind', 'Health', 'Fitness', 'Productivity', 'Creative', 'Diet'];

export default function AddHabitModal({ isOpen, onClose, onSave }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🧘‍♀️');
  const [color, setColor] = useState('#af52de');
  const [category, setCategory] = useState('Mind');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [reminder, setReminder] = useState('08:00');
  const [enableReminder, setEnableReminder] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const origin = useRippleOrigin(containerRef);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    playSuccessChime();
    onSave({
      name: name.trim(),
      description: description.trim() || 'No description provided.',
      emoji,
      color,
      category,
      frequency,
      reminderTime: enableReminder ? reminder : undefined
    });

    // Reset fields
    setName('');
    setDescription('');
    setEmoji('🧘‍♀️');
    setColor('#af52de');
    setCategory('Mind');
    setFrequency('daily');
    setEnableReminder(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0" onClick={() => { playTick(); onClose(); }} />

          {/* Modal Container */}
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.15, opacity: 0 }}
            style={{ transformOrigin: origin }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="relative w-full max-w-lg bg-glass-bg border border-glass-border rounded-[32px] shadow-2xl z-10 p-6 md:p-8 max-h-[92vh] overflow-y-auto scrollbar-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-glass-pill border border-glass-border flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-text-secondary" />
                </div>
                <h2 className="text-xl font-bold font-display tracking-tight text-text-primary">Create New Habit</h2>
              </div>
              <button
                onClick={() => { playTick(); onClose(); }}
                className="w-8 h-8 rounded-full bg-glass-pill hover:bg-glass-pill-hover border border-glass-border transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Input: Habit Name & Emoji Indicator */}
              <div className="flex gap-4">
                {/* Large Circle for Emoji Selection Indicator */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-normal shadow-lg transition-all duration-500 flex-shrink-0"
                  style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}` }}
                >
                  <motion.span 
                    key={emoji}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    {emoji}
                  </motion.span>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Habit Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Morning Run, Hydration"
                    className="w-full bg-glass-pill border border-glass-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:border-text-secondary focus:bg-glass-pill-hover transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Input: Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Description / Daily Goal</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Complete 30 minutes before 8:00 AM"
                  className="w-full bg-glass-pill border border-glass-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:border-text-secondary focus:bg-glass-pill-hover transition-all"
                />
              </div>

              {/* Grid: Category & Frequency */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Focus Category</label>
                  <select
                    value={category}
                    onChange={(e) => { playTick(); setCategory(e.target.value); }}
                    className="w-full bg-glass-pill border border-glass-border rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-text-secondary transition-all text-left cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="text-black bg-white dark:text-white dark:bg-[#1a1a1c]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Frequency</label>
                  <div className="grid grid-cols-2 bg-glass-pill border border-glass-border p-1 rounded-xl">
                    {(['daily', 'weekly'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => { playTick(); setFrequency(mode); }}
                        className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                          frequency === mode
                            ? 'bg-glass-pill-hover text-text-primary shadow font-bold border border-glass-border'
                            : 'text-text-tertiary hover:text-text-secondary'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emoji Palettes List Selectors */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Select Emoji</label>
                <div className="flex gap-2 p-2 bg-glass-pill border border-glass-border rounded-xl overflow-x-auto">
                  {CONSTANT_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { playTick(); setEmoji(e); }}
                      className={`text-xl p-1.5 rounded-lg border-2 transition-all flex-shrink-0 cursor-pointer ${
                        emoji === e
                          ? 'bg-glass-pill-hover border-text-secondary scale-110'
                          : 'border-transparent hover:bg-glass-pill'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors Palette Selectors */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest font-mono">Select Accent Color</label>
                <div className="flex gap-4">
                  {COLOR_TILES.map((col) => {
                    const isSelected = color === col.hex;
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => { playTick(); setColor(col.hex); }}
                        className="group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-glass-border cursor-pointer"
                        style={{
                          backgroundColor: col.hex,
                          boxShadow: isSelected ? `0 0 12px ${col.hex}60` : '',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                        }}
                      >
                        {isSelected && (
                          <motion.div 
                            layoutId="color-check-modal"
                            className="bg-white rounded-full p-0.5 text-black flex items-center justify-center shadow"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reminder Section */}
              <div className="pt-3 border-t border-glass-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-text-secondary" />
                    <div>
                      <h4 className="text-sm font-medium text-text-primary">Daily Haptic Reminder</h4>
                      <p className="text-xs text-text-tertiary">Synthesize visual spotlight overlays</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { playTick(); setEnableReminder(!enableReminder); }}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 outline-none cursor-pointer ${
                      enableReminder ? 'bg-apple-green' : 'bg-glass-pill border border-glass-border'
                    }`}
                  >
                    <span 
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                        enableReminder ? 'transform translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {enableReminder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-end gap-2"
                  >
                    <input
                      type="time"
                      value={reminder}
                      onChange={(e) => setReminder(e.target.value)}
                      className="bg-glass-pill border border-glass-border rounded-lg px-3 py-1.5 text-text-primary focus:outline-none focus:border-text-secondary"
                    />
                  </motion.div>
                )}
              </div>

              {/* Footer Save Action */}
              <div className="flex gap-4 pt-4 border-t border-glass-border">
                <button
                  type="button"
                  onClick={() => { playTick(); onClose(); }}
                  className="flex-1 py-3 bg-glass-pill hover:bg-glass-pill-hover text-text-secondary hover:text-text-primary border border-glass-border font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 py-3 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: name.trim() ? color : 'var(--color-glass-pill)',
                    color: name.trim() ? '#ffffff' : 'var(--color-text-tertiary)'
                  }}
                >
                  Create Habit
                </motion.button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
