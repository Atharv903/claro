/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Habit } from '../types';
import { getRelativeDateString } from '../utils/date';

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-meditation',
    name: 'Morning Mindfulness',
    description: '15-minute silent diaphragmatic breathing for mental clarity and focus.',
    emoji: '🧘‍♀️',
    color: '#af52de', // Purple
    frequency: 'daily',
    category: 'Mind',
    reminderTime: '07:30',
    createdAt: Date.now() - 1000 * 3600 * 24 * 30,
    completedDays: [
      getRelativeDateString(0),
      getRelativeDateString(-1),
      getRelativeDateString(-2),
      getRelativeDateString(-3),
      getRelativeDateString(-4),
      getRelativeDateString(-6),
      getRelativeDateString(-7),
      getRelativeDateString(-10),
      getRelativeDateString(-11),
      getRelativeDateString(-12),
      getRelativeDateString(-14),
      getRelativeDateString(-15),
    ]
  },
  {
    id: 'habit-hydration',
    name: 'Hydration Target',
    description: 'Consume 3 liters of structured water to optimize cellular performance.',
    emoji: '💧',
    color: '#007aff', // Blue
    frequency: 'daily',
    category: 'Health',
    reminderTime: '08:00',
    createdAt: Date.now() - 1000 * 3600 * 24 * 30,
    completedDays: [
      getRelativeDateString(0),
      getRelativeDateString(-1),
      getRelativeDateString(-2),
      getRelativeDateString(-3),
      getRelativeDateString(-5),
      getRelativeDateString(-6),
      getRelativeDateString(-8),
      getRelativeDateString(-9),
      getRelativeDateString(-10),
      getRelativeDateString(-12),
      getRelativeDateString(-13),
      getRelativeDateString(-14),
    ]
  },
  {
    id: 'habit-run',
    name: 'Apple Ring Cardio',
    description: 'Close the Red ring with outdoor cardio or 30 mins high-intensity gym training.',
    emoji: '🏃‍♂️',
    color: '#ff2d55', // Pink / Red
    frequency: 'daily',
    category: 'Fitness',
    reminderTime: '18:00',
    createdAt: Date.now() - 1000 * 3600 * 24 * 30,
    completedDays: [
      getRelativeDateString(-1),
      getRelativeDateString(-2),
      getRelativeDateString(-5),
      getRelativeDateString(-7),
      getRelativeDateString(-8),
      getRelativeDateString(-11),
      getRelativeDateString(-14),
      getRelativeDateString(-17),
    ]
  },
  {
    id: 'habit-reading',
    name: 'Deep Reading',
    description: 'Read 20 pages of a physical non-fiction book without digital interruptions.',
    emoji: '📚',
    color: '#ff9500', // Orange
    frequency: 'daily',
    category: 'Productivity',
    reminderTime: '21:30',
    createdAt: Date.now() - 1000 * 3600 * 24 * 30,
    completedDays: [
      getRelativeDateString(0),
      getRelativeDateString(-1),
      getRelativeDateString(-2),
      getRelativeDateString(-3),
      getRelativeDateString(-4),
      getRelativeDateString(-5),
      getRelativeDateString(-8),
      getRelativeDateString(-9),
      getRelativeDateString(-12),
      getRelativeDateString(-13),
    ]
  },
  {
    id: 'habit-sleep',
    name: 'Optimum Sleep Cycle',
    description: 'Ensure 8 hours of restorative sleep; shut down all emissive screens by 10:30 PM.',
    emoji: '🌙',
    color: '#34c759', // Green
    frequency: 'daily',
    category: 'Health',
    reminderTime: '22:15',
    createdAt: Date.now() - 1000 * 3600 * 24 * 30,
    completedDays: [
      getRelativeDateString(0),
      getRelativeDateString(-1),
      getRelativeDateString(-2),
      getRelativeDateString(-3),
      getRelativeDateString(-4),
      getRelativeDateString(-5),
      getRelativeDateString(-6),
      getRelativeDateString(-8),
      getRelativeDateString(-9),
      getRelativeDateString(-12),
      getRelativeDateString(-15),
    ]
  }
];
