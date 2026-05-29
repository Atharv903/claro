/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Menu, Sparkles, Command, Flame, CheckCircle, Clock, 
  HelpCircle, Trash2, Smile, Layers, TrendingUp, Maximize2, 
  PlusCircle, FolderPlus, Grid, Calendar as CalendarIcon, 
  CheckSquare, Check, Calendar, ArrowRight, Share2, Upload, AlertCircle,
  X, Save
} from 'lucide-react';

import { Habit, Theme, Task, Page, ActiveView } from './types';
import { DEFAULT_HABITS } from './data/defaultHabits';
import { formatLocalDate, getRelativeDateString } from './utils/date';
import { toggleAudioEnabled, playTick, playSuccessChime, playSnap } from './utils/audio';
import LoginPage from './components/LoginPage';

import { 
  auth, 
  signInWithGoogle, 
  logOut, 
  saveUserStateToFirestore, 
  subscribeUserStateFromFirestore 
} from './utils/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Core Subcomponents
import MeshBackground from './components/MeshBackground';
import Sidebar from './components/Sidebar';
import HabitDetail from './components/HabitDetail';
import AddHabitModal from './components/AddHabitModal';
import CommandPalette from './components/CommandPalette';
import OnboardingFlow from './components/OnboardingFlow';
import TaskItem from './components/TaskItem';
import TaskCalendar from './components/TaskCalendar';
import HabitsGrid from './components/HabitsGrid';
import AddTaskForm from './components/AddTaskForm';
import PhotoVerifierModal from './components/PhotoVerifierModal';

// Specialized New Functional Rooms
import FocusRoom from './components/FocusRoom';
import PersonalizationSettings from './components/PersonalizationSettings';

const safeSetLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to persist ${key} locally:`, error);
    return false;
  }
};

const INITIAL_PAGES: Page[] = [
  { id: 'personal', name: 'Personal', icon: '🏠' },
  { id: 'work', name: 'Work', icon: '💼' }
];

const createCleanHabits = (): Habit[] => DEFAULT_HABITS.map((habit) => {
  const { completedDays, verifiedPhotos, createdAt, ...cleanHabit } = habit;
  return {
    ...cleanHabit,
    completedDays: [],
    createdAt: Date.now()
  };
});

const toInputDate = (dateString: string) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return formatLocalDate(new Date());
  return formatLocalDate(parsed);
};

function TaskEditModal({
  task,
  pages,
  onClose,
  onSave,
}: {
  task: Task | null;
  pages: Page[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
}) {
  const [title, setTitle] = useState('');
  const [dateVal, setDateVal] = useState(formatLocalDate(new Date()));
  const [timeVal, setTimeVal] = useState('');
  const [priority, setPriority] = useState<Task['priority']>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDateVal(toInputDate(task.date));
    setTimeVal(task.time || '');
    setPriority(task.priority);
    setPageId(task.pageId);
    setTagsText(task.tags.join(', '));
    setNotes(task.notes || '');
    setReminder(task.reminder);
  }, [task]);

  if (!task) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    const dueDate = new Date(`${dateVal}T12:00:00`);
    onSave(task.id, {
      title: title.trim(),
      date: dueDate.toDateString(),
      time: timeVal || null,
      priority,
      pageId,
      reminder,
      notes: notes.trim() || undefined,
      tags: tagsText
        .split(',')
        .map(tag => tag.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-md p-3">
        <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close task editor" />
        <motion.form
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onSubmit={submit}
          className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto scrollbar-thin bg-glass-bg border border-glass-border rounded-[28px] shadow-2xl p-5 space-y-4 text-text-primary"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-tertiary">Edit Task</p>
              <h2 className="text-lg font-bold font-display tracking-tight">Manage reminder details</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-glass-pill hover:bg-glass-pill-hover border border-glass-border flex items-center justify-center text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <label className="space-y-1 block">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-tertiary">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-glass-pill border border-glass-border rounded-2xl px-3.5 py-3 text-sm font-semibold text-text-primary focus:outline-none focus:border-text-secondary"
              autoFocus
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-tertiary">Due Date</span>
              <input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full bg-glass-pill border border-glass-border rounded-xl p-2.5 text-xs font-semibold text-text-secondary focus:outline-none"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-tertiary">Time</span>
              <input
                type="time"
                value={timeVal}
                onChange={(e) => setTimeVal(e.target.value)}
                className="w-full bg-glass-pill border border-glass-border rounded-xl p-2.5 text-xs font-semibold text-text-secondary focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-tertiary">Page</span>
              <select
                value={pageId || ''}
                onChange={(e) => setPageId(e.target.value || null)}
                className="w-full bg-glass-pill border border-glass-border rounded-xl p-2.5 text-xs font-semibold text-text-secondary focus:outline-none"
              >
                <option value="">Inbox</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>{page.icon || '📄'} {page.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-tertiary">Tags</span>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="study, calls, admin"
                className="w-full bg-glass-pill border border-glass-border rounded-xl p-2.5 text-xs font-semibold text-text-secondary placeholder-text-tertiary focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-0.5 bg-glass-pill border border-glass-border rounded-xl">
              {(['high', 'medium', 'low', null] as const).map((value) => (
                <button
                  key={value || 'none'}
                  type="button"
                  onClick={() => setPriority(value)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg capitalize ${
                    priority === value ? 'bg-text-primary text-brand-bg' : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  {value || 'none'}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <input
                type="checkbox"
                checked={reminder}
                onChange={(e) => setReminder(e.target.checked)}
                className="accent-[var(--accent-color)]"
              />
              Sound reminder
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-tertiary">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none bg-glass-pill border border-glass-border rounded-2xl px-3.5 py-3 text-xs font-medium text-text-secondary focus:outline-none focus:border-text-secondary"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-glass-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-glass-pill hover:bg-glass-pill-hover border border-glass-border text-xs font-semibold text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-text-primary text-brand-bg text-xs font-bold flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </motion.form>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  // Sync core states
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);

  // Personalization Config States
  const [accentColor, setAccentColor] = useState<string>('blue');
  const [animationIntensity, setAnimationIntensity] = useState<'gentle' | 'normal' | 'none'>('normal');
  const [calendarDensity, setCalendarDensity] = useState<'cozy' | 'compact' | 'roomy'>('cozy');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Views & filters state
  const [activeView, setActiveView] = useState<ActiveView>('today');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeTaskFilter, setActiveTaskFilter] = useState<'all' | 'active' | 'done'>('all');

  // UI styling & settings state
  const [theme, setTheme] = useState<Theme>('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bypassAuth, setBypassAuth] = useState(false);

  // Modal triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Photo verification popup overlay state (Triggered from Today checklist or Habits Table click!)
  const [activeVerModal, setActiveVerModal] = useState<{
    habit: Habit;
    dateStr: string;
  } | null>(null);

  // Alert/Snack notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Initial State configuration on Mount
  useEffect(() => {
    // A. Theme Setup
    const savedTheme = localStorage.getItem('riseTheme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }

    // B. Sound Configuration
    const savedSound = localStorage.getItem('riseSoundEnabled');
    if (savedSound !== null) {
      const enabled = savedSound === 'true';
      setSoundEnabled(enabled);
      toggleAudioEnabled(enabled);
    }

    // C. Local storage bootstrap caches
    const cachedHabits = localStorage.getItem('riseHabits_guest') || localStorage.getItem('riseHabits');
    if (cachedHabits) {
      try {
        setHabits(JSON.parse(cachedHabits));
      } catch {
        setHabits(DEFAULT_HABITS);
      }
    } else {
      setHabits(DEFAULT_HABITS);
    }

    const cachedTasks = localStorage.getItem('riseTasks_guest') || localStorage.getItem('riseTasks');
    if (cachedTasks) {
      try {
        setTasks(JSON.parse(cachedTasks));
      } catch {
        setTasks([]);
      }
    }

    const cachedPages = localStorage.getItem('risePages_guest') || localStorage.getItem('risePages');
    if (cachedPages) {
      try {
        setPages(JSON.parse(cachedPages).map((page: Page) => ({ icon: '📄', ...page })));
      } catch {
        // default pre-loaded Pages
      }
    }

    // D. Onboarding checklist review
    const onboardingComplete = localStorage.getItem('riseOnboardingComplete') === 'true';
    if (!onboardingComplete) {
      setIsOnboardingOpen(true);
    }

    // E. Load Personalization States
    const savedAccent = localStorage.getItem('riseAccentColor') || 'blue';
    setAccentColor(savedAccent);
    document.documentElement.setAttribute('data-accent', savedAccent);

    const savedAnim = localStorage.getItem('riseAnimationIntensity') as 'gentle' | 'normal' | 'none';
    if (savedAnim) setAnimationIntensity(savedAnim);

    const savedDensity = localStorage.getItem('riseCalendarDensity') as 'cozy' | 'compact' | 'roomy';
    if (savedDensity) setCalendarDensity(savedDensity);

    const savedFontSize = localStorage.getItem('riseFontSize') as 'small' | 'medium' | 'large';
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  // Sync Accent Attributes and local caches dynamically
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
    localStorage.setItem('riseAccentColor', accentColor);
  }, [accentColor]);

  // Handle Root Typography Scale dynamically
  useEffect(() => {
    localStorage.setItem('riseFontSize', fontSize);
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  // 2. Setup Firebase Auth Listener & continuous Cloud database Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      setAuthLoading(false);

      if (fbUser) {
        showToast(`Welcome back, ${fbUser.displayName || fbUser.email}! Synced to cloud.`, 'success');
        
        // Try to load cached user-specific local storage first so UI updates instantly
        const localHabits = localStorage.getItem(`riseHabits_${fbUser.uid}`);
        const localTasks = localStorage.getItem(`riseTasks_${fbUser.uid}`);
        const localPages = localStorage.getItem(`risePages_${fbUser.uid}`);
        if (localHabits) setHabits(JSON.parse(localHabits));
        if (localTasks) setTasks(JSON.parse(localTasks));
        if (localPages) setPages(JSON.parse(localPages));

        // Subscribe to User Database block (real-time)
        const userUnsub = subscribeUserStateFromFirestore(
          fbUser.uid,
          (remoteState) => {
            if (remoteState) {
              if (remoteState.habits) setHabits(remoteState.habits);
              if (remoteState.tasks) setTasks(remoteState.tasks);
              if (remoteState.pages) setPages(remoteState.pages.map((page: Page) => ({ icon: '📄', ...page })));
              if (remoteState.theme) setTheme(remoteState.theme);

              safeSetLocalStorage(`riseHabits_${fbUser.uid}`, JSON.stringify(remoteState.habits || []));
              safeSetLocalStorage(`riseTasks_${fbUser.uid}`, JSON.stringify(remoteState.tasks || []));
              safeSetLocalStorage(`risePages_${fbUser.uid}`, JSON.stringify(remoteState.pages || []));
              safeSetLocalStorage(`riseTheme_${fbUser.uid}`, remoteState.theme || 'dark');
            } else {
              // First-time cloud users: migrate their local guest offline data to their new cloud account if it exists!
              const guestHabitsRaw = localStorage.getItem('riseHabits_guest');
              const guestTasksRaw = localStorage.getItem('riseTasks_guest');
              const guestPagesRaw = localStorage.getItem('risePages_guest');

              let habitsToSave = DEFAULT_HABITS;
              if (guestHabitsRaw) {
                try { habitsToSave = JSON.parse(guestHabitsRaw); } catch {}
              }
              let tasksToSave: Task[] = [];
              if (guestTasksRaw) {
                try { tasksToSave = JSON.parse(guestTasksRaw); } catch {}
              }
              let pagesToSave = INITIAL_PAGES;
              if (guestPagesRaw) {
                try { pagesToSave = JSON.parse(guestPagesRaw); } catch {}
              }

              localStorage.removeItem('riseHabits_guest');
              localStorage.removeItem('riseTasks_guest');
              localStorage.removeItem('risePages_guest');

              setHabits(habitsToSave);
              setTasks(tasksToSave);
              setPages(pagesToSave);

              safeSetLocalStorage(`riseHabits_${fbUser.uid}`, JSON.stringify(habitsToSave));
              safeSetLocalStorage(`riseTasks_${fbUser.uid}`, JSON.stringify(tasksToSave));
              safeSetLocalStorage(`risePages_${fbUser.uid}`, JSON.stringify(pagesToSave));

              saveUserStateToFirestore(fbUser.uid, {
                habits: habitsToSave,
                tasks: tasksToSave,
                pages: pagesToSave,
                theme,
              });
            }
          }
        );

        return () => userUnsub;
      } else {
        // User logged out: clear memory & load guest storage
        const cachedHabits = localStorage.getItem('riseHabits_guest') || localStorage.getItem('riseHabits');
        if (cachedHabits) {
          try {
            setHabits(JSON.parse(cachedHabits));
          } catch {
            setHabits(DEFAULT_HABITS);
          }
        } else {
          setHabits(DEFAULT_HABITS);
        }

        const cachedTasks = localStorage.getItem('riseTasks_guest') || localStorage.getItem('riseTasks');
        if (cachedTasks) {
          try {
            setTasks(JSON.parse(cachedTasks));
          } catch {
            setTasks([]);
          }
        } else {
          setTasks([]);
        }

        const cachedPages = localStorage.getItem('risePages_guest') || localStorage.getItem('risePages');
        if (cachedPages) {
          try {
            setPages(JSON.parse(cachedPages).map((page: Page) => ({ icon: '📄', ...page })));
          } catch {
            setPages(INITIAL_PAGES);
          }
        } else {
          setPages(INITIAL_PAGES);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Centralized Save & DB sync mutations wrapper
  const commitAppData = async (
    updatedHabits: Habit[],
    updatedTasks: Task[],
    updatedPages: Page[]
  ) => {
    setHabits(updatedHabits);
    setTasks(updatedTasks);
    setPages(updatedPages);

    const suffix = currentUser ? currentUser.uid : 'guest';
    safeSetLocalStorage(`riseHabits_${suffix}`, JSON.stringify(updatedHabits));
    safeSetLocalStorage(`riseTasks_${suffix}`, JSON.stringify(updatedTasks));
    safeSetLocalStorage(`risePages_${suffix}`, JSON.stringify(updatedPages));

    // Async push to remote Firestore if currentUser is logged in
    if (currentUser) {
      await saveUserStateToFirestore(currentUser.uid, {
        habits: updatedHabits,
        tasks: updatedTasks,
        pages: updatedPages,
        theme
      });
    }
  };

  // Keyboard Spotlight triggering: ⌘K or Ctrl+K
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playTick();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Sync index.css document root for Dark classes styling
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('riseTheme', theme);
    
    // Remote update theme config too
    if (currentUser) {
      saveUserStateToFirestore(currentUser.uid, { theme });
    }
  }, [theme, currentUser]);

  // UI Actions Toggles handlers
  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleToggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    toggleAudioEnabled(newVal);
    localStorage.setItem('riseSoundEnabled', newVal ? 'true' : 'false');
  };

  // 4. TASK MANAGEMENT ENGINE
  const handleAddTask = (taskData: Omit<Task, 'id' | 'done' | 'createdAt'>) => {
    const normalizedTaskData = {
      time: null,
      priority: null,
      tags: [],
      reminder: false,
      pageId: null,
      ...taskData,
    };
    const newTask: Task = {
      ...normalizedTaskData,
      id: `task-${Date.now()}`,
      done: false,
      createdAt: new Date().toISOString()
    };
    const updatedTasks = [newTask, ...tasks];
    commitAppData(habits, updatedTasks, pages);
    showToast(`Task "${newTask.title}" compiled successfully`, 'success');
  };

  const handleToggleTask = (id: string) => {
    playTick();
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const afterToggle = !t.done;
        if (afterToggle) playSuccessChime();
        return { ...t, done: afterToggle };
      }
      return t;
    });
    commitAppData(habits, updatedTasks, pages);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    commitAppData(habits, updatedTasks, pages);
    showToast('Task removed from workflow', 'info');
  };

  const handleUpdateTask = (id: string, updatedFields: Partial<Task>) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        return { ...t, ...updatedFields };
      }
      return t;
    });
    commitAppData(habits, updatedTasks, pages);
  };

  const handleSaveTaskEdit = (id: string, updatedFields: Partial<Task>) => {
    handleUpdateTask(id, updatedFields);
    setEditingTask(null);
    playSuccessChime();
    showToast('Task updated', 'success');
  };

  // 5. NOTION PAGES ENGINE
  const handleAddPage = (name: string, icon?: string) => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      name,
      icon: icon || '📄'
    };
    const updatedPages = [...pages, newPage];
    commitAppData(habits, tasks, updatedPages);
    setActiveView('page');
    setActivePageId(newPage.id);
    showToast(`Notion Page "${name}" established`, 'success');
  };

  const handleUpdatePage = (pageId: string, updates: Partial<Page>) => {
    const updatedPages = pages.map(p => p.id === pageId ? { ...p, ...updates } : p);
    commitAppData(habits, tasks, updatedPages);
    showToast('Page updated', 'success');
  };

  const handleDeletePage = (pageId: string) => {
    const updatedPages = pages.filter(p => p.id !== pageId);
    // Unassign tasks from that page back to inbox
    const updatedTasks = tasks.map(t => t.pageId === pageId ? { ...t, pageId: null } : t);
    commitAppData(habits, updatedTasks, updatedPages);

    if (activePageId === pageId) {
      setActiveView('today');
      setActivePageId(null);
    }
    showToast('Notion folder page removed', 'info');
  };

  // 6. ROUTINE HABITS ENGINE
  const handleToggleHabitDay = (habitId: string, dateStr: string) => {
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const completed = h.completedDays.includes(dateStr);
        const newCompletedDays = completed
          ? h.completedDays.filter(d => d !== dateStr)
          : [...h.completedDays, dateStr];

        const updatedVerified = { ...(h.verifiedPhotos || {}) };
        if (completed && updatedVerified[dateStr]) {
          delete updatedVerified[dateStr];
        }

        return {
          ...h,
          completedDays: newCompletedDays,
          verifiedPhotos: updatedVerified
        };
      }
      return h;
    });
    commitAppData(updatedHabits, tasks, pages);
    playSuccessChime();
  };

  const handleVerifyHabitDayWithPhoto = (habitId: string, dateStr: string, photo: string, comment: string) => {
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const completed = h.completedDays.includes(dateStr);
        const newCompletedDays = completed ? h.completedDays : [...h.completedDays, dateStr];

        const updatedVerified = { ...(h.verifiedPhotos || {}) };
        updatedVerified[dateStr] = {
          photo,
          comment,
          verifiedAt: Date.now()
        };

        return {
          ...h,
          completedDays: newCompletedDays,
          verifiedPhotos: updatedVerified
        };
      }
      return h;
    });
    commitAppData(updatedHabits, tasks, pages);
    playSuccessChime();
    showToast(`Vision proof accepted! Gemini has double-logged your routine.`, 'success');
  };

  const handleCreateHabit = (newHabitData: Omit<Habit, 'id' | 'completedDays' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: `habit-${Date.now()}`,
      completedDays: [],
      createdAt: Date.now()
    };
    const updatedHabits = [...habits, newHabit];
    commitAppData(updatedHabits, tasks, pages);
    
    // Set active drilled down routine
    setActiveHabitId(newHabit.id);
    setActiveView('habits');
    setIsAddOpen(false);
    showToast(`Focus area "${newHabitData.name}" created`, 'success');
  };

  const handleDeleteHabit = (id: string) => {
    const updatedHabits = habits.filter(h => h.id !== id);
    commitAppData(updatedHabits, tasks, pages);

    if (activeHabitId === id) {
      setActiveHabitId(updatedHabits.length ? updatedHabits[0].id : null);
    }
    showToast('Habit Routine archived', 'info');
  };

  const handleReorderHabits = (reordered: Habit[]) => {
    commitAppData(reordered, tasks, pages);
  };

  // Google Sign-In helper
  const handleCloudLogin = async () => {
    try {
      playTick();
      await signInWithGoogle();
    } catch (err: any) {
      showToast(`Cloud integration failed: ${err.message}`, 'error');
    }
  };

  const handleCloudLogout = async () => {
    try {
      playSnap();
      setBypassAuth(false);
      await logOut();
      showToast('Offline fallback activated', 'info');
    } catch (err: any) {
      showToast('Logout error', 'error');
    }
  };

  // 7. CALENDAR MOCK SYNC & FILE IMPORTS
  // Simulated Google Calendar Live Synch
  const handleSyncGCalSimulate = () => {
    playTick();
    const mockEvents = [
      { title: '📅 Sync Product Roadmap', time: '10:00', offset: 0 },
      { title: '🧘 Apple Fitness: Active Recovery Yoga', time: '12:00', offset: 0 },
      { title: '💻 Code Review: Claro Core OS v1.5', time: '14:30', offset: 1 },
      { title: '🍽️ Mindful Nutrition Prep', time: '18:00', offset: 1 },
      { title: '📚 Reading: Atomic Habits Ch 4', time: '21:30', offset: 2 }
    ];

    const todayObj = new Date();
    const compiledMocks: Task[] = mockEvents.map((evt, index) => {
      const targetDate = new Date();
      targetDate.setDate(todayObj.getDate() + evt.offset);
      return {
        id: `gcal-${Date.now()}-${index}`,
        title: evt.title,
        time: evt.time,
        date: targetDate.toDateString(),
        priority: 'medium',
        tags: ['google_cal'],
        reminder: true,
        done: false,
        pageId: null,
        createdAt: new Date().toISOString()
      };
    });

    // Check of Page setup
    commitAppData(habits, [...compiledMocks, ...tasks], pages);
    playSuccessChime();
    showToast('Google Calendar Synch Complete! 5 events merged into your schedule.', 'success');
  };

  // Habits filtration by high-level responsive tag filters
  const filteredHabits = habits.filter(h => {
    if (activeCategory === 'All') return true;
    return h.category.toLowerCase() === activeCategory.toLowerCase();
  });

  // Active Drilling down single habit lookup
  const activeHabit = habits.find(h => h.id === activeHabitId) || null;

  // Render core views helper
  const renderWorkspaceCenter = () => {
    const todayDateString = new Date().toDateString();

    switch (activeView) {
      case 'today':
        const todayTasks = tasks.filter(t => t.date === todayDateString);
        const activeTodayTasks = todayTasks.filter(t => !t.done);
        const completedTodayTasks = todayTasks.filter(t => t.done);
        const todayFormatLocalDate = formatLocalDate(new Date());
        const statsLoggedToday = habits.filter(h => h.completedDays.includes(todayFormatLocalDate));

        // Combined Apple Fitness daily metrics percentage rate
        const totalItemsToday = todayTasks.length + habits.length;
        const totalDoneToday = completedTodayTasks.length + statsLoggedToday.length;
        const dailyProgressPercent = totalItemsToday > 0 ? Math.round((totalDoneToday / totalItemsToday) * 100) : 0;

        return (
          <div className="space-y-6 animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin">
            
            {/* Apple style Fitness Circle Progress Row */}
            <div className="bg-glass-bg border border-glass-border rounded-[32px] p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[10px] font-bold text-text-tertiary tracking-widest uppercase font-mono">My Daily Fitness Rings</span>
                <h2 className="text-xl font-extrabold font-display text-text-primary tracking-tight">Today's Pristine Status</h2>
                <p className="text-xs text-text-secondary leading-relaxed max-w-md">
                  You resolved <span className="font-mono font-bold text-text-primary">{statsLoggedToday.length}</span> out of {habits.length} routines, and cleared <span className="font-mono font-bold text-text-primary">{completedTodayTasks.length}</span> of today's reminders.<br />Achieve a perfect ring today!
                </p>
              </div>

              {/* IOS Circular Ring */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center select-none font-sans">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="var(--color-glass-pill-hover)" strokeWidth="8" fill="transparent" />
                  <motion.circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="var(--accent-color)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray="301.6"
                    initial={{ strokeDashoffset: 301.6 }}
                    animate={{ strokeDashoffset: 301.6 - (301.6 * dailyProgressPercent) / 100 }}
                    transition={{ duration: 1.6, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black font-mono leading-none">{dailyProgressPercent}%</span>
                  <span className="text-[8px] uppercase tracking-widest text-text-tertiary font-bold mt-0.5">Ring Daily</span>
                </div>
              </div>
            </div>

            {/* Daily Habits Quick Bubbles checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Today's Focus Routines</h3>
                <span className="text-[10px] text-orange-400 font-bold font-mono">TAP BUBBLES TO PROGRESS</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {filteredHabits.map((h) => {
                  const doneToday = h.completedDays.includes(todayFormatLocalDate);
                  const isVerified = !!h.verifiedPhotos?.[todayFormatLocalDate];
                  return (
                    <motion.div
                      key={h.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        playTick();
                        // Open verifier modal instantly
                        setActiveVerModal({ habit: h, dateStr: todayFormatLocalDate });
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 bg-glass-bg border rounded-3xl shadow-sm cursor-pointer select-none text-center h-28 gap-2.5 transition-all w-full border-glass-border hover:border-text-quaternary`}
                    >
                      <div 
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all ${
                          doneToday ? 'text-white' : ''
                        }`}
                        style={{ 
                          backgroundColor: doneToday ? h.color : `${h.color}15`,
                          boxShadow: doneToday ? `0 4px 14px ${h.color}40` : 'none'
                        }}
                      >
                        {doneToday ? <Check className="w-5 h-5 stroke-[3]" /> : <span>{h.emoji}</span>}
                      </div>

                      <div className="min-w-0 w-full px-1">
                        <p className={`text-xs font-bold truncate ${doneToday ? 'text-text-primary line-through opacity-70' : 'text-text-primary'}`}>
                          {h.name}
                        </p>
                        <p className="text-[9px] text-text-tertiary font-mono uppercase tracking-wide mt-0.5 mt-auto">
                          {isVerified ? '✓ Vision Proof' : h.category}
                        </p>
                      </div>

                      {/* Sparkles top layout overlay if verified */}
                      {doneToday && isVerified && (
                        <span className="absolute top-2.5 right-2.5 text-indigo-500 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Today's Tasks checklist */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-text-tertiary tracking-widest uppercase font-mono">Today's Reminders Checklist ({todayTasks.length})</h3>
                <span className="text-[9px] px-2 py-0.5 bg-glass-pill cursor-pointer rounded-lg hover:text-text-primary font-bold text-text-tertiary font-mono" onClick={handleSyncGCalSimulate}>➔ GCAL IMPORT</span>
              </div>

              {/* Task Add overlay form */}
              <AddTaskForm pages={pages} initialPageId={null} onAddTask={handleAddTask} />

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {/* Active tasks */}
                  {activeTodayTasks.map((t) => (
                    <TaskItem 
                      key={t.id} 
                      task={t} 
                      onToggle={handleToggleTask} 
                      onDelete={handleDeleteTask} 
                      onEditClick={setEditingTask} 
                    />
                  ))}

                  {/* Empty message */}
                  {todayTasks.length === 0 && (
                    <p className="text-xs text-text-tertiary text-center py-8 select-none">
                      No tasks scheduled for today. Add one above or import mock events!
                    </p>
                  )}

                  {/* Completed Collapsible block */}
                  {completedTodayTasks.length > 0 && (
                    <div className="pt-3 border-t border-glass-border/30 space-y-2">
                      <p className="text-[9px] font-bold text-text-tertiary font-mono tracking-widest uppercase pl-1 select-none">Completed Reminders</p>
                      {completedTodayTasks.map((t) => (
                        <TaskItem 
                          key={t.id} 
                          task={t} 
                          onToggle={handleToggleTask} 
                          onDelete={handleDeleteTask} 
                          onEditClick={setEditingTask} 
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        );

      case 'all':
        // Filter tasks
        const queryFilteredTasks = tasks.filter(t => {
          if (activeTaskFilter === 'active') return !t.done;
          if (activeTaskFilter === 'done') return t.done;
          return true;
        });

        const activeAllTasks = queryFilteredTasks.filter(t => !t.done);
        const completedAllTasks = queryFilteredTasks.filter(t => t.done);

        return (
          <div className="space-y-4 animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 px-1">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold font-display text-text-primary">All Workflow Tasks</h2>
                <p className="text-xs text-text-tertiary">Unified checklists across your entire system</p>
              </div>

              {/* Active/Done togglers */}
              <div className="flex items-center p-0.5 bg-glass-pill border border-glass-border rounded-xl">
                {([
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'done', label: 'Done' }
                ] as const).map((tk) => (
                  <button
                    key={tk.id}
                    onClick={() => { playTick(); setActiveTaskFilter(tk.id); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                      activeTaskFilter === tk.id
                        ? 'bg-text-primary text-brand-bg font-extrabold shadow'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tk.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add task header form */}
            <AddTaskForm pages={pages} initialPageId={null} onAddTask={handleAddTask} />

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {activeAllTasks.map((t) => (
                  <TaskItem 
                    key={t.id} 
                    task={t} 
                    onToggle={handleToggleTask} 
                    onDelete={handleDeleteTask} 
                    onEditClick={setEditingTask} 
                  />
                ))}

                {tasks.length === 0 && (
                  <p className="text-xs text-text-tertiary text-center py-12 select-none"> No tasks logged. Plan ideas or import GCal! </p>
                )}

                {completedAllTasks.length > 0 && (
                  <div className="pt-3 border-t border-glass-border/30 space-y-2">
                    <p className="text-[9px] font-bold text-text-tertiary font-mono tracking-widest uppercase pl-1 select-none">History Ledger</p>
                    {completedAllTasks.map((t) => (
                      <TaskItem 
                        key={t.id} 
                        task={t} 
                        onToggle={handleToggleTask} 
                        onDelete={handleDeleteTask} 
                        onEditClick={setEditingTask} 
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        );

      case 'page':
        const pageItem = pages.find(p => p.id === activePageId);
        const pageTasks = tasks.filter(t => t.pageId === activePageId);
        const activePageTasks = pageTasks.filter(t => !t.done);
        const completedPageTasks = pageTasks.filter(t => t.done);

        return (
          <div className="space-y-4 animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin">
            
            <div className="px-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pageItem?.icon || '📄'}</span>
                <h2 className="text-lg font-bold font-display text-text-primary truncate">{pageItem?.name || 'My Notion Folder'}</h2>
              </div>
              <p className="text-xs text-text-tertiary">Tasks categorized specifically inside this Notion checklist</p>
            </div>

            {/* Form bound to this activePageId */}
            <AddTaskForm pages={pages} initialPageId={activePageId} onAddTask={handleAddTask} />

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {activePageTasks.map((t) => (
                  <TaskItem 
                    key={t.id} 
                    task={t} 
                    onToggle={handleToggleTask} 
                    onDelete={handleDeleteTask} 
                    onEditClick={setEditingTask} 
                  />
                ))}

                {pageTasks.length === 0 && (
                  <p className="text-xs text-text-tertiary text-center py-10 select-none">
                    This page is pristine. Compile ideas above!
                  </p>
                )}

                {completedPageTasks.length > 0 && (
                  <div className="pt-3 border-t border-glass-border/30 space-y-2">
                    <p className="text-[9px] font-bold text-text-tertiary font-mono tracking-widest uppercase pl-1 select-none">Resolved on Page</p>
                    {completedPageTasks.map((t) => (
                      <TaskItem 
                        key={t.id} 
                        task={t} 
                        onToggle={handleToggleTask} 
                        onDelete={handleDeleteTask} 
                        onEditClick={setEditingTask} 
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        );

      case 'calendar':
        return (
          <div className="animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin">
            <TaskCalendar 
              tasks={tasks} 
              onToggleTask={handleToggleTask} 
              onSelectDate={() => {}} 
              pages={pages}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        );

      case 'habits':
        // Drill down detail view if activeHabitId is clicked
        if (activeHabit) {
          return (
            <div className="animate-fade-in h-full lg:overflow-hidden min-h-0">
              <HabitDetail
                habit={activeHabit}
                onToggleDate={handleToggleHabitDay}
                onDeleteHabit={handleDeleteHabit}
                onVerifyPhoto={handleVerifyHabitDayWithPhoto}
              />
            </div>
          );
        }

        // Else, render the standard interactive Habits tracker board showing all habits in a 14 day matrix!
        return (
          <div className="animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin">
            <HabitsGrid 
              habits={filteredHabits} 
              onSelectHabit={(id) => {
                setActiveHabitId(id);
              }}
              onCellClick={(habitId, dateStr) => {
                const targetHab = habits.find(h => h.id === habitId);
                if (targetHab) {
                  // Launch popup modal verification
                  setActiveVerModal({ habit: targetHab, dateStr });
                }
              }}
            />
          </div>
        );

      case 'focus':
        return (
          <div className="animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin">
            <FocusRoom />
          </div>
        );

      case 'settings':
        return (
          <div className="animate-fade-in lg:overflow-y-auto h-full pr-1 pb-16 scrollbar-thin">
            <PersonalizationSettings
              accentColor={accentColor}
              setAccentColor={setAccentColor}
              theme={theme}
              setTheme={setTheme}
              animationIntensity={animationIntensity}
              setAnimationIntensity={setAnimationIntensity}
              calendarDensity={calendarDensity}
              setCalendarDensity={setCalendarDensity}
              fontSize={fontSize}
              setFontSize={setFontSize}
              userEmail={currentUser ? currentUser.email : null}
              onLogout={handleCloudLogout}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full min-h-full lg:h-full relative transition-colors duration-1000 ${
      theme === 'dark' ? 'dark text-text-primary' : 'light text-text-primary'
    }`}>
      {/* 0. Cloud Login Page Overlay */}
      <AnimatePresence>
        {!currentUser && !bypassAuth && !authLoading && (
          <LoginPage 
            onSuccess={(user) => {
              setCurrentUser(user);
              showToast(`Welcome back, ${user.displayName || user.email}!`, 'success');
            }}
            onContinueOffline={() => {
              setBypassAuth(true);
              showToast('Running in standalone offline mode', 'info');
            }}
          />
        )}
      </AnimatePresence>

      {/* 1. Animated Mesh backgrounds */}
      <MeshBackground theme={theme} activeColor={activeHabit?.color} />

      {/* 2. Onboarding Slide Wizard */}
      <AnimatePresence>
        {isOnboardingOpen && (
          <OnboardingFlow 
            onClose={() => {
              localStorage.setItem('riseOnboardingComplete', 'true');
              setIsOnboardingOpen(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* 3. Command Spotlight list */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        habits={habits}
        onSelectHabit={(id) => {
          setActiveHabitId(id);
          setActiveView('habits');
        }}
        onAddHabit={() => setIsAddOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onResetData={() => {
          commitAppData(createCleanHabits(), [], INITIAL_PAGES);
        }}
        pages={pages}
        onExecuteNavigation={(view, pageId) => {
          setActiveView(view);
          setActivePageId(pageId);
        }}
        onExecuteAddTask={(task) => {
          handleAddTask(task);
        }}
        onExecuteAddHabit={(habit) => {
          handleCreateHabit(habit);
        }}
      />

      {/* 4. Add Habit Setup dialog */}
      <AddHabitModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleCreateHabit}
      />

      <TaskEditModal
        task={editingTask}
        pages={pages}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTaskEdit}
      />

      {/* 5. Fluid Responsive Application Glass Frame */}
      <div className="w-full min-h-dvh lg:h-dvh flex flex-col lg:flex-row p-2 sm:p-4 lg:p-6 gap-4 lg:overflow-hidden w-full lg:pt-4">
        
        {/* Left Sidebars (3-tier responsive floating drawer) */}
        <Sidebar
          habits={habits}
          activeId={activeHabitId}
          onSelectHabit={(id) => {
            setActiveHabitId(id);
            setMobileSidebarOpen(false);
          }}
          onAddClick={() => setIsAddOpen(true)}
          activeView={activeView}
          onChangeView={(view, pageId) => {
            setActiveView(view);
            setActivePageId(pageId || null);
          }}
          pages={pages}
          onAddPage={handleAddPage}
          onUpdatePage={handleUpdatePage}
          activePageId={activePageId}
          onDeletePage={handleDeletePage}
          onDeleteHabit={handleDeleteHabit}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSearch={() => setIsSearchOpen(true)}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          userEmail={currentUser ? currentUser.email : null}
          onLogout={handleCloudLogout}
        />

        {/* Right Main Detailed Stage Area */}
        <div className="flex-1 flex flex-col gap-4 lg:overflow-hidden h-full lg:min-h-0 min-w-0">
          
          {/* Main Top Header Controls */}
          <header className="flex items-center justify-between bg-glass-bg border border-glass-border rounded-3xl px-5 py-3.5 backdrop-blur-2xl shrink-0">
            <div className="flex items-center gap-3">
              {/* Hamburger Mobile Menu switch */}
              <button
                onClick={() => { playTick(); setMobileSidebarOpen(true); }}
                className="lg:hidden p-2 rounded-xl bg-glass-pill hover:bg-glass-pill-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer border border-glass-border"
                title="Open navigation drawers"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
              
              <div className="hidden lg:flex items-center gap-2 select-none">
                <span className={`w-2.5 h-2.5 rounded-full ${currentUser ? 'bg-emerald-450 animate-pulse' : 'bg-amber-450'}`} />
                <p className="text-[10px] font-bold text-text-tertiary tracking-wider uppercase font-mono">
                  {currentUser ? 'Cloud Node Online (Synced)' : 'Offline Local Sandbox Mode'}
                </p>
              </div>
            </div>

            {/* Authentication Trigger section */}
            <div className="flex items-center gap-3">
              {!currentUser && !authLoading && (
                <button
                  onClick={handleCloudLogin}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold shadow shadow-indigo-600/10 cursor-pointer transition-all"
                  title="Enable real-time synchronization between calendars and devices"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Sync Cloud</span>
                </button>
              )}

              {/* Onboarding trigger */}
              <button
                onClick={() => { playTick(); setIsOnboardingOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-glass-pill hover:bg-glass-pill-hover border border-glass-border text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer transition-all"
                title="View interactive manual"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Manual</span>
              </button>
            </div>
          </header>

          {/* Categories Horizontal tags bar (Filters habits on general tracker screen) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none scrollbar-thin shrink-0 border-b border-glass-border pb-1.5 font-sans">
            {['All', 'Mind', 'Health', 'Fitness', 'Productivity', 'Creative'].map((cat) => {
              const isCatActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    playTick();
                    setActiveCategory(cat);
                    // Open Habits grid if not already open to observe changes
                    if (activeView !== 'habits') {
                      setActiveView('habits');
                      setActiveHabitId(null);
                    }
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full min-w-max transition-all duration-300 outline-none cursor-pointer ${
                    isCatActive
                      ? 'bg-text-primary text-brand-bg shadow-md border-transparent font-bold'
                      : 'bg-glass-pill text-text-secondary border border-glass-border hover:bg-glass-pill-hover hover:text-text-primary'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Central Stage views wrapper */}
          <div className="flex-1 lg:overflow-hidden relative min-h-[500px] lg:min-h-0 pb-12 lg:pb-0">
            {renderWorkspaceCenter()}
          </div>

        </div>

      </div>

      {/* 6. Continuous sliding feedback Snack-alerts notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-[200] max-w-sm px-4.5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : toast.type === 'info'
                ? 'bg-glass-bg border-glass-border text-text-secondary'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            )}
            <p className="text-xs font-semibold font-sans tracking-tight leading-relaxed">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Shared Photo verification popover overlay */}
      <AnimatePresence>
        {activeVerModal && (
          <PhotoVerifierModal 
            isOpen={true}
            onClose={() => setActiveVerModal(null)}
            habit={activeVerModal.habit}
            dateStr={activeVerModal.dateStr}
            onVerified={(hId, dStr, pPhoto, cMsg) => {
              handleVerifyHabitDayWithPhoto(hId, dStr, pPhoto, cMsg);
              setActiveVerModal(null);
            }}
            onQuickLog={(hId, dStr) => {
              handleToggleHabitDay(hId, dStr);
              setActiveVerModal(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
