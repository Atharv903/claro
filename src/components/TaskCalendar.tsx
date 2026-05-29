/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock, Plus, Tag, AlertTriangle, Trash2 } from 'lucide-react';
import { Task, Page } from '../types';
import { playTick, playSnap, playSuccessChime } from '../utils/audio';
import { useRippleOrigin } from '../utils/ripple';

interface TaskCalendarProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onSelectDate: (dateStr: string) => void;
  pages: Page[];
  onAddTask: (taskData: Omit<Task, 'id' | 'done' | 'createdAt'>) => void;
  onUpdateTask: (id: string, updatedFields: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskCalendar({
  tasks,
  onToggleTask,
  pages,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TaskCalendarProps) {
  const [calView, setCalView] = useState<'month' | 'week' | 'year'>('month');
  const [calDate, setCalDate] = useState<Date>(new Date());
  const [activeDayModal, setActiveDayModal] = useState<{
    date: Date;
    tasks: Task[];
  } | null>(null);
  
  // State for creating event directly from weekly block clicks or drags
  const [createEventModal, setCreateEventModal] = useState<{
    id?: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    hour?: number;
  } | null>(null);

  // Inland helpers for creation
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventPriority, setNewEventPriority] = useState<Task['priority']>(null);
  const [newEventPageId, setNewEventPageId] = useState<string | null>(null);
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventColor, setNewEventColor] = useState('#3b82f6');
  const [newEventRecurrence, setNewEventRecurrence] = useState<'none' | 'daily' | 'weekly'>('none');
  const [newEventStartTime, setNewEventStartTime] = useState('08:00');
  const [newEventEndTime, setNewEventEndTime] = useState('09:00');

  // Dragging and resizing states for 60FPS fluid interactions
  const [dragStart, setDragStart] = useState<{ date: string; hour: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ date: string; hour: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [resizeTask, setResizeTask] = useState<{ id: string; edge: 'top' | 'bottom'; date: string; initialHour: number } | null>(null);
  const [movingTaskOverrides, setMovingTaskOverrides] = useState<Record<string, { time: string; endTime: string }>>({});

  // Decimal time conversion formulas
  const timeToDecimal = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  };

  const decimalToTime = (dec: number): string => {
    let h = Math.floor(dec);
    let m = Math.round((dec - h) * 60);
    if (m >= 60) {
      h += 1;
      m = 0;
    }
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Click-relative ripple origin containers
  const createEventContainerRef = useRef<HTMLDivElement>(null);
  const createEventOrigin = useRippleOrigin(createEventContainerRef);

  const dayModalContainerRef = useRef<HTMLDivElement>(null);
  const dayModalOrigin = useRippleOrigin(dayModalContainerRef);

  // Monitor layout open/closes and pre-fill fields for precise edits
  useEffect(() => {
    if (createEventModal) {
      if (createEventModal.id) {
        const t = tasks.find((x) => x.id === createEventModal.id);
        if (t) {
          setNewEventTitle(t.title);
          setNewEventPriority(t.priority);
          setNewEventPageId(t.pageId);
          setNewEventNotes(t.notes || '');
          setNewEventColor(t.color || '#3b82f6');
          setNewEventRecurrence(t.recurrence || 'none');
          setNewEventStartTime(t.time || '08:00');
          setNewEventEndTime(t.endTime || '09:00');
        }
      } else {
        setNewEventTitle('');
        setNewEventPriority('medium');
        setNewEventPageId(null);
        setNewEventNotes('');
        setNewEventColor('#3b82f6');
        setNewEventRecurrence('none');
        
        const defaultStart = createEventModal.startTime || (createEventModal.hour !== undefined ? `${createEventModal.hour.toString().padStart(2, '0')}:00` : '08:00');
        const defaultEnd = createEventModal.endTime || (createEventModal.hour !== undefined ? `${(createEventModal.hour + 1).toString().padStart(2, '0')}:00` : '09:00');
        setNewEventStartTime(defaultStart);
        setNewEventEndTime(defaultEnd);
      }
    }
  }, [createEventModal, tasks]);

  // Helper to isolate tasks for a specific date in standard toDateString
  const getTasksForDate = (d: Date): Task[] => {
    const ds = d.toDateString();
    return tasks.filter((t) => t.date === ds);
  };

  const navDate = (dir: number) => {
    playTick();
    const newDate = new Date(calDate);
    if (calView === 'month') {
      newDate.setMonth(calDate.getMonth() + dir);
    } else if (calView === 'week') {
      newDate.setDate(calDate.getDate() + dir * 7);
    } else if (calView === 'year') {
      newDate.setFullYear(calDate.getFullYear() + dir);
    }
    setCalDate(newDate);
  };

  const goToday = () => {
    playTick();
    setCalDate(new Date());
  };

  const handleDaySelect = (year: number, month: number, day: number) => {
    playTick();
    const d = new Date(year, month, day);
    const dayTasks = getTasksForDate(d);
    setActiveDayModal({ date: d, tasks: dayTasks });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr);
    const m = parseInt(mStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${ampm}`;
  };

  // 1. MONTH VIEW
  const renderMonth = () => {
    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const today = new Date();
    
    const firstDayIndex = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cells = [];

    // Prev Month Overhang
    for (let i = 0; i < firstDayIndex; i++) {
      const pd = daysInPrevMonth - firstDayIndex + 1 + i;
      cells.push({
        dayNumber: pd,
        isCurrentMonth: false,
        date: new Date(y, m - 1, pd),
      });
    }

    // Current Month Real Days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        dayNumber: d,
        isCurrentMonth: true,
        date: new Date(y, m, d),
      });
    }

    // Next Month Overhang
    let colIndex = cells.length % 7;
    if (colIndex > 0) {
      for (let next = 1; next <= (7 - colIndex); next++) {
        cells.push({
          dayNumber: next,
          isCurrentMonth: false,
          date: new Date(y, m + 1, next),
        });
      }
    }

    // Partition cells into weeks
    const weeksList = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeksList.push(cells.slice(i, i + 7));
    }

    return (
      <div className="w-full overflow-hidden bg-glass-bg border border-glass-border rounded-3xl p-4 sm:p-5 shadow-xl animate-fade-in">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {dows.map((dw) => (
                <th key={dw} className="pb-3 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary w-[14.2%] px-2">
                  {dw}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeksList.map((week, wkIdx) => (
              <tr key={wkIdx}>
                {week.map((cell, cIdx) => {
                  const dayTasks = getTasksForDate(cell.date);
                  const isToday = cell.date.toDateString() === today.toDateString();
                  const showCountNum = 3;
                  const slicedTasks = dayTasks.slice(0, showCountNum);
                  const overflowCount = dayTasks.length - showCountNum;

                  return (
                    <td
                      key={cIdx}
                      onClick={() => {
                        playTick();
                        setCalDate(cell.date);
                        setCalView('week');
                      }}
                      className={`h-24 sm:h-28 vertical-align-top border border-glass-border/40 p-2 text-left cursor-pointer transition-all hover:bg-glass-pill-hover relative ${
                        cell.isCurrentMonth ? 'bg-glass-pill/20' : 'bg-transparent opacity-35'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono font-bold flex items-center justify-center rounded-full ${
                          isToday 
                            ? 'w-6 h-6 bg-text-primary text-brand-bg font-bold shadow' 
                            : 'text-text-secondary'
                        }`}>
                          {cell.dayNumber}
                        </span>
                      </div>

                      {/* Chips block */}
                      <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                        {slicedTasks.map((t) => {
                          const prioColors = {
                            high: 'border-l-2 border-red-500 bg-red-500/10 text-red-400',
                            medium: 'border-l-2 border-amber-500 bg-amber-500/10 text-amber-400',
                            low: 'border-l-2 border-emerald-500 bg-emerald-500/10 text-emerald-400',
                          };
                          const pClass = t.priority ? prioColors[t.priority] : 'border-l-2 border-glass-border bg-glass-pill text-text-secondary';
                          return (
                            <div 
                              key={t.id} 
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate tracking-normal truncate ${pClass}`}
                            >
                              {t.title}
                            </div>
                          );
                        })}
                        {overflowCount > 0 && (
                          <div className="text-[8px] font-bold text-text-tertiary pl-1 mt-0.5 uppercase tracking-wide">
                            +{overflowCount} more
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 2. WEEK VIEW
  const handleResizeStart = (
    taskId: string,
    edge: 'top' | 'bottom',
    dateStr: string,
    tTime: string,
    tEndTime: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const HOUR_HEIGHT = 60;
    const startDec = timeToDecimal(tTime);
    const endDec = timeToDecimal(tEndTime);
    
    const startY = event.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const hourChange = deltaY / HOUR_HEIGHT;
      // Snap to 15m (0.25 decimals)
      const snappedHourChange = Math.round(hourChange * 4) / 4;
      
      if (edge === 'top') {
        let newStart = startDec + snappedHourChange;
        // Clamp bounds: 6 AM to (endTime - 15 mins)
        newStart = Math.max(6, Math.min(endDec - 0.25, newStart));
        setMovingTaskOverrides((prev) => ({
          ...prev,
          [taskId]: {
            time: decimalToTime(newStart),
            endTime: decimalToTime(endDec)
          }
        }));
      } else {
        let newEnd = endDec + snappedHourChange;
        // Clamp bounds: (startTime + 15 mins) to 23 (11 PM)
        newEnd = Math.max(startDec + 0.25, Math.min(23, newEnd));
        setMovingTaskOverrides((prev) => ({
          ...prev,
          [taskId]: {
            time: decimalToTime(startDec),
            endTime: decimalToTime(newEnd)
          }
        }));
      }
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      setMovingTaskOverrides((prev) => {
        const finalVals = prev[taskId];
        if (finalVals) {
          onUpdateTask(taskId, {
            time: finalVals.time,
            endTime: finalVals.endTime
          });
        }
        return prev;
      });
      setResizeTask(null);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleColumnMouseDown = (dateStr: string, event: React.MouseEvent<HTMLDivElement>) => {
    // If user clicked standard elements like task items or checklist checkboxes, ignore column drag!
    if ((event.target as HTMLElement).closest('.task-block-item')) return;
    
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const HOUR_HEIGHT = 60;
    const startY = event.clientY - rect.top;
    
    let rawHour = 6 + (startY / HOUR_HEIGHT);
    // snap to 15m
    rawHour = Math.round(rawHour * 4) / 4;
    // clamp
    rawHour = Math.max(6, Math.min(22.75, rawHour));
    
    setDragStart({ date: dateStr, hour: rawHour });
    setDragCurrent({ date: dateStr, hour: rawHour + 1 }); // default 1h
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentY = moveEvent.clientY - rect.top;
      let currentHour = 6 + (currentY / HOUR_HEIGHT);
      currentHour = Math.round(currentHour * 4) / 4;
      currentHour = Math.max(6, Math.min(23, currentHour));
      
      setDragCurrent({ date: dateStr, hour: currentHour });
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
      
      setDragStart((startVal) => {
        setDragCurrent((currVal) => {
          if (startVal && currVal) {
            const minHour = Math.min(startVal.hour, currVal.hour);
            const maxHour = Math.max(startVal.hour, currVal.hour);
            
            if (maxHour - minHour >= 0.25) {
              playTick();
              setCreateEventModal({
                date: new Date(startVal.date),
                startTime: decimalToTime(minHour),
                endTime: decimalToTime(maxHour)
              });
            }
          }
          return null;
        });
        return null;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(calDate);
    startOfWeek.setDate(calDate.getDate() - calDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
    const HOUR_HEIGHT = 60;

    return (
      <div className="w-full bg-glass-bg border border-glass-border rounded-[32px] p-4 sm:p-6 shadow-xl flex flex-col h-[700px] overflow-hidden animate-fade-in relative">
        
        {/* Day label headers bar */}
        <div className="flex border-b border-glass-border/40 pb-3 pl-14 select-none">
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} className="flex-1 text-center flex flex-col items-center">
                <span className="text-[10px] font-mono tracking-widest text-text-tertiary uppercase block">
                  {d.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`inline-flex items-center justify-center text-xs font-bold mt-1 font-mono rounded-full w-6 h-6 ${
                  isToday ? 'bg-text-primary text-brand-bg font-extrabold shadow-lg shadow-text-primary/10' : 'text-text-primary'
                }`}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scrollable multi-hour canvas area */}
        <div className="flex-1 overflow-y-auto scrollbar-none relative pr-1 pt-2">
          
          {/* Background grid lines graticules */}
          <div className="absolute inset-0 left-14 pointer-events-none z-0">
            {hours.map((hr, idx) => (
              <div 
                key={hr} 
                className="absolute left-0 right-0 border-t border-glass-border/15"
                style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              />
            ))}
          </div>

          {/* Interactive Absolute columns layout */}
          <div className="flex relative" style={{ height: `${18 * HOUR_HEIGHT}px` }}>
            
            {/* Left Hours indices labels column */}
            <div className="w-14 shrink-0 font-mono text-[9px] font-bold text-text-tertiary select-none relative">
              {hours.map((hr, idx) => {
                const dispHr = hr % 12 || 12;
                const ampm = hr >= 12 ? 'PM' : 'AM';
                return (
                  <div 
                    key={hr} 
                    className="absolute right-3 transform -translate-y-1/2"
                    style={{ top: `${idx * HOUR_HEIGHT}px` }}
                  >
                    {dispHr} {ampm}
                  </div>
                );
              })}
            </div>

            {/* Columns content viewport */}
            {weekDays.map((d, dIdx) => {
              const dateStr = d.toDateString();
              const dayTasks = tasks.filter((t) => t.date === dateStr && t.time);
              const isDraggingThisColumn = isDragging && dragStart?.date === dateStr;

              return (
                <div
                  key={dIdx}
                  onMouseDown={(e) => handleColumnMouseDown(dateStr, e)}
                  className="flex-1 h-full border-r last:border-r-0 border-glass-border/20 bg-glass-pill/5 hover:bg-glass-pill/10 transition-colors relative cursor-crosshair group"
                >
                  
                  {/* Map existing task modules */}
                  {dayTasks.map((t) => {
                    const override = movingTaskOverrides[t.id];
                    const startTimeStr = override?.time || t.time || '08:00';
                    const endTimeStr = override?.endTime || t.endTime || decimalToTime(timeToDecimal(startTimeStr) + 1.0);
                    
                    const decStart = timeToDecimal(startTimeStr);
                    const decEnd = timeToDecimal(endTimeStr);
                    
                    const topVal = (decStart - 6) * HOUR_HEIGHT;
                    const heightVal = Math.max(26, (decEnd - decStart) * HOUR_HEIGHT);

                    // Grab color/theme configs
                    const isHigh = t.priority === 'high';
                    const isMedium = t.priority === 'medium';
                    const colorHex = t.color || (
                      isHigh ? '#ff453a' : isMedium ? '#ff9f0a' : '#0a84ff'
                    );

                    const resolvedOpacity = t.done ? 'opacity-45 line-through' : '';

                    return (
                      <div
                        key={t.id}
                        id={`task-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTick();
                          setCreateEventModal({
                            id: t.id,
                            date: d,
                            startTime: startTimeStr,
                            endTime: endTimeStr
                          });
                        }}
                        className={`task-block-item absolute left-1.5 right-1.5 rounded-2xl p-2 select-none border-t border-b hover:shadow-xl hover:scale-[1.01] transition-all overflow-hidden cursor-pointer flex flex-col justify-between ${resolvedOpacity}`}
                        style={{
                          top: `${topVal}px`,
                          height: `${heightVal}px`,
                          backgroundColor: `${colorHex}15`,
                          borderColor: colorHex,
                          boxShadow: `inset 0 0 12px ${colorHex}10`
                        }}
                        title={`${t.title} (${startTimeStr} - ${endTimeStr})`}
                      >
                        {/* Top vertical resize handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(t.id, 'top', dateStr, startTimeStr, endTimeStr, e)}
                          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-white/20 z-20"
                        />

                        {/* Bullet left border strip */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                          style={{ backgroundColor: colorHex }}
                        />

                        {/* Title details & checklist state triggers */}
                        <div className="pl-1 h-full flex flex-col justify-start text-left text-text-primary min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={t.done}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                onToggleTask(t.id);
                              }}
                              className="w-3.5 h-3.5 rounded-md border-glass-border focus:ring-0 focus:ring-offset-0 bg-transparent text-brand-primary cursor-pointer shrink-0"
                              style={{ accentColor: colorHex }}
                            />
                            <p 
                              className="text-[10px] font-extrabold truncate leading-none"
                              style={{ color: colorHex }}
                            >
                              {t.title}
                            </p>
                          </div>

                          {heightVal >= 42 && (
                            <div className="flex items-center gap-1 text-[8px] font-mono font-bold mt-1.5 opacity-80" style={{ color: colorHex }}>
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span>{startTimeStr} - {endTimeStr}</span>
                            </div>
                          )}

                          {heightVal >= 65 && t.notes && (
                            <p className="text-[8px] leading-tight opacity-75 italic font-medium mt-1 select-text line-clamp-2 max-w-full" style={{ color: colorHex }}>
                              {t.notes}
                            </p>
                          )}
                        </div>

                        {/* Bottom vertical resize handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(t.id, 'bottom', dateStr, startTimeStr, endTimeStr, e)}
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-white/20 z-20"
                        />
                      </div>
                    );
                  })}

                  {/* Drag-to-create preview overlays */}
                  {isDraggingThisColumn && dragStart && dragCurrent && (
                    (() => {
                      const minH = Math.min(dragStart.hour, dragCurrent.hour);
                      const maxH = Math.max(dragStart.hour, dragCurrent.hour);
                      const topVal = (minH - 6) * HOUR_HEIGHT;
                      const heightVal = (maxH - minH) * HOUR_HEIGHT;
                      
                      if (heightVal <= 0) return null;

                      return (
                        <div 
                          className="absolute left-1 right-1 rounded-2xl bg-indigo-500/25 border-2 border-dashed border-indigo-400 z-10 flex flex-col justify-center items-center font-mono pointer-events-none"
                          style={{ top: `${topVal}px`, height: `${heightVal}px` }}
                        >
                          <span className="text-[9px] font-bold text-indigo-350">
                            {decimalToTime(minH)} - {decimalToTime(maxH)}
                          </span>
                          <span className="text-[8px] text-indigo-400">
                            ({Math.round((maxH - minH) * 60)}m block)
                          </span>
                        </div>
                      );
                    })()
                  )}

                </div>
              );
            })}

          </div>
        </div>
      </div>
    );
  };

  // 3. YEAR VIEW
  const renderYear = () => {
    const today = new Date();
    const currentYear = calDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
        {months.map((m) => {
          const mDate = new Date(currentYear, m, 1);
          const monthName = mDate.toLocaleDateString('en-US', { month: 'short' });
          const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
          const firstDay = new Date(currentYear, m, 1).getDay();

          const dayCells = [];
          for (let b = 0; b < firstDay; b++) dayCells.push(null);
          for (let d = 1; d <= daysInMonth; d++) dayCells.push(d);

          return (
            <div
              key={m}
              onClick={() => {
                playTick();
                const updatedDate = new Date(calDate);
                updatedDate.setMonth(m);
                setCalDate(updatedDate);
                setCalView('month');
              }}
              className="bg-glass-bg border border-glass-border hover:border-text-quaternary rounded-3xl p-4 cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-text-secondary mb-3 pl-1">
                {monthName}
              </div>
              
              <div className="grid grid-cols-7 gap-1 font-mono">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dw) => (
                  <div key={dw} className="text-center text-[7px] font-bold text-text-tertiary select-none">
                    {dw}
                  </div>
                ))}
                
                {dayCells.map((dayNum, dcIdx) => {
                  if (dayNum === null) return <div key={dcIdx} />;
                  const dateObj = new Date(currentYear, m, dayNum);
                  const isToday = dateObj.toDateString() === today.toDateString();
                  const dateTasks = getTasksForDate(dateObj);
                  const hasTasks = dateTasks.length > 0;

                  return (
                    <div
                      key={dcIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        playTick();
                        setCalDate(new Date(currentYear, m, dayNum));
                        setCalView('month');
                      }}
                      className={`aspect-square flex items-center justify-center text-[8px] font-medium rounded-full relative leading-none cursor-pointer ${
                        isToday 
                          ? 'bg-text-primary text-brand-bg font-extrabold shadow' 
                          : 'text-text-secondary hover:bg-glass-pill hover:text-text-primary'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasTasks && !isToday && (
                        <span className="absolute bottom-0 w-1 h-1 rounded-full bg-text-tertiary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getTitleString = () => {
    if (calView === 'month') {
      return calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (calView === 'week') {
      const start = new Date(calDate);
      start.setDate(calDate.getDate() - calDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return `${calDate.getFullYear()}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action controls of the calendar view */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 pb-1">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navDate(-1)}
              className="p-1.5 rounded-xl bg-glass-pill hover:bg-glass-pill-hover border border-glass-border text-text-secondary hover:text-text-primary cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navDate(1)}
              className="p-1.5 rounded-xl bg-glass-pill hover:bg-glass-pill-hover border border-glass-border text-text-secondary hover:text-text-primary cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-base sm:text-lg font-bold font-display text-text-primary">
            {getTitleString()}
          </span>
          <button
            onClick={goToday}
            className="px-3 py-1 bg-glass-pill hover:bg-glass-pill-hover border border-glass-border text-[10px] font-mono tracking-wider font-semibold rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-all ml-1.5"
          >
            TODAY
          </button>
        </div>

        {/* View segmented control */}
        <div className="flex items-center p-0.5 bg-glass-pill border border-glass-border rounded-xl">
          {([
            { id: 'month', label: 'Month' },
            { id: 'week', label: 'Week' },
            { id: 'year', label: 'Year' }
          ] as const).map((vt) => {
            const active = calView === vt.id;
            return (
              <button
                key={vt.id}
                onClick={() => {
                  playTick();
                  setCalView(vt.id);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active 
                    ? 'bg-text-primary text-brand-bg font-bold shadow' 
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {vt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render selected view */}
      {calView === 'month' && renderMonth()}
      {calView === 'week' && renderWeek()}
      {calView === 'year' && renderYear()}

      {/* PopUp Day Detail Checklist Drawer */}
      <AnimatePresence>
        {activeDayModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => { playTick(); setActiveDayModal(null); }} />
            <motion.div
              ref={dayModalContainerRef}
              initial={{ scale: 0.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.15, opacity: 0 }}
              style={{ transformOrigin: dayModalOrigin }}
              transition={{ type: "spring", stiffness: 440, damping: 30 }}
              className="relative w-full max-w-sm bg-glass-bg border border-glass-border rounded-3xl p-5 shadow-2xl z-10 text-text-primary font-sans max-h-[80vh] overflow-y-auto scrollbar-none"
            >
              <div className="flex items-center justify-between mb-4 border-b border-glass-border pb-3">
                <h3 className="text-base font-bold font-display tracking-tight text-text-primary">
                  {activeDayModal.date.toLocaleDateString('en-US', { weekday: 'medium', month: 'short', day: 'numeric' })}
                </h3>
                <button
                  type="button"
                  onClick={() => { playTick(); setActiveDayModal(null); }}
                  className="w-7 h-7 rounded-full bg-glass-pill border border-glass-border text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer hover:bg-glass-pill-hover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeDayModal.tasks.length === 0 ? (
                <p className="text-xs text-text-tertiary text-center py-6">
                  No tasks scheduled for this day
                </p>
              ) : (
                <div className="space-y-3">
                  {activeDayModal.tasks.map((t) => (
                    <div 
                      key={t.id} 
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-glass-pill/20 border border-glass-border/30 hover:border-glass-border cursor-pointer"
                      onClick={() => {
                        onToggleTask(t.id);
                        // live reflect completion in local modal overlay State
                        setActiveDayModal((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            tasks: prev.tasks.map((curr) => curr.id === t.id ? { ...curr, done: !curr.done } : curr)
                          };
                        });
                      }}
                    >
                      {/* Check dot */}
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                        t.done ? 'bg-text-primary border-transparent' : 'border-glass-border'
                      }`}>
                        {t.done && <span className="text-[9px] text-brand-bg font-bold">✓</span>}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold leading-relaxed truncate ${t.done ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                          {t.title}
                        </p>
                        {t.time && (
                          <span className="flex items-center gap-1 text-[9px] text-text-tertiary mt-1 font-mono font-bold uppercase">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTime(t.time)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PopUp Event Creation/Editing Configurator Modal */}
      <AnimatePresence>
        {createEventModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => { playTick(); setCreateEventModal(null); }} />
            <motion.div
              ref={createEventContainerRef}
              initial={{ scale: 0.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.15, opacity: 0 }}
              style={{ transformOrigin: createEventOrigin }}
              transition={{ type: "spring", stiffness: 440, damping: 30 }}
              className="relative w-full max-w-md bg-glass-bg border border-glass-border rounded-[32px] p-6 shadow-2xl z-10 text-text-primary font-sans max-h-[88vh] overflow-y-auto scrollbar-none backdrop-blur-2xl"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[32px] transition-colors" 
                style={{ backgroundColor: newEventColor }}
              />
              
              <div className="flex items-center justify-between mb-5">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">
                    {createEventModal.id ? 'Refine Schedule Block' : 'Schedule Workspace Task'}
                  </span>
                  <h3 className="text-base font-extrabold font-display tracking-tight text-text-primary">
                    {createEventModal.id ? 'Modify Task Block' : 'Create New Event'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => { playTick(); setCreateEventModal(null); }}
                  className="w-7 h-7 rounded-full bg-glass-pill border border-glass-border text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer hover:bg-glass-pill-hover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newEventTitle.trim()) return;
                
                if (createEventModal.id) {
                  onUpdateTask(createEventModal.id, {
                    title: newEventTitle.trim(),
                    priority: newEventPriority,
                    pageId: newEventPageId,
                    notes: newEventNotes,
                    color: newEventColor,
                    recurrence: newEventRecurrence,
                    time: newEventStartTime,
                    endTime: newEventEndTime,
                  });
                  playSuccessChime();
                } else {
                  onAddTask({
                    title: newEventTitle.trim(),
                    time: newEventStartTime,
                    endTime: newEventEndTime,
                    date: createEventModal.date.toDateString(),
                    priority: newEventPriority,
                    tags: [],
                    reminder: false,
                    pageId: newEventPageId,
                    notes: newEventNotes,
                    color: newEventColor,
                    recurrence: newEventRecurrence,
                  });
                  playSuccessChime();
                }

                setCreateEventModal(null);
              }} className="space-y-4">
                
                {/* Visual time slot indicator banner */}
                <div className="bg-glass-pill border border-glass-border/40 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-text-primary font-mono font-extrabold text-sm" style={{ backgroundColor: `${newEventColor}20`, color: newEventColor }}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-text-primary">
                      {createEventModal.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-0.5 font-mono">
                      Target Boundary: {newEventStartTime} – {newEventEndTime}
                    </p>
                  </div>
                </div>

                {/* Event Name */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Event Title</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Align design sync with team"
                    className="w-full bg-glass-pill hover:bg-glass-pill-hover text-xs font-semibold text-text-primary border border-glass-border rounded-xl p-3 focus:outline-none placeholder-text-tertiary"
                    autoFocus
                  />
                </div>

                {/* Start / End Time fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                      className="w-full bg-glass-pill hover:bg-glass-pill-hover text-xs font-semibold text-text-primary border border-glass-border rounded-xl p-3 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">End Time</label>
                    <input
                      type="time"
                      required
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                      className="w-full bg-glass-pill hover:bg-glass-pill-hover text-xs font-semibold text-text-primary border border-glass-border rounded-xl p-3 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notion Page Link Category selection dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Notion Page Link (Optional)</label>
                  <select
                    value={newEventPageId || ''}
                    onChange={(e) => setNewEventPageId(e.target.value || null)}
                    className="w-full text-xs font-semibold bg-glass-pill hover:bg-glass-pill-hover text-text-secondary rounded-xl p-3 focus:outline-none border border-glass-border cursor-pointer appearance-none"
                  >
                    <option value="">🏠 Daily Inbox (General)</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>📄 {p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Priority Level</label>
                  <div className="grid grid-cols-4 gap-1.5 p-0.5 bg-glass-pill border border-glass-border rounded-xl">
                    {([
                      { id: 'high', label: 'High', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
                      { id: 'medium', label: 'Medium', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                      { id: 'low', label: 'Low', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                      { id: null, label: 'None', color: 'text-text-tertiary' },
                    ] as const).map((pr) => {
                      const active = newEventPriority === pr.id;
                      return (
                        <button
                          key={pr.id ?? 'none'}
                          type="button"
                          onClick={() => { playSnap(); setNewEventPriority(pr.id); }}
                          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border ${
                            active 
                              ? `${pr.color} shadow-sm border-glass-border` 
                              : 'text-text-tertiary border-transparent hover:text-text-secondary'
                          }`}
                        >
                          {pr.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Notes & Context</label>
                  <textarea
                    value={newEventNotes}
                    onChange={(e) => setNewEventNotes(e.target.value)}
                    placeholder="Add remarks, reminders, or references..."
                    rows={2}
                    className="w-full bg-glass-pill hover:bg-glass-pill-hover text-xs font-semibold text-text-primary border border-glass-border rounded-xl p-3 focus:outline-none placeholder-text-tertiary resize-none"
                  />
                </div>

                {/* Accent Block Color Horizontal Grid */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Accent Color Profile</label>
                  <div className="flex gap-2.5">
                    {['#ff453a', '#ff9f0a', '#0a84ff', '#30d158', '#bf5af2', '#64748b'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { playTick(); setNewEventColor(c); }}
                        className="w-6 h-6 rounded-full transition-all hover:scale-110 border cursor-pointer border-transparent flex items-center justify-center relative shadow-sm"
                        style={{ backgroundColor: c }}
                      >
                        {newEventColor === c && <span className="text-[10px] text-white font-black">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recurrence Dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-widest text-text-tertiary uppercase block">Recurrence Cycle</label>
                  <select
                    value={newEventRecurrence}
                    onChange={(e) => setNewEventRecurrence(e.target.value as any)}
                    className="w-full text-xs font-semibold bg-glass-pill hover:bg-glass-pill-hover text-text-secondary rounded-xl p-3 focus:outline-none border border-glass-border cursor-pointer appearance-none"
                  >
                    <option value="none">🔁 Do Not Repeat</option>
                    <option value="daily">🔁 Repeat Every Day</option>
                    <option value="weekly">🔁 Repeat Every Week</option>
                  </select>
                </div>

                {/* Actions Row */}
                <div className="flex gap-2 pt-3 border-t border-glass-border/10 justify-between items-center">
                  
                  {/* Delete Event trigger enabled ONLY during edits */}
                  {createEventModal.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this event?')) {
                          playSnap();
                          onDeleteTask(createEventModal.id!);
                          setCreateEventModal(null);
                        }
                      }}
                      className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-xl p-2.5 cursor-pointer flex items-center gap-2 text-xs font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { playTick(); setCreateEventModal(null); }}
                      className="px-4 py-2.5 rounded-xl border border-glass-border bg-transparent hover:bg-glass-pill text-xs font-semibold text-text-secondary cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newEventTitle.trim()}
                      className="px-5 py-2.5 rounded-xl bg-text-primary text-brand-bg hover:opacity-90 font-extrabold text-xs cursor-pointer transition-all disabled:opacity-40"
                    >
                      {createEventModal.id ? 'Save Blocks' : 'Compile Event'}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
