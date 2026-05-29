/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Quote {
  text: string;
  author: string;
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    text: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn"
  },
  {
    text: "It is easier to prevent bad habits than they are to break them.",
    author: "Benjamin Franklin"
  },
  {
    text: "Your habits will determine your future.",
    author: "Jack Canfield"
  },
  {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  },
  {
    text: "Habits are the compound interest of self-improvement.",
    author: "James Clear"
  },
  {
    text: "The secret of your future is hidden in your daily routine.",
    author: "Mike Murdock"
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier"
  }
];

export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}

export function getCoachingMessage(progressPercentage: number): string {
  if (progressPercentage === 0) {
    return "Every monumental journey begins with a single deliberate breath. Let’s make today count.";
  } else if (progressPercentage < 40) {
    return "Incredible momentum. Every checked item is a deposit into your future self.";
  } else if (progressPercentage < 75) {
    return "Compounding in action. You are past the halfway threshold; lock in the remainder!";
  } else if (progressPercentage < 100) {
    return "So close to ring closure! One final push to complete a pristine day.";
  } else {
    return "Spectacular. Rings closed. Complete habit sync attained. Rest, restore, repeat tomorrow.";
  }
}
