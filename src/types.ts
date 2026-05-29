/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Habit {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string; // Hex value (e.g., #007aff, #34c759)
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // [0-6] for Sun-Sat
  completedDays: string[]; // Dates in YYYY-MM-DD format
  createdAt: number;
  category: string; // e.g. Fitness, Mind, Productivity, Health
  reminderTime?: string; // e.g., "08:00"
  verifiedPhotos?: {
    [dateStr: string]: {
      photo: string;      // Base64 string of the uploaded photo proof
      comment: string;    // Comment/response from Gemini AI
      verifiedAt: number; // Verification timestamp
    };
  };
}

export interface Task {
  id: string;
  title: string;
  time: string | null;      // Start time: "HH:MM"
  endTime?: string | null;   // End time: "HH:MM"
  date: string;      // Date in toDateString() format, e.g. "Thu May 28 2026"
  priority: 'high' | 'medium' | 'low' | null;
  tags: string[];
  reminder: boolean;
  done: boolean;
  pageId: string | null;
  notes?: string;
  color?: string;
  category?: string;
  recurrence?: 'none' | 'daily' | 'weekly';
  createdAt: string; // ISO String
}

export interface Page {
  id: string;
  name: string;
  icon?: string;
}

export interface UserStats {
  totalLogged: number;
  averageProgress: number;
  completionRate: number;
}

export type Theme = 'dark' | 'light';
export type ActiveView = 'today' | 'all' | 'habits' | 'calendar' | 'page' | 'focus' | 'settings';
