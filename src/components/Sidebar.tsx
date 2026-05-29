/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Zap, Volume2, VolumeX, Moon, Sun, Search, Sparkles, 
  ChevronUp, ChevronDown, Command, X, Flame, Calendar, CheckSquare, 
  Settings, FolderPlus, LogOut, CheckCircle, Trash2, Compass, Pencil, Check
} from 'lucide-react';
import { Habit, Theme, ActiveView, Page } from '../types';
import { playTick, playSnap } from '../utils/audio';

interface SidebarProps {
  habits: Habit[];
  activeId: string | null;
  onSelectHabit: (id: string | null) => void;
  onAddClick: () => void;
  // Navigation & Page filters
  activeView: ActiveView;
  onChangeView: (view: ActiveView, pageId?: string | null) => void;
  pages: Page[];
  onAddPage: (name: string, icon?: string) => void;
  onUpdatePage: (id: string, updates: Partial<Page>) => void;
  activePageId: string | null;
  onDeletePage: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  // Settings
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  // Optional auth support
  userEmail: string | null;
  onLogout: () => void;
}

export default function Sidebar({
  habits,
  activeId,
  onSelectHabit,
  onAddClick,
  activeView,
  onChangeView,
  pages,
  onAddPage,
  onUpdatePage,
  activePageId,
  onDeletePage,
  onDeleteHabit,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  onOpenSearch,
  isOpenMobile,
  onCloseMobile,
  userEmail,
  onLogout
}: SidebarProps) {
  const [newPageName, setNewPageName] = useState('');
  const [showAddPageInput, setShowAddPageInput] = useState(false);
  const [newPageIcon, setNewPageIcon] = useState('📄');
  const [showNewPageIconPicker, setShowNewPageIconPicker] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');
  const [editingPageIcon, setEditingPageIcon] = useState('📄');

  const pageIcons = [
    '📄', '📝', '✅', '🎯', '📚', '💼', '🏠', '💡', '🚀', '⭐',
    '🔥', '🧠', '💪', '🧘', '🥗', '💧', '🎨', '🎧', '📌', '🗓️',
    '⏰', '📈', '💰', '✈️', '🛒', '🍳', '🏃', '🚲', '🎮', '🎬',
    '📷', '🧪', '🧩', '🔒', '🔖', '🧾', '📦', '🛠️', '🌱', '🌙',
    '☀️', '⚡', '💻', '📱', '🏆', '🎓', '❤️', '🧹', '🧭', '🧿'
  ];

  // Expands sidebar on hover or when clicking the bolt icon to lock it
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('claro_sidebar_locked') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isHovered, setIsHovered] = useState(false);

  const toggleLock = () => {
    const next = !isLocked;
    setIsLocked(next);
    try {
      localStorage.setItem('claro_sidebar_locked', next ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const expanded = isLocked || isHovered;

  const calculateStreak = (habit: Habit) => {
    const sortedDays = [...habit.completedDays].sort((a, b) => b.localeCompare(a));
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
    return streak;
  };

  const handleAddPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim()) return;
    playSnap();
    onAddPage(newPageName.trim(), newPageIcon);
    setNewPageName('');
    setNewPageIcon('📄');
    setShowAddPageInput(false);
    setShowNewPageIconPicker(false);
  };

  const beginPageEdit = (page: Page) => {
    setEditingPageId(page.id);
    setEditingPageName(page.name);
    setEditingPageIcon(page.icon || '📄');
  };

  const savePageEdit = () => {
    if (!editingPageId || !editingPageName.trim()) return;
    playSnap();
    onUpdatePage(editingPageId, {
      name: editingPageName.trim(),
      icon: editingPageIcon
    });
    setEditingPageId(null);
  };

  // Nav Views metadata
  const navItems = [
    { id: 'today', label: 'Today', icon: <CheckCircle className="w-4.5 h-4.5 text-blue-500" /> },
    { id: 'all', label: 'All Tasks', icon: <CheckSquare className="w-4.5 h-4.5 text-purple-500" /> },
    { id: 'habits', label: 'Habit Tracker', icon: <Flame className="w-4.5 h-4.5 text-orange-500" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4.5 h-4.5 text-emerald-500" /> },
    { id: 'focus', label: 'Zen Focus', icon: <Compass className="w-4.5 h-4.5 text-rose-500" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4.5 h-4.5 text-indigo-500 shrink-0" /> },
  ] as const;

  // Fully-expanded sidebar layout content
  const renderExpandedContent = (isMobileLayout: boolean = false) => {
    return (
      <div className="flex flex-col h-full gap-5 font-sans">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <div 
            onClick={() => { playTick(); toggleLock(); }}
            className="flex items-center gap-3 cursor-pointer group/hdr"
            title={isLocked ? "Unlock Sidebar (Auto-collapse)" : "Lock Sidebar Expanded"}
          >
            <div className={`w-10 h-10 rounded-2xl bg-brand-accent flex items-center justify-center shadow-lg shrink-0 transition-transform hover:scale-105 ${isLocked ? 'ring-2 ring-brand-accent ring-offset-[1.5px] ring-offset-[#f4f4f7] dark:ring-offset-[#09090b]' : ''}`}>
              <Zap className="w-5 h-5 text-white fill-white/10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold font-display tracking-tight text-text-primary group-hover/hdr:text-brand-accent transition-colors">Claro</h1>
                <span className={`text-[8.5px] font-bold uppercase font-mono px-1 py-0.5 rounded text-brand-accent border border-brand-accent/20 flex items-center transition-all ${isLocked ? 'opacity-100 bg-brand-accent/5' : 'opacity-25 group-hover/hdr:opacity-100'}`}>
                  {isLocked ? 'Locked' : 'Bolt'}
                </span>
              </div>
              <p className="text-[9px] font-bold text-text-tertiary tracking-wider uppercase font-mono">Pristine Workflow</p>
            </div>
          </div>
          
          {isMobileLayout && (
            <button 
              onClick={onCloseMobile}
              className="p-2 rounded-full hover:bg-glass-pill-hover text-text-secondary hover:text-text-primary border border-glass-border"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic User Profile Indicator if exists */}
        {userEmail && (
          <div className="flex items-center justify-between p-3.5 bg-glass-pill border border-glass-border/60 rounded-2xl shadow-sm shrink-0">
            <div className="flex-1 min-w-0 pr-1 select-none">
              <p className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-widest leading-none">Cloud Sync Live</p>
              <p className="text-xs font-bold text-text-primary truncate mt-1 leading-none">{userEmail}</p>
            </div>
            <button
              onClick={() => { playSnap(); onLogout(); }}
              className="p-2 text-text-tertiary hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 rounded-xl"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Command Spotlight activation */}
        <button
          onClick={() => { playTick(); onOpenSearch(); }}
          className="w-full shrink-0 h-11 flex items-center justify-between text-left text-xs bg-glass-pill hover:bg-glass-pill-hover border border-glass-border rounded-xl px-4 py-3 text-text-tertiary hover:text-text-secondary transition-all cursor-pointer font-sans"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-text-quaternary" />
            <span>Spotlight Actions...</span>
          </div>
          <div className="flex items-center gap-0.5 bg-glass-pill border border-glass-border px-1.5 py-0.5 rounded font-mono text-[9px] text-text-tertiary font-bold select-none">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>

        {/* Scrollable Navigation section */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin">
          
          {/* Main Navigation Views */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id && activePageId === null;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playTick();
                    onSelectHabit(null);
                    onChangeView(item.id as ActiveView, null);
                    if (isMobileLayout) onCloseMobile();
                  }}
                  className={`relative w-full text-left p-3 flex items-center gap-3.5 hover:bg-glass-pill/20 rounded-xl transition-all cursor-pointer select-none leading-none`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-nav-highlight"
                      className="absolute inset-0 bg-glass-pill-hover rounded-xl border border-glass-border"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 shrink-0">{item.icon}</span>
                  <span className={`relative z-10 text-xs font-semibold tracking-tight transition-all ${
                    isActive ? 'text-text-primary font-bold' : 'text-text-secondary'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notion Style Pages section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[9px] font-bold text-text-tertiary tracking-widest uppercase font-mono">My Notion Pages</span>
              <button
                onClick={() => { playTick(); setShowAddPageInput(!showAddPageInput); }}
                className="p-1 text-text-tertiary hover:text-text-primary hover:bg-glass-pill border border-transparent rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input Form overlay for quick page addition */}
            <AnimatePresence>
              {showAddPageInput && (
                <motion.form 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleAddPageSubmit}
                  className="px-2 shrink-0 py-2 bg-glass-pill/40 border border-glass-border rounded-2xl space-y-2 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { playTick(); setShowNewPageIconPicker(!showNewPageIconPicker); }}
                      className="w-8 h-8 rounded-xl bg-glass-bg border border-glass-border flex items-center justify-center text-base hover:bg-glass-pill-hover cursor-pointer"
                      title="Choose page icon"
                    >
                      {newPageIcon}
                    </button>
                    <input
                      type="text"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      placeholder="Page title..."
                      className="min-w-0 flex-1 bg-transparent border-none text-xs font-semibold text-text-primary placeholder-text-tertiary focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newPageName.trim()}
                      className="p-1.5 rounded-lg bg-text-primary text-brand-bg disabled:opacity-50"
                      title="Create page"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {showNewPageIconPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-10 gap-1 max-h-24 overflow-y-auto pr-1 scrollbar-thin border-t border-glass-border/30 pt-2"
                    >
                      {pageIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => {
                            setNewPageIcon(icon);
                            setShowNewPageIconPicker(false);
                            playTick();
                          }}
                          className={`h-6 rounded-md text-sm flex items-center justify-center border ${
                            newPageIcon === icon
                              ? 'bg-text-primary text-brand-bg border-transparent'
                              : 'bg-glass-bg border-glass-border hover:bg-glass-pill-hover'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-0.5">
              {pages.map((p) => {
                const isActive = activePageId === p.id;
                const isEditing = editingPageId === p.id;
                return (
                  <div
                    key={p.id}
                    className="group/page relative flex items-center justify-between"
                  >
                    {isEditing ? (
                      <div className="w-full p-2 rounded-2xl bg-glass-pill border border-glass-border space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base shrink-0">{editingPageIcon}</span>
                          <input
                            value={editingPageName}
                            onChange={(e) => setEditingPageName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePageEdit();
                              if (e.key === 'Escape') setEditingPageId(null);
                            }}
                            className="min-w-0 flex-1 bg-transparent border-none text-xs font-semibold text-text-primary placeholder-text-tertiary focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={savePageEdit}
                            className="p-1.5 rounded-lg bg-text-primary text-brand-bg"
                            title="Save page"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-10 gap-1 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
                          {pageIcons.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => setEditingPageIcon(icon)}
                              className={`h-6 rounded-md text-sm flex items-center justify-center border ${
                                editingPageIcon === icon
                                  ? 'bg-text-primary text-brand-bg border-transparent'
                                  : 'bg-glass-bg border-glass-border hover:bg-glass-pill-hover'
                              }`}
                              title={`Use ${icon}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          playTick();
                          onSelectHabit(null);
                          onChangeView('page', p.id);
                          if (isMobileLayout) onCloseMobile();
                        }}
                        className="relative flex-1 text-left p-3 flex items-center gap-3 hover:bg-glass-pill/10 rounded-xl transition-all cursor-pointer overflow-hidden leading-none"
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-glass-pill-hover border border-glass-border rounded-xl" />
                        )}
                        <span className="relative z-10 text-base">{p.icon || '📄'}</span>
                        <span className={`relative z-10 text-xs font-semibold truncate ${isActive ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>
                          {p.name}
                        </span>
                      </button>
                    )}

                    {!isEditing && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTick();
                            beginPageEdit(p);
                          }}
                          className="absolute right-9 opacity-0 group-hover/page:opacity-100 p-1 bg-glass-pill hover:bg-glass-pill-hover border border-glass-border text-text-tertiary hover:text-text-primary rounded-lg shrink-0 transition-opacity"
                          title="Edit page"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSnap();
                            onDeletePage(p.id);
                          }}
                          className="absolute right-2 opacity-0 group-hover/page:opacity-100 p-1 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 hover:text-red-400 rounded-lg shrink-0 transition-opacity"
                          title="Delete page"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emojis selection for active habits */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[9px] font-bold text-text-tertiary tracking-widest uppercase font-mono">Quick Access Routines</span>
            </div>
            
            <div className="space-y-0.5">
              {habits.map((h) => {
                const isActive = activeId === h.id;
                const streakCount = calculateStreak(h);
                return (
                  <div
                    key={h.id}
                    className="group/habit relative flex items-center justify-between"
                  >
                    <button
                      onClick={() => {
                        playTick();
                        onSelectHabit(h.id);
                        onChangeView('habits', null);
                        if (isMobileLayout) onCloseMobile();
                      }}
                      className="relative flex-1 text-left p-2.5 flex items-center gap-3 hover:bg-glass-pill/10 rounded-xl transition-all cursor-pointer leading-none"
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-glass-pill-hover border border-glass-border rounded-xl" />
                      )}
                      
                      <div 
                        className="relative z-10 w-7.5 h-7.5 rounded-lg flex items-center justify-center text-sm shadow shrink-0"
                        style={{ backgroundColor: `${h.color}15` }}
                      >
                        <span>{h.emoji}</span>
                      </div>

                      <div className="relative z-10 flex-1 min-w-0 pr-8">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>
                          {h.name}
                        </p>
                      </div>

                      {streakCount > 0 && (
                        <span className="relative z-10 text-[9px] font-bold text-orange-400 font-mono flex items-center gap-0.5 group-hover/habit:opacity-0 transition-opacity">
                          <Flame className="w-2.5 h-2.5 fill-orange-400/20" />
                          <span>{streakCount}d</span>
                        </span>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSnap();
                        onDeleteHabit(h.id);
                      }}
                      className="absolute right-2 opacity-0 group-hover/habit:opacity-100 p-1 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 hover:text-red-400 rounded-lg shrink-0 transition-opacity z-20"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer controls: Sounds, Theme, Add Routine */}
        <div className="pt-3 border-t border-glass-border shrink-0 flex flex-col gap-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              {/* Sound toggling */}
              <button
                onClick={() => { onToggleSound(); playTick(); }}
                className="p-2 rounded-xl bg-glass-pill hover:bg-glass-pill-hover text-text-tertiary hover:text-text-primary cursor-pointer border border-glass-border"
                title={soundEnabled ? "Disable tactile noises" : "Enable tactile clicks"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-450 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Theme switching */}
              <button
                onClick={() => { onToggleTheme(); playTick(); }}
                className="p-2 rounded-xl bg-glass-pill hover:bg-glass-pill-hover text-text-tertiary hover:text-text-primary cursor-pointer border border-glass-border"
                title={`Switch Theme`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            <span className="text-[9px] font-mono text-text-tertiary font-bold">CLARO v1.5</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { playTick(); onAddClick(); }}
            className="w-full py-3 bg-text-primary text-brand-bg font-bold rounded-2xl text-xs hover:opacity-90 cursor-pointer shadow-lg tracking-wide border border-glass-border/12 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Habit</span>
          </motion.button>
        </div>
      </div>
    );
  };

  // 2. MINI COMPACT RAIL LAYOUT CONTENT (For Tablet medium screens)
  const renderCompactContent = () => {
    return (
      <div className="flex flex-col h-full items-center justify-between font-sans relative">
        
        {/* Compact Brands Logo */}
        <div className="flex flex-col gap-5 items-center w-full">
          <div 
            onClick={() => { playTick(); toggleLock(); }}
            className={`w-10 h-10 rounded-2xl bg-brand-accent flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform ${isLocked ? 'ring-2 ring-brand-accent ring-offset-[1.5px] ring-offset-[#f4f4f7] dark:ring-offset-[#09090b]' : ''}`}
            title={isLocked ? "Unlock Sidebar" : "Lock Sidebar Expanded"}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>

          <button
            onClick={() => { playTick(); onOpenSearch(); }}
            className="w-10 h-10 rounded-xl bg-glass-pill border border-glass-border flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer"
            title="Search command list"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Navigation Items lists */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-4 py-8 scrollbar-none">
          
          {/* Main views */}
          <div className="flex flex-col gap-2 items-center w-full">
            {navItems.map((item) => {
              const isActive = activeView === item.id && activePageId === null;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playTick();
                    onSelectHabit(null);
                    onChangeView(item.id as ActiveView, null);
                  }}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-glass-pill/25 ${
                    isActive ? 'bg-glass-pill-hover border border-glass-border' : ''
                  }`}
                  title={item.label}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>

          {/* Notion pages separator emoji dot lists */}
          {pages.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-glass-border/30 pt-4 w-full items-center">
              {pages.map((p) => {
                const isActive = activePageId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      playTick();
                      onSelectHabit(null);
                      onChangeView('page', p.id);
                    }}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:bg-glass-pill/10 ${
                      isActive ? 'bg-glass-pill-hover border border-glass-border' : ''
                    }`}
                    title={p.name}
                  >
                    <span className="text-sm">{p.icon || '📄'}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active habits selection dots */}
          {habits.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-glass-border/30 pt-4 w-full items-center">
              {habits.map((h) => {
                const isActive = activeId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      playTick();
                      onSelectHabit(h.id);
                      onChangeView('habits', null);
                    }}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      isActive ? 'border border-glass-border' : ''
                    }`}
                    style={{ backgroundColor: `${h.color}15` }}
                    title={h.name}
                  >
                    <span className="text-base select-none">{h.emoji}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer toggles list vertically stacked */}
        <div className="flex flex-col gap-3 items-center w-full pt-4 border-t border-glass-border/40 shrink-0">
          
          {/* Sounds switch */}
          <button
            onClick={() => { onToggleSound(); playTick(); }}
            className="w-9 h-9 rounded-xl bg-glass-pill hover:bg-glass-pill-hover text-text-tertiary flex items-center justify-center cursor-pointer border border-glass-border"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Switcher badge */}
          <button
            onClick={() => { onToggleTheme(); playTick(); }}
            className="w-9 h-9 rounded-xl bg-glass-pill hover:bg-glass-pill-hover text-text-tertiary flex items-center justify-center cursor-pointer border border-glass-border"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout if authenticated */}
          {userEmail && (
            <button
              onClick={() => { playSnap(); onLogout(); }}
              className="w-9 h-9 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 flex items-center justify-center cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Quick add routine trigger */}
          <button
            onClick={() => { playTick(); onAddClick(); }}
            className="w-10 h-10 rounded-xl bg-text-primary text-brand-bg flex items-center justify-center shadow hover:opacity-90 cursor-pointer"
            title="Create routine habit"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

      </div>
    );
  };

  return (
    <>
      {/* Spacer container to hold layout footprint so content doesn't shift on hover */}
      <motion.div
        animate={{ width: isLocked ? 288 : 80 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="hidden lg:block h-full shrink-0 relative z-30"
      >
        {/* 1 & 2. MORPHING GLASS SIDEBAR FOR TABLET & DESKTOP (Width adjusts reactively on hover or click lock) */}
        <motion.aside
          initial={{ x: -85, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1, 
            width: expanded ? 288 : 80 
          }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="absolute top-0 left-0 h-full bg-glass-bg border border-glass-border rounded-[32px] p-5 shadow-2xl select-none overflow-hidden backdrop-blur-2xl z-30 flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl bg-purple-550/5 pointer-events-none -z-10" />
          
          {/* Render content based on dynamic expansion width */}
          <div className="flex flex-col h-full w-full overflow-hidden">
            {expanded ? renderExpandedContent() : renderCompactContent()}
          </div>
        </motion.aside>
      </motion.div>

      {/* 3. MOBILE FULL DRAWERS COLOURED (Overlay sheet) */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-[150] lg:hidden flex justify-start">
            {/* Backdrop Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Expanded Content Board drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 380, damping: 29 }}
              className="relative w-80 h-full max-w-[85vw] bg-brand-bg/97 border-r border-glass-border p-5 flex flex-col shadow-2xl z-10 select-none pb-safe pt-safe"
            >
              {renderExpandedContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
