/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Formats a Date object to YYYY-MM-DD
export function formatLocalDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

// Get past date relative to today (e.g. offset = -1 for yesterday)
export function getRelativeDateString(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return formatLocalDate(d);
}

// Generate an array of dates from today back to N days
export function getPastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    dates.push(getRelativeDateString(-i));
  }
  return dates;
}

// Convert YYYY-MM-DD to display string like "May 28"
export function getDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Get day of week name (e.g. "Sun", "Mon", etc. or "S", "M")
export function getDayLetter(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay();
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayIndex];
}

// Calculate current streak for a list of completed dates
export function calculateCurrentStreak(completedDays: string[]): number {
  if (!completedDays || completedDays.length === 0) return 0;
  
  // Sort descending (newest first)
  const sorted = [...completedDays].sort((a, b) => b.localeCompare(a));
  
  const todayStr = getRelativeDateString(0);
  const yesterdayStr = getRelativeDateString(-1);
  
  // Check if today or yesterday is the latest completed day.
  // If not, streak is broken (0).
  const latest = sorted[0];
  if (latest !== todayStr && latest !== yesterdayStr) {
    return 0;
  }
  
  let streak = 0;
  let currentCheckStr = latest;
  
  while (sorted.includes(currentCheckStr)) {
    streak++;
    // Get previous day YYYY-MM-DD
    const parts = currentCheckStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] - 1);
    currentCheckStr = formatLocalDate(d);
  }
  
  return streak;
}

// Calculate the maximum (best) streak historically
export function calculateBestStreak(completedDays: string[]): number {
  if (!completedDays || completedDays.length === 0) return 0;
  
  // Sort ascending (oldest first)
  const sorted = [...new Set(completedDays)].sort((a, b) => a.localeCompare(b));
  
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;
  
  for (const dateStr of sorted) {
    const parts = dateStr.split('-').map(Number);
    const currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
    
    if (prevDate === null) {
      currentStreak = 1;
    } else {
      const timeDiff = currentDate.getTime() - prevDate.getTime();
      const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
      } else if (dayDiff > 1) {
        if (currentStreak > maxStreak) maxStreak = currentStreak;
        currentStreak = 1;
      }
    }
    prevDate = currentDate;
  }
  
  return Math.max(maxStreak, currentStreak);
}

// Generate calendar cells (e.g. 28 days back) with complete details
export interface CalendarCell {
  dateString: string;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  isFuture: boolean;
}

export function generateCalendarCells(count: number = 28): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const todayStr = getRelativeDateString(0);
  
  // Return list from count-1 days ago to today
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    
    const dateString = formatLocalDate(d);
    cells.push({
      dateString,
      dayNumber: d.getDate(),
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      isToday: dateString === todayStr,
      isFuture: d > new Date(),
    });
  }
  
  return cells;
}
