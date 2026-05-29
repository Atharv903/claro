/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Check, Sparkles, Award, Zap, CheckCircle2 } from 'lucide-react';
import { Habit } from '../types';
import { playTick, playSnap } from '../utils/audio';

interface HabitsGridProps {
  habits: Habit[];
  onSelectHabit: (id: string) => void;
  onCellClick: (habitId: string, dateStr: string) => void;
}

export default function HabitsGrid({
  habits,
  onSelectHabit,
  onCellClick,
}: HabitsGridProps) {
  
  // Format dates for past 14 days
  const getPast14Days = () => {
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const past14Days = getPast14Days();
  const formatKey = (d: Date) => d.toISOString().split('T')[0];
  const formatLabelDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
  const formatLabelNum = (d: Date) => d.getDate();

  // Helper to calculate habit metrics
  const getMetrics = (h: Habit) => {
    const sortedDays = [...h.completedDays].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const formatStr = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = formatStr(new Date());
    const yesterdayStr = formatStr(new Date(Date.now() - 86400000));

    if (sortedDays.includes(todayStr) || sortedDays.includes(yesterdayStr)) {
      streak = 1;
      let check = new Date();
      check.setDate(check.getDate() - 1);
      while (sortedDays.includes(formatStr(check))) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }

    // Longest streak
    let longest = 0;
    let temp = 0;
    const allSorted = [...h.completedDays].sort((a,b) => a.localeCompare(b));
    if (allSorted.length > 0) {
      longest = 1;
      let lastDate = new Date(allSorted[0]);
      for (let i = 1; i < allSorted.length; i++) {
        const currDate = new Date(allSorted[i]);
        const diff = (currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        if (diff <= 1.1) {
          temp++;
          if (temp + 1 > longest) longest = temp + 1;
        } else {
          temp = 0;
        }
        lastDate = currDate;
      }
      if (streak > longest) longest = streak;
    }

    return {
      streak,
      longest,
      total: h.completedDays.length
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Top dashboard summary statistics for Habits board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{
          title: 'Total Habits',
          val: habits.length,
          desc: 'Routines configured',
          icon: <Zap className="w-4 h-4 text-purple-400" />
        }, {
          title: 'Average Streak',
          val: habits.length ? Math.round(habits.reduce((acc, h) => acc + getMetrics(h).streak, 0) / habits.length) : 0,
          desc: 'Consecutive active days',
          icon: <Flame className="w-4 h-4 text-orange-400" />
        }, {
          title: 'Best Personal Streak',
          val: habits.length ? Math.max(...habits.map(h => getMetrics(h).longest)) : 0,
          desc: 'Historically maintained',
          icon: <Award className="w-4 h-4 text-emerald-400" />
        }].map((s, i) => (
          <div key={i} className="p-4 bg-glass-bg border border-glass-border rounded-3xl shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-tertiary tracking-widest uppercase font-mono">{s.title}</span>
              <p className="text-2xl font-mono font-extrabold text-text-primary leading-none mt-1">{s.val}</p>
              <p className="text-[10px] text-text-tertiary">{s.desc}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-glass-pill/20 flex items-center justify-center border border-glass-border">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Habits Table */}
      <div className="bg-glass-bg border border-glass-border rounded-[32px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-glass-border pb-2 select-none">
                {/* Habit name header */}
                <th className="p-5 pb-3 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-text-tertiary min-w-[200px]">
                  ROUTINE DETAILS
                </th>
                
                {/* Streak count indicator column */}
                <th className="p-3 pb-3 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-text-tertiary w-24">
                  STREAK
                </th>

                {/* 14 Days checklist column headers */}
                {past14Days.map((dateObj, idx) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const keyStr = formatKey(dateObj);
                  const isToday = keyStr === todayStr;
                  return (
                    <th 
                      key={idx} 
                      className={`p-1.5 pb-3 text-center w-11 ${
                        isToday ? 'bg-text-primary/5 border-x border-glass-border/45' : ''
                      }`}
                    >
                      <span className="block text-[8px] font-mono font-bold tracking-tight text-text-tertiary uppercase">
                        {formatLabelDay(dateObj)}
                      </span>
                      <span className={`inline-flex items-center justify-center text-[10px] font-mono leading-none mt-1 font-bold ${
                        isToday ? 'w-5 h-5 bg-text-primary text-brand-bg rounded-full font-extrabold shadow' : 'text-text-secondary'
                      }`}>
                        {formatLabelNum(dateObj)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={14 + 2} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle2 className="w-10 h-10 text-text-tertiary" />
                      <div>
                        <p className="text-sm font-semibold text-text-secondary">No routines configured yet</p>
                        <p className="text-xs text-text-tertiary mt-1">Add a routine in the sidebar to get started!</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                habits.map((habit) => {
                  const met = getMetrics(habit);
                  
                  return (
                    <tr 
                      key={habit.id} 
                      className="border-b border-glass-border/30 last:border-b-0 hover:bg-glass-pill/5 transition-colors group/row"
                    >
                      {/* Name columns */}
                      <td className="p-4 px-5">
                        <div 
                          className="flex items-center gap-3 cursor-pointer select-none"
                          onClick={() => {
                            playTick();
                            onSelectHabit(habit.id);
                          }}
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
                            style={{ backgroundColor: `${habit.color}15` }}
                          >
                            <span>{habit.emoji}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate tracking-tight group-hover/row:text-text-primary">
                              {habit.name}
                            </h4>
                            <p className="text-[10px] text-text-tertiary font-mono tracking-wider mt-0.5 uppercase">
                              {habit.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Streak badge */}
                      <td className="text-center p-3 select-none">
                        {met.streak > 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold font-mono text-[10px]">
                            <Flame className="w-3 h-3 fill-orange-400/20" />
                            <span>{met.streak}d</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-quaternary font-mono">0d</span>
                        )}
                      </td>

                      {/* past 14 days logging dots */}
                      {past14Days.map((dateObj, dIdx) => {
                        const dateStr = formatKey(dateObj);
                        const isDone = habit.completedDays.includes(dateStr);
                        const isVerified = !!habit.verifiedPhotos?.[dateStr];
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = dateStr === todayStr;

                        return (
                          <td 
                            key={dIdx} 
                            className={`p-1.5 text-center ${
                              isToday ? 'bg-text-primary/5 border-x border-glass-border/45' : ''
                            }`}
                          >
                            <button
                              onClick={() => {
                                playTick();
                                onCellClick(habit.id, dateStr);
                              }}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center m-auto transition-all duration-300 relative cursor-pointer outline-none ${
                                isDone
                                  ? 'scale-105 shadow shadow-lg'
                                  : 'border-glass-border/65 hover:border-text-secondary hover:bg-glass-pill-hover'
                              }`}
                              style={{ 
                                backgroundColor: isDone ? habit.color : 'transparent',
                                borderColor: isDone ? 'transparent' : 'var(--color-glass-border)'
                              }}
                            >
                              {/* Display Tick inside completed bubble */}
                              {isDone && (
                                <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                              )}

                              {/* AI sparkles indicator overlay */}
                              {isDone && isVerified && (
                                <span className="absolute -top-1 -right-1 p-0.5 bg-indigo-500 text-white rounded-full text-[6px] shadow">
                                  <Sparkles className="w-1.5 h-1.5" />
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
