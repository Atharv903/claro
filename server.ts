/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Client-side proof images are compressed before upload; keep the server limit
  // bounded so a raw phone photo cannot stall the Node process.
  app.use(express.json({ limit: "4mb" }));

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // AI Verification Endpoint
  app.post("/api/verify-proof", async (req, res) => {
    try {
      const { habitName, habitDescription, imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing image" });
      }

      if (!apiKey || !ai) {
        console.warn("GEMINI_API_KEY is not defined. Proof verification cannot inspect photos.");
        return res.json({
          verified: false,
          confidence: 0,
          comment: "Gemini verification is not connected yet. Add GEMINI_API_KEY to enable real photo checks, or use Manual Log when you want to record this without proof."
        });
      }

      // Check format and parse out mime type
      let mimeType = "image/jpeg";
      let base64Data = imageBase64;
      if (imageBase64.includes(";base64,")) {
        const parts = imageBase64.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        base64Data = parts[1];
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        }
      };

      const prompt = `You are verifying one habit log. The user claims this photo proves completion of this exact habit title: "${habitName}".
Habit Description: "${habitDescription}".

Analyze the photo carefully. First identify visible objects, scene, activity, text, screenshots, or signs. Then decide whether the visible evidence reasonably matches BOTH the habit title and description. A generic or unrelated photo must be rejected even if it could represent wellness in general. Be contextual and supportive, but do not accept photos that do not visibly connect to "${habitName}".

Examples:
- Habit "Drink water": accept a clear water bottle, glass of water, hydration tracker, or similar.
- Habit "Read 20 pages": accept a book, Kindle, notes, or visible reading material.
- Habit "Gym workout": accept gym equipment, workout clothes in use, treadmill, weights, activity tracker, or similar.
- Habit "Meditate": accept a meditation setup, cushion, timer/session screen, or calm seated practice.
- Reject unrelated selfies, random rooms, blank images, screenshots without relevant text, or photos that only match the description weakly.

Return a JSON response matching this schema:
{
  "verified": boolean,
  "confidence": number,
  "comment": string
}

"verified" must be true only when the image visibly supports the specific habit title "${habitName}". If uncertain, set verified false and explain what evidence is missing.
"confidence" must be between 0 and 1.
"comment" should be a short direct comment explaining what you see and why it does or doesn't verify "${habitName}". Max 3 sentences. Keep it encouraging but honest.

You MUST return ONLY a valid raw JSON object, without any markdown formatting or block quotes.`;

      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const cleaned = responseText.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);

      return res.json(parsed);

    } catch (err: any) {
      console.error("Gemini Verification Error:", err);
      return res.status(500).json({ 
        error: "Verification failed", 
        details: err?.message || err 
      });
    }
  });

  // AI Command Parsing Endpoint for Universal Spotlight Console
  app.post("/api/ai/command", async (req, res) => {
    try {
      const { text, userContext } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Empty command string" });
      }

      if (!apiKey || !ai) {
        console.warn("GEMINI_API_KEY is not defined. Falling back to structured parsing regex.");
        const lower = text.toLowerCase().trim();
        let intent = "conversational";
        let action = "talk";
        let message = `I interpreted your phrase "${text}". Insert your GEMINI_API_KEY in "Settings > Secrets" for full predictive natural-language scheduling!`;
        let data: any = {};

        if (lower.includes("go to calendar") || lower.includes("open calendar") || lower.includes("show calendar") || lower.includes("calendar")) {
          intent = "navigation";
          action = "navigate";
          data.navigation = { view: "calendar", pageId: null };
          message = "Navigating you to your Weekly Time-Blocking Calendar view! 📅";
        } else if (lower.includes("go to habits") || lower.includes("open habits") || lower.includes("show habits") || lower.includes("habits") || lower.includes("routine")) {
          intent = "navigation";
          action = "navigate";
          data.navigation = { view: "habits", pageId: null };
          message = "Opening your focus routines and habit tracker dashboard! ⚡";
        } else if (lower.includes("go to today") || lower.includes("show today") || lower.includes("open today") || lower.includes("today")) {
          intent = "navigation";
          action = "navigate";
          data.navigation = { view: "today", pageId: null };
          message = "Loading your Today overview and Ring Progress status! 🎯";
        } else if (lower.includes("go to settings") || lower.includes("open settings") || lower.includes("show settings") || lower.includes("settings")) {
          intent = "navigation";
          action = "navigate";
          data.navigation = { view: "settings", pageId: null };
          message = "Loading the personalization dashboard. Configure theme, font scaling, or density. ⚙️";
        } else if (lower.includes("go to focus") || lower.includes("open focus") || lower.includes("start focus") || lower.includes("focus mode") || lower.includes("breathe") || lower.includes("timer")) {
          intent = "navigation";
          action = "navigate";
          data.navigation = { view: "focus", pageId: null };
          message = "Launching the Zen Focus Room. Clear the noise and enter single-task deep flow. 🧘";
        } else if (lower.includes("sound") || lower.includes("volume") || lower.includes("mute")) {
          intent = "action";
          action = "system_action";
          data.systemAction = { type: "toggle_sounds", payload: null };
          message = "Interactive audio nodes shifted! 🔊";
        } else if (lower.includes("dark") || lower.includes("light") || lower.includes("theme")) {
          intent = "action";
          action = "system_action";
          data.systemAction = { type: "toggle_theme", payload: null };
          message = "App luminosity profile loaded in real-time! 🌓";
        } else if (lower.includes("habit") || lower.includes("routine") || lower.includes("daily")) {
          intent = "create_habit";
          action = "create_habit";
          const hName = text.replace(/create habit|add habit|routine|create|add|daily/gi, "").trim();
          data.habit = {
            name: hName || "Unscheduled Habit",
            emoji: "🧘",
            color: "#3b82f6",
            frequency: "daily",
            category: "Focus",
            description: "Compiled via Spotlight AI."
          };
          message = `Drafted a new daily routine habit "${data.habit.name}". Click the Routine tab to customize. ⚡`;
        } else {
          intent = "schedule_task";
          action = "create_task";
          const today = new Date();
          let taskDate = today.toDateString();
          let dateMsg = "today";
          if (/\bday\s+after\s+tomor?r?o?w\b/i.test(lower)) {
            const dayAfter = new Date();
            dayAfter.setDate(today.getDate() + 2);
            taskDate = dayAfter.toDateString();
            dateMsg = "day after tomorrow";
          } else if (lower.includes("tomorrow")) {
            const tom = new Date();
            tom.setDate(today.getDate() + 1);
            taskDate = tom.toDateString();
            dateMsg = "tomorrow";
          }
          const timeMatch = lower.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
          let taskTime = "09:00";
          if (timeMatch) {
            let hours = Number(timeMatch[1]);
            const minutes = timeMatch[2] || "00";
            const meridiem = timeMatch[3];
            if (meridiem === "pm" && hours < 12) hours += 12;
            if (meridiem === "am" && hours === 12) hours = 0;
            if (hours >= 0 && hours <= 23) {
              taskTime = `${String(hours).padStart(2, "0")}:${minutes}`;
            }
          }
          const matchedPage = (userContext?.pages || []).find((page: any) => lower.includes(String(page.name || "").toLowerCase()));
          const tName = text
            .replace(/add task|schedule|create task|remind me to|add|schedule|day after tomorrow|day after tomoroow|day after tomorow|tomorrow|today/gi, "")
            .replace(/\bat\s*\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, "")
            .trim();
          data.task = {
            title: tName || "Unassigned Task Reminder",
            date: taskDate,
            time: taskTime,
            priority: lower.includes("urgent") || lower.includes("important") ? "high" : null,
            tags: [],
            reminder: lower.includes("remind") || lower.includes("alert"),
            pageId: matchedPage?.id || null,
            duration: 60,
            category: "Personal",
            notes: "Compiled from quick action console."
          };
          message = `Compiled a scheduled task "${data.task.title}" for ${dateMsg}. Tap Enter to schedule! ⏰`;
        }

        return res.json({ intent, action, data, message });
      }

      // Live Gemini Engine parsing
      const systemPrompt = `You are the brain of "Rise" (also known as "Claro"), a premium, minimalist visual productivity app combining calendars, habits, and tasks.
The user entered this natural language string in their search console bar: "${text}"

Your objective is to translate this text into a structured, highly predictable application payload.
The current local date of reference is: ${userContext?.currentDate || new Date().toDateString()}.
Existing user custom Pages on record: ${JSON.stringify(userContext?.pages || [])}

Structure your reply STRICTLY as a raw JSON matching this schema:
{
  "intent": "schedule_task" | "create_habit" | "navigation" | "action" | "conversational",
  "action": "create_task" | "create_habit" | "navigate" | "system_action" | "talk",
  "data": {
    "task": {
      "title": "string",
      "date": "string (MUST correspond exactly to javascript's Date.toDateString() output format, e.g. 'Thu Jun 04 2026' computed relative to today's date of ${userContext?.currentDate || new Date().toDateString()}. Interpret relative date terms like 'tomorrow' as current date + 1 day, and 'day after tomorrow' as current date + 2 days)",
      "time": "string (HH:MM standard 24-hr layout e.g. '15:30'. Default to '09:00' if no clock time is set)",
      "priority": "high" | "medium" | "low" | null,
      "tags": "string[]",
      "reminder": boolean,
      "pageId": "string | null (if matching an existing Page name from the user records, fill its ID, else null)",
      "duration": 15 | 30 | 45 | 60 | 90 | 120 (number representing duration in minutes. Default is 30)",
      "category": "Work" | "Personal" | "Health" | "Leisure",
      "notes": "string"
    },
    "habit": {
      "name": "string",
      "emoji": "string (single emoji symbol, e.g. '🥑' for food, '🏃' for runs, '💻' for coding)",
      "color": "string (hex code from: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'])",
      "frequency": "daily" | "weekly",
      "category": "Health" | "Focus" | "Mindfulness" | "Learning",
      "description": "string"
    },
    "navigation": {
      "view": "today" | "all" | "habits" | "calendar" | "focus" | "settings" | "page",
      "pageId": "string | null (if matching an existing Page name from the user records, fill its ID, else null)"
    },
    "systemAction": {
      "type": "start_focus" | "toggle_sounds" | "toggle_theme" | "clear_completed",
      "payload": null
    }
  },
  "message": "string (An elegant, brief, empathetic supportive confirmation explaining exactly what AI compiled or did)"
}

Rules:
1. Navigating views: If they want to look at, open, or switch to details, calendar, routines, settings, pages, set intent="navigation" and data.navigation. If they mention a page in context, map pageId.
2. Scheduling items: If they say "add task", "remind me to", "schedule dinner next Monday", etc., compile a task with the exact date format and set intent="schedule_task".
3. Routine Habits: If they specify "daily", "every day", "habit", "routine" e.g. "Do yoga daily", set intent="create_habit" and fill data.habit.
4. Action: "breathe", "timer", "silence", "dark mode", "light mode", "sound toggle" are intent="action", action="system_action".
5. Otherwise, conversational: let message be an expert time-budget coach, setting intent="conversational" and action="talk".

Return strictly raw JSON format without markdown wraps. Do not add markdown quotes or prefix with \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const cleaned = responseText.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);

      return res.json(parsed);

    } catch (err: any) {
      console.error("AI Command parse error:", err);
      return res.status(500).json({ error: "Compilation fail", details: err?.message });
    }
  });

  // Hot Module Replacement handled by dev server proxy settings
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
