/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Tag, Bell, Trash2, Clock } from 'lucide-react';
import { Task } from '../types';
import { playSnap, playTick } from '../utils/audio';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditClick?: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onEditClick
}) => {
  
  // Format standard short strings for times
  const formatTime = (t: string | null) => {
    if (!t) return '';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr);
    const m = parseInt(mStr);
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayHour = h % 12 || 12;
    const displayMin = m.toString().padStart(2, '0');
    return `${displayHour}:${displayMin} ${ampm}`;
  };

  const priorityColors = {
    high: 'bg-red-500/10 text-red-500 border border-red-500/15',
    medium: 'bg-amber-500/10 text-amber-500 border border-amber-500/15',
    low: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className={`group flex items-start gap-3.5 p-4 bg-glass-bg border border-glass-border rounded-2xl shadow-sm hover:border-text-quaternary cursor-pointer transition-all ${
        task.done ? 'opacity-55' : ''
      }`}
      onClick={() => onEditClick?.(task)}
    >
      {/* Apple style reminders checkbox checkmark */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`w-5 h-5 rounded-full border-1.5 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all duration-300 ${
          task.done 
            ? 'bg-text-primary border-transparent scale-105 shadow-md shadow-text-primary/10' 
            : 'border-glass-border hover:border-text-secondary hover:bg-glass-pill-hover'
        }`}
      >
        <span className={`text-[10px] font-bold text-brand-bg transition-opacity duration-300 select-none ${
          task.done ? 'opacity-100' : 'opacity-0'
        }`}>
          ✓
        </span>
      </div>

      {/* Title & metadata content */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`text-sm font-semibold tracking-tight leading-snug truncate transition-all duration-150 ${
          task.done ? 'line-through text-text-tertiary' : 'text-text-primary'
        }`}>
          {task.title}
        </h4>
        
        {/* Dynamic metadata row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 select-none">
          {task.time && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-glass-pill border border-glass-border text-[10px] font-mono font-medium text-text-secondary">
              <Clock className="w-3 h-3 text-text-tertiary" />
              <span>{formatTime(task.time)}</span>
            </span>
          )}

          {task.priority && (
            <span className={`text-[9px] font-bold uppercase tracking-wider font-mono rounded px-2 py-0.5 ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          )}

          {task.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-text-tertiary bg-glass-pill px-2.5 py-0.5 rounded-full border border-glass-border">
              #{tag}
            </span>
          ))}

          {task.reminder && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 font-mono">
              <Bell className="w-2.5 h-2.5 shrink-0" />
              <span>ACTIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* Delete trigger button with animated lifting lid */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          playSnap();
          onDelete(task.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 text-text-tertiary hover:text-red-400 hover:bg-red-500/5 rounded-xl shrink-0"
        title="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default TaskItem;
