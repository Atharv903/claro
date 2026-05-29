/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Tag, Bell, Clock, Calendar, AlertTriangle, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Page, Task } from '../types';
import { playSnap, playTick } from '../utils/audio';
import { formatLocalDate } from '../utils/date';

interface AddTaskFormProps {
  pages: Page[];
  initialPageId: string | null;
  onAddTask: (taskData: Omit<Task, 'id' | 'done' | 'createdAt'>) => void;
}

export default function AddTaskForm({
  pages,
  initialPageId,
  onAddTask,
}: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPageId);
  const [dateVal, setDateVal] = useState(formatLocalDate(new Date())); // YYYY-MM-DD
  const [timeVal, setTimeVal] = useState(''); // HH:MM
  const [priority, setPriority] = useState<Task['priority']>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [reminder, setReminder] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync initial page selection when view updates
  React.useEffect(() => {
    setSelectedPageId(initialPageId);
  }, [initialPageId]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      playSnap();
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    playSnap();
    setTags(tags.filter((curr) => curr !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    playTick();
    
    // Construct standard Date string
    const d = new Date(dateVal + 'T12:00:00');
    const displayDateStr = d.toDateString();

    onAddTask({
      title: title.trim(),
      time: timeVal || null,
      date: displayDateStr,
      priority,
      tags,
      reminder,
      pageId: selectedPageId,
    });

    // Reset fields
    setTitle('');
    setTimeVal('');
    setPriority(null);
    setTags([]);
    setReminder(false);
    setIsExpanded(false);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-glass-bg border border-glass-border rounded-3xl p-4 shadow-md transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-accent opacity-60" />
      
      {/* Primary Row: Title Input and Expand/Submit trigger */}
      <div className="flex items-center gap-3.5">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!isExpanded) setIsExpanded(true);
          }}
          placeholder="New Task Idea... (e.g. Finish economics essay)"
          className="flex-1 bg-transparent border-none text-sm font-semibold text-text-primary placeholder-text-tertiary focus:outline-none"
        />

        {isExpanded ? (
          <button
            type="submit"
            disabled={!title.trim()}
            className="p-2 bg-text-primary text-brand-bg rounded-xl disabled:opacity-40 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { playTick(); setIsExpanded(true); }}
            className="p-2 text-text-tertiary hover:text-text-primary bg-glass-pill hover:bg-glass-pill-hover rounded-xl border border-glass-border transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded panel details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 14 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="space-y-4 border-t border-glass-border/30 pt-4 overflow-hidden"
          >
            {/* Row 1: Target Page Selection & Date Pick */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Target Page dropdown picker */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Target Notion Page</label>
                <select
                  value={selectedPageId || ''}
                  onChange={(e) => { playSnap(); setSelectedPageId(e.target.value || null); }}
                  className="w-full text-xs font-semibold bg-glass-pill hover:bg-glass-pill-hover text-text-secondary rounded-xl p-2 focus:outline-none border border-glass-border cursor-pointer appearance-none"
                >
                  <option value="">🏠 Daily Inbox (General)</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.icon || '📄'} {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="w-full text-xs font-semibold bg-glass-pill text-text-secondary rounded-xl p-2 focus:outline-none border border-glass-border cursor-pointer"
                  />
                </div>
              </div>

              {/* Time select picker */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Reminder Time (Optional)</label>
                <input
                  type="time"
                  value={timeVal}
                  onChange={(e) => setTimeVal(e.target.value)}
                  className="w-full text-xs font-semibold bg-glass-pill text-text-secondary rounded-xl p-2 focus:outline-none border border-glass-border cursor-pointer"
                />
              </div>

            </div>

            {/* Row 2: Priority selecting pills */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Priority Classification</label>
                <div className="flex items-center gap-1.5 p-0.5 bg-glass-pill border border-glass-border rounded-xl w-max">
                  {([
                    { id: 'high', label: 'High', color: 'text-red-500 bg-red-500/10' },
                    { id: 'medium', label: 'Medium', color: 'text-amber-500 bg-amber-500/10' },
                    { id: 'low', label: 'Low', color: 'text-emerald-500 bg-emerald-500/10' },
                    { id: null, label: 'None', color: 'text-text-tertiary' },
                  ] as const).map((pr) => {
                    const active = priority === pr.id;
                    return (
                      <button
                        key={pr.id ?? 'none'}
                        type="button"
                        onClick={() => { playSnap(); setPriority(pr.id); }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          active 
                            ? `${pr.color} shadow border border-glass-border/30` 
                            : 'text-text-tertiary hover:text-text-secondary'
                        }`}
                      >
                        {pr.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio toggle reminder */}
              <div className="space-y-1 sm:text-right">
                <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Sound Notification</label>
                <button
                  type="button"
                  onClick={() => { playSnap(); setReminder(!reminder); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    reminder 
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 shadow'
                      : 'bg-glass-pill border-glass-border text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{reminder ? 'Bell Engaged' : 'Muted'}</span>
                </button>
              </div>

            </div>

            {/* Row 3: Tags block with badge tags entries */}
            <div className="space-y-1.5 border-t border-glass-border/20 pt-3">
              <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Task Tags</label>
              
              <div className="flex flex-wrap items-center gap-1.5 max-w-full">
                {tags.map((t) => (
                  <span 
                    key={t}
                    onClick={() => handleRemoveTag(t)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-glass-pill border border-glass-border hover:border-red-500/30 hover:text-red-400 rounded-full cursor-pointer transition-colors"
                  >
                    <span>#{t}</span>
                    <span className="text-[8px] opacity-75">×</span>
                  </span>
                ))}
                
                <div className="relative inline-flex items-center bg-glass-pill border border-glass-border rounded-full px-2.5 py-0.5 max-w-40">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="+ add tag..."
                    className="bg-transparent border-none text-[10px] text-text-secondary focus:outline-none w-full placeholder-text-tertiary py-0.5 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Collapse triggering */}
            <div className="flex justify-end gap-2.5 border-t border-glass-border/15 pt-3.5">
              <button
                type="button"
                onClick={() => { playTick(); setIsExpanded(false); }}
                className="px-3.5 py-2 text-xs font-semibold text-text-tertiary hover:text-text-secondary bg-transparent hover:bg-glass-pill/20 rounded-xl transition-colors cursor-pointer"
              >
                Simple Mode
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-2 bg-text-primary text-brand-bg font-bold rounded-xl text-xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>Compile Task</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
