/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Plus, 
  Hash, 
  CornerDownLeft, 
  Info, 
  HelpCircle, 
  Sparkles, 
  Loader2, 
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { Habit, Theme, ActiveView } from '../types';
import { playTick, playSuccessChime, playSnap } from '../utils/audio';
import { useRippleOrigin } from '../utils/ripple';

type ParsedTaskDraft = {
  title: string;
  date: string;
  time: string | null;
  needsTime: boolean;
  sourceText: string;
  tags: string[];
  pageId: string | null;
};

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const formatTaskTime = (hours: number, minutes: number = 0) => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

const parseNaturalTime = (text: string) => {
  const timePattern = /\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i;
  const match = text.match(timePattern);
  if (!match) return { time: null, cleanedText: text };

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3].replace(/\./g, '').toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return { time: null, cleanedText: text };

  return {
    time: formatTaskTime(hours, minutes),
    cleanedText: text.replace(match[0], ' ').replace(/\s+/g, ' ').trim(),
  };
};

const parseNaturalDate = (text: string) => {
  const today = new Date();
  const lower = text.toLowerCase();

  // Check for "day after tomorrow" pattern with typo tolerance
  const dayAfterTomorrowMatch = lower.match(/\bday\s+after\s+tomor?r?o?w\b/);
  if (dayAfterTomorrowMatch) {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return {
      date,
      cleanedText: text.replace(new RegExp(`\\b${dayAfterTomorrowMatch[0]}\\b`, 'i'), ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  const relativeMatch = lower.match(/\b(today|tomorrow)\b/);
  if (relativeMatch) {
    const date = new Date();
    if (relativeMatch[1] === 'tomorrow') date.setDate(date.getDate() + 1);
    return {
      date,
      cleanedText: text.replace(new RegExp(`\\b${relativeMatch[1]}\\b`, 'i'), ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  const monthDatePattern = /\b(?:on|at|for)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(\d{4}))?\b/i;
  const dateMonthPattern = /\b(?:on|at|for)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i;
  const numericPattern = /\b(?:on|at|for)?\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/i;

  const buildDate = (day: number, monthIndex: number, year?: number) => {
    let resolvedYear = year ?? today.getFullYear();
    let date = new Date(resolvedYear, monthIndex, day, 12);
    if (!year && date < new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0)) {
      resolvedYear += 1;
      date = new Date(resolvedYear, monthIndex, day, 12);
    }
    if (date.getMonth() !== monthIndex || date.getDate() !== day) return null;
    return date;
  };

  const monthDateMatch = text.match(monthDatePattern);
  if (monthDateMatch) {
    const day = Number(monthDateMatch[1]);
    const monthIndex = MONTHS[monthDateMatch[2].toLowerCase()];
    const year = monthDateMatch[3] ? Number(monthDateMatch[3]) : undefined;
    const date = buildDate(day, monthIndex, year);
    if (date) {
      return {
        date,
        cleanedText: text.replace(monthDateMatch[0], ' ').replace(/\s+/g, ' ').trim(),
      };
    }
  }

  const dateMonthMatch = text.match(dateMonthPattern);
  if (dateMonthMatch) {
    const monthIndex = MONTHS[dateMonthMatch[1].toLowerCase()];
    const day = Number(dateMonthMatch[2]);
    const year = dateMonthMatch[3] ? Number(dateMonthMatch[3]) : undefined;
    const date = buildDate(day, monthIndex, year);
    if (date) {
      return {
        date,
        cleanedText: text.replace(dateMonthMatch[0], ' ').replace(/\s+/g, ' ').trim(),
      };
    }
  }

  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const monthIndex = Number(numericMatch[2]) - 1;
    const rawYear = numericMatch[3] ? Number(numericMatch[3]) : undefined;
    const year = rawYear && rawYear < 100 ? 2000 + rawYear : rawYear;
    const date = buildDate(day, monthIndex, year);
    if (date) {
      return {
        date,
        cleanedText: text.replace(numericMatch[0], ' ').replace(/\s+/g, ' ').trim(),
      };
    }
  }

  return null;
};

const titleCase = (value: string) => value.replace(/\b\w/g, char => char.toUpperCase());

const parseLocalTaskDraft = (text: string, pages: { id: string; name: string }[]): ParsedTaskDraft | null => {
  const dateResult = parseNaturalDate(text);
  if (!dateResult) return null;

  const timeResult = parseNaturalTime(dateResult.cleanedText);
  const lower = text.toLowerCase();
  const matchedPage = pages.find(page => lower.includes(page.name.toLowerCase()));
  const tags = lower.includes('meeting') ? ['meeting'] : [];
  const requiresTime = /\b(meeting|call|appointment|interview|class|session)\b/i.test(text);
  const cleanedTitle = timeResult.cleanedText
    .replace(/\b(add|create|schedule|remind me to|task|event|for|on|at)\b/gi, ' ')
    .replace(
      pages.length
        ? new RegExp(`\\b(${pages.map(page => page.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi')
        : /$^/,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  const title = cleanedTitle || (lower.includes('meeting') ? 'Meeting' : 'Task');

  return {
    title: titleCase(title),
    date: dateResult.date.toDateString(),
    time: timeResult.time,
    needsTime: requiresTime && !timeResult.time,
    sourceText: text,
    tags,
    pageId: matchedPage?.id || null,
  };
};

const formatFriendlyDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatFriendlyTime = (time: string | null) => {
  if (!time) return '';
  const [hourText, minuteText] = time.split(':');
  const hours = Number(hourText);
  const minutes = Number(minuteText);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onSelectHabit: (id: string) => void;
  onAddHabit: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetData: () => void;
  pages?: { id: string; name: string; icon?: string }[];
  onExecuteNavigation?: (view: ActiveView, pageId: string | null) => void;
  onExecuteAddTask?: (task: any) => void;
  onExecuteAddHabit?: (habit: any) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  habits,
  onSelectHabit,
  onAddHabit,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onResetData,
  pages = [],
  onExecuteNavigation,
  onExecuteAddTask,
  onExecuteAddHabit,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultMsg, setAiResultMsg] = useState<string | null>(null);
  const [pendingTimeTask, setPendingTimeTask] = useState<ParsedTaskDraft | null>(null);
  const [timePromptValue, setTimePromptValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const origin = useRippleOrigin(containerRef);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setAiLoading(false);
      setAiResultMsg(null);
      setPendingTimeTask(null);
      setTimePromptValue('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const executeTaskDraft = (draft: ParsedTaskDraft, timeOverride?: string | null) => {
    const time = timeOverride ?? draft.time;
    onExecuteAddTask?.({
      title: draft.title,
      date: draft.date,
      time,
      priority: draft.tags.includes('meeting') ? 'medium' : null,
      tags: draft.tags,
      reminder: !!time,
      pageId: draft.pageId,
      notes: `Compiled from Spotlight: "${draft.sourceText}"`
    });
    setAiResultMsg(`Created "${draft.title}" for ${formatFriendlyDate(draft.date)}${time ? ` at ${formatFriendlyTime(time)}` : ''}.`);
    playSuccessChime();
    setPendingTimeTask(null);
    setTimePromptValue('');
    setTimeout(() => onClose(), 1300);
  };

  const handleLocalTaskDraft = (draft: ParsedTaskDraft) => {
    if (draft.needsTime) {
      setPendingTimeTask(draft);
      setTimePromptValue('');
      playSnap();
      return;
    }
    executeTaskDraft(draft);
  };

  // Handle server-side AI compilation
  const handleAiCompile = async (textToCompile: string) => {
    if (!textToCompile.trim() || aiLoading) return;

    const localDraft = parseLocalTaskDraft(textToCompile, pages);
    if (localDraft) {
      handleLocalTaskDraft(localDraft);
      return;
    }
    
    setAiLoading(true);
    playSnap();

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToCompile,
          userContext: {
            currentDate: new Date().toDateString(),
            habits: habits.map(h => ({ id: h.id, name: h.name, category: h.category })),
            pages: pages.map(p => ({ id: p.id, name: p.name }))
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI Engine compilation error');
      }

      const result = await response.json();
      setAiLoading(false);
      setAiResultMsg(result.message);
      playSuccessChime();

      // Dispatch operations parsed by AI
      setTimeout(() => {
        if (result.intent === 'navigation' && result.data?.navigation) {
          onExecuteNavigation?.(result.data.navigation.view, result.data.navigation.pageId);
        } else if (result.intent === 'schedule_task' && result.data?.task) {
          onExecuteAddTask?.(result.data.task);
        } else if (result.intent === 'create_habit' && result.data?.habit) {
          onExecuteAddHabit?.(result.data.habit);
        } else if (result.intent === 'action' && result.data?.systemAction) {
          const sAct = result.data.systemAction.type;
          if (sAct === 'toggle_theme') onToggleTheme();
          else if (sAct === 'toggle_sounds') onToggleSound();
          else if (sAct === 'start_focus') onExecuteNavigation?.('focus', null);
          else if (sAct === 'clear_completed') {
            // Trigger clear completed handled optionally by parent
            onExecuteNavigation?.('today', null);
          }
        }
        
        // Auto-close dialog after feedback slide
        setTimeout(() => {
          onClose();
        }, 1800);
      }, 1000);

    } catch (error) {
      console.error(error);
      setAiLoading(false);
      setAiResultMsg('Failed to compile. Falling back to local search.');
      setTimeout(() => setAiResultMsg(null), 3000);
    }
  };

  // Define static commands
  const systemCommands = [
    {
      id: 'cmd-new',
      title: 'Create New Habit...',
      subtitle: 'Open the custom habit setup interface',
      icon: <Plus className="w-4 h-4 text-purple-400" />,
      category: 'Actions',
      action: () => {
        onAddHabit();
        onClose();
      },
    },
    {
      id: 'cmd-theme',
      title: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      subtitle: 'Toggle global theme color scheme',
      icon: theme === 'light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />,
      category: 'Preferences',
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'cmd-sound',
      title: `${soundEnabled ? 'Disable' : 'Enable'} UI Synthesizer`,
      subtitle: 'Toggle tactile audio click and chord chimes',
      icon: soundEnabled ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />,
      category: 'Preferences',
      action: () => {
        onToggleSound();
        onClose();
      },
    },
    {
      id: 'cmd-focus',
      title: 'Enter Zen Focus Room',
      subtitle: 'Open the quiet interactive countdown timer',
      icon: <Sparkles className="w-4 h-4 text-rose-500" />,
      category: 'Focus',
      action: () => {
        onExecuteNavigation?.('focus', null);
        onClose();
      }
    },
    {
      id: 'cmd-settings',
      title: 'Open Personalization & Settings',
      subtitle: 'Customize accents, font sizing, and densities',
      icon: <Info className="w-4 h-4 text-blue-500" />,
      category: 'Preferences',
      action: () => {
        onExecuteNavigation?.('settings', null);
        onClose();
      }
    },
    {
      id: 'cmd-reset',
      title: 'Restore Default Sample Habits',
      subtitle: 'Wipe current status and reload high-fidelity sample habits',
      icon: <Info className="w-4 h-4 text-orange-500" />,
      category: 'System',
      action: () => {
        if (confirm('Are you sure you want to restore default sample habits? Current modifications will be lost.')) {
          onResetData();
          playSuccessChime();
        }
        onClose();
      },
    }
  ];

  // Map habits into command entries
  const habitCommands = habits.map((h) => ({
    id: `cmd-habit-${h.id}`,
    title: `Go to: ${h.name}`,
    subtitle: `${h.emoji} | Streak: ${h.completedDays.length} logs | ${h.category}`,
    icon: <Hash className="w-4 h-4" style={{ color: h.color }} />,
    category: 'My Active Habits',
    action: () => {
      onSelectHabit(h.id);
      playTick();
      onClose();
    },
  }));

  const pageCommands = pages.map((p) => ({
    id: `cmd-page-${p.id}`,
    title: `Open page: ${p.name}`,
    subtitle: `${p.icon || '📄'} Page workspace and task list`,
    icon: <Hash className="w-4 h-4 text-brand-accent" />,
    category: 'Pages',
    action: () => {
      onExecuteNavigation?.('page', p.id);
      playTick();
      onClose();
    },
  }));

  const localTaskDraft = search.trim() ? parseLocalTaskDraft(search, pages) : null;

  const localTaskItem = localTaskDraft ? [{
    id: 'cmd-local-task-draft',
    title: localTaskDraft.needsTime
      ? `Add "${localTaskDraft.title}" after choosing a time`
      : `Add "${localTaskDraft.title}"`,
    subtitle: `${formatFriendlyDate(localTaskDraft.date)}${localTaskDraft.time ? ` at ${formatFriendlyTime(localTaskDraft.time)}` : ' | time needed for this event'}`,
    icon: localTaskDraft.time ? <Calendar className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />,
    category: 'Smart Task Draft',
    action: () => handleLocalTaskDraft(localTaskDraft)
  }] : [];

  // AI action trigger if user typed
  const aiCommandItem = search.trim() && !localTaskDraft ? [{
    id: 'cmd-ai-compile-trigger',
    title: `Compile action with AI: "${search}"`,
    subtitle: 'Extract tasks, events, routines, or triggers using server intelligence',
    icon: <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />,
    category: 'Intelligent AI Spotlight',
    action: () => {
      handleAiCompile(search);
    }
  }] : [];

  // Combine and search fit
  const allItems = [...localTaskItem, ...aiCommandItem, ...systemCommands, ...pageCommands, ...habitCommands];
  const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filteredItems = allItems.filter((item) => {
    if (item.id === 'cmd-ai-compile-trigger') return true; // Always allow AI compiler
    if (item.id === 'cmd-local-task-draft') return true;
    const fullText = `${item.title} ${item.subtitle} ${item.category}`.toLowerCase();
    return searchTerms.length === 0 || searchTerms.every(term => fullText.includes(term));
  });

  // Handle escape, up/down arrows, and enter keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || aiLoading) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (pendingTimeTask) {
          setPendingTimeTask(null);
          setTimePromptValue('');
          return;
        }
        onClose();
      } else if (pendingTimeTask && e.key === 'Enter') {
        e.preventDefault();
        if (timePromptValue) {
          executeTaskDraft(pendingTimeTask, timePromptValue);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredItems.length === 0) return;
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
        playTick();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredItems.length === 0) return;
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
        playTick();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        } else if (search.trim()) {
          handleAiCompile(search);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, search, selectedIndex, habits, theme, soundEnabled, filteredItems, aiLoading, pendingTimeTask, timePromptValue]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && !aiLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, aiLoading]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-[12vh] px-4 bg-black/65 backdrop-blur-md">
          {/* Main spotlight container */}
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{ transformOrigin: origin }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className={`w-full max-w-xl bg-glass-bg border backdrop-blur-2xl rounded-[28px] overflow-hidden shadow-2xl text-text-primary transition-all ${
              aiLoading ? 'border-brand-accent shadow-brand-accent-glow/40 ring-1 ring-brand-accent/20' : 'border-glass-border'
            }`}
          >
            {/* Input bar */}
            <div className="flex items-center px-4.5 py-4 border-b border-glass-border gap-3.5 relative">
              <Search className="w-5 h-5 text-text-tertiary flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                disabled={aiLoading}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or dynamic phrase (e.g. 'Lunch tomorrow at 1', 'start focus mode')..."
                className="w-full bg-transparent border-0 outline-none p-0 text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-0 leading-relaxed font-semibold"
              />
              <div className="flex items-center gap-1.5 bg-glass-pill border border-glass-border px-2 py-0.5 rounded-lg text-[9px] text-text-tertiary font-mono select-none font-bold">
                <span>ESC</span>
              </div>
            </div>

            {/* AI compilation animation overlay screen */}
            <AnimatePresence mode="wait">
              {aiLoading && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '140px' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-brand-accent-glow/5 border-b border-glass-border/30 flex flex-col items-center justify-center p-6 text-center gap-3 select-none"
                >
                  <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold font-mono text-brand-accent uppercase tracking-widest animate-pulse">Claro AI Compiling</p>
                    <p className="text-xs text-text-secondary">Synthesizing natural language instruction, parsing metrics...</p>
                  </div>
                </motion.div>
              )}

              {aiResultMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '140px' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-glass-border/30 flex flex-col items-center justify-center p-6 text-center gap-2.5 select-none"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
                  <div className="space-y-1 px-4">
                    <p className="text-xs font-bold font-mono text-emerald-500 uppercase tracking-widest">Action Verified</p>
                    <p className="text-sm font-semibold text-text-primary leading-tight">{aiResultMsg}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {pendingTimeTask && !aiLoading && !aiResultMsg && (
              <motion.form
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (timePromptValue) executeTaskDraft(pendingTimeTask, timePromptValue);
                }}
                className="m-2.5 p-4 rounded-3xl bg-glass-pill border border-glass-border shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold font-mono uppercase tracking-widest text-text-tertiary">
                      Time Required
                    </p>
                    <p className="text-sm font-bold text-text-primary leading-snug">
                      What time is "{pendingTimeTask.title}"?
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-1 font-medium">
                      Scheduled for {formatFriendlyDate(pendingTimeTask.date)}.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <input
                    type="time"
                    value={timePromptValue}
                    onChange={(event) => setTimePromptValue(event.target.value)}
                    className="w-full bg-glass-bg border border-glass-border rounded-xl px-3 py-2 text-sm font-bold text-text-primary focus:outline-none focus:border-text-secondary"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!timePromptValue}
                    className="px-4 py-2 rounded-xl bg-text-primary text-brand-bg text-xs font-bold disabled:opacity-40"
                  >
                    Add Task
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '9 AM', value: '09:00' },
                    { label: '12 PM', value: '12:00' },
                    { label: '5 PM', value: '17:00' },
                    { label: '7 PM', value: '19:00' },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setTimePromptValue(preset.value);
                        playTick();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-glass-bg hover:bg-glass-pill-hover border border-glass-border text-[10px] font-bold text-text-secondary hover:text-text-primary"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => executeTaskDraft(pendingTimeTask, null)}
                    className="px-2.5 py-1 rounded-lg bg-glass-bg hover:bg-glass-pill-hover border border-glass-border text-[10px] font-bold text-text-tertiary hover:text-text-primary"
                  >
                    Add without time
                  </button>
                </div>
              </motion.form>
            )}

            {/* Results listing */}
            {!aiLoading && !aiResultMsg && !pendingTimeTask && (
              <div className="max-h-[340px] overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
                {filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-sm text-text-tertiary flex flex-col items-center gap-2">
                    <HelpCircle className="w-8 h-8 text-text-quaternary" />
                    <span className="font-semibold text-text-secondary">No matching commands or habits detected</span>
                    <span className="text-xs text-text-tertiary max-w-xs leading-relaxed">Press Enter anyway to let our intelligent model parse your words into schedules or habits!</span>
                  </div>
                ) : (
                  // Group categorizations
                  Object.entries(
                    filteredItems.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                      // Keep AI items first
                    }, {} as Record<string, typeof filteredItems>)
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-1">
                      <p className="px-3 pt-3 pb-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-mono">
                        {category}
                      </p>
                      {items.map((item) => {
                        const globalIndex = filteredItems.findIndex((x) => x.id === item.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              item.action();
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`group w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? 'bg-glass-pill-hover border border-glass-border shadow'
                                : 'hover:bg-glass-pill border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className={`p-2.5 rounded-xl shrink-0 ${
                                isSelected ? 'bg-glass-pill text-text-primary' : 'bg-glass-pill text-text-secondary'
                              }`}>
                                {item.icon}
                              </div>
                              <div className="text-left min-w-0 flex-1">
                                <p className={`text-xs font-bold leading-none truncate ${
                                  isSelected ? 'text-text-primary font-bold' : 'text-text-secondary'
                                }`}>
                                  {item.title}
                                </p>
                                <p className="text-[10px] text-text-tertiary line-clamp-1 mt-1 font-medium">{item.subtitle}</p>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <motion.div 
                                layoutId="enter-badge"
                                className="flex items-center gap-1.5 bg-glass-pill border border-glass-border/70 px-2.5 py-1 rounded-xl text-[9px] text-text-secondary font-bold uppercase tracking-wider font-mono shadow shrink-0"
                              >
                                <span>Enter</span>
                                <CornerDownLeft className="w-2.5 h-2.5" />
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Shortcut hints footer */}
            <div className="px-4.5 py-2.5 bg-glass-pill border-t border-glass-border/60 flex items-center justify-between text-[10px] text-text-tertiary font-mono">
              <div className="flex gap-4 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="bg-glass-pill-hover border border-glass-border/40 px-1 py-0.5 rounded">↑↓</span> Nav
                </span>
                <span className="flex items-center gap-1">
                  <span className="bg-glass-pill-hover border border-glass-border/40 px-1 py-0.5 rounded">↵</span> Confirm
                </span>
              </div>
              <div className="font-semibold">
                <span>⌘K or Ctrl+K to Spotlight Console</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
