/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Trash2, Camera, HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Habit } from '../types';
import { playTick, playSuccessChime, playSnap } from '../utils/audio';
import { getDisplayDate } from '../utils/date';
import { useRippleOrigin } from '../utils/ripple';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const TARGET_IMAGE_SIZE_BYTES = 700 * 1024;

interface PhotoVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  dateStr: string;
  onVerified: (habitId: string, dateStr: string, photo: string, comment: string) => void;
  onQuickLog: (habitId: string, dateStr: string) => void;
}

export default function PhotoVerifierModal({
  isOpen,
  onClose,
  habit,
  dateStr,
  onVerified,
  onQuickLog,
}: PhotoVerifierModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; confidence: number; comment: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const origin = useRippleOrigin(containerRef);

  const compressImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error('Photo size is too large (max 10MB)');
    }

    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image file'));
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Image compression is not available in this browser');
      }

      const attempts = [
        { maxDimension: 1280, quality: 0.72 },
        { maxDimension: 960, quality: 0.62 },
        { maxDimension: 800, quality: 0.52 },
      ];

      let bestDataUrl = '';

      for (const attempt of attempts) {
        const scale = Math.min(1, attempt.maxDimension / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        bestDataUrl = canvas.toDataURL('image/jpeg', attempt.quality);
        if (bestDataUrl.length <= TARGET_IMAGE_SIZE_BYTES) {
          return bestDataUrl;
        }
      }

      return bestDataUrl;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  // Reset modal state when opened for a new date/habit
  useEffect(() => {
    if (isOpen) {
      setImagePreview(null);
      setVerificationLoading(false);
      setVerificationResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, habit.id, dateStr]);

  const loadSelectedFile = async (file: File) => {
    setErrorMessage(null);
    setVerificationResult(null);
    playTick();

    try {
      const compressedImage = await compressImageFile(file);
      setImagePreview(compressedImage);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process image file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    loadSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    loadSelectedFile(file);
  };

  const verifyProofWithAI = async () => {
    if (!imagePreview) return;

    setVerificationLoading(true);
    setErrorMessage(null);
    setVerificationResult(null);
    playTick();

    try {
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          habitName: habit.name,
          habitDescription: habit.description,
          imageBase64: imagePreview
        })
      });

      if (!response.ok) {
        throw new Error(`AI checking server returned status ${response.status}`);
      }

      const result = await response.json();
      setVerificationResult(result);

      if (result.verified === true) {
        playSuccessChime();
        onVerified(habit.id, dateStr, imagePreview, result.comment);
        onClose();
      } else {
        playSnap();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Verification failed. Please check your network and try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const formattedDate = getDisplayDate(dateStr);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => { playTick(); onClose(); }} />

          {/* Modal Card content */}
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.15, opacity: 0 }}
            style={{ transformOrigin: origin }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="relative w-full max-w-[34rem] bg-glass-bg border border-glass-border rounded-[28px] overflow-hidden shadow-2xl z-10 p-4 sm:p-5 flex flex-col max-h-[90dvh] overflow-y-auto text-text-primary scrollbar-glass"
          >
            {/* Header glow */}
            <div
              className="absolute -top-20 -right-20 w-36 h-36 rounded-full blur-[72px] opacity-20 pointer-events-none"
              style={{ backgroundColor: habit.color }}
            />

            {/* Title / Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-inner select-none shrink-0"
                  style={{ backgroundColor: `${habit.color}15` }}
                >
                  {habit.emoji}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-text-primary truncate">
                      Verify Completion
                    </h2>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                  </div>
                  <p className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider font-semibold truncate">
                    {habit.name} &bull; {formattedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { playTick(); onClose(); }}
                className="w-9 h-9 rounded-full bg-glass-pill hover:bg-glass-pill-hover border border-glass-border transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction description */}
            <p className="text-xs text-text-secondary leading-relaxed mb-4 p-3.5 bg-glass-pill rounded-2xl border border-glass-border">
              Provide photographic proof for <span className="font-semibold text-text-primary">{habit.name}</span>. Our integrated 
              <span className="font-semibold text-text-primary"> Gemini Vision</span> AI will match the photo to this habit title and the routine guidelines "<span className="italic">{habit.description}</span>" before certifying your day.
            </p>

            {/* Uploader / Uploading drag & drop area */}
            <div className="space-y-4 flex-1">
              {!imagePreview ? (
                <label 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center px-5 py-7 sm:py-8 border-2 border-dashed border-glass-border hover:border-text-tertiary rounded-2xl transition-all cursor-pointer group bg-glass-pill/40 min-h-[220px] sm:min-h-[250px] relative"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-glass-pill flex items-center justify-center border border-glass-border group-hover:scale-105 transition-all">
                      <Camera className="w-6 h-6 text-text-secondary group-hover:text-text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-secondary">Drag & drop or Click to upload proof</p>
                      <p className="text-[10px] text-text-tertiary mt-1">Accepts live camera photos & files up to 10MB</p>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden aspect-video border border-glass-border shadow-md bg-black/20">
                    <img 
                      src={imagePreview} 
                      alt="Proof Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setVerificationResult(null);
                        setErrorMessage(null);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-black rounded-full text-white/90 hover:text-white transition-all shadow"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-505 rounded-xl text-xs flex items-start gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {verificationResult && !verificationResult.verified && (
                    <div className="p-3 bg-apple-orange/10 border border-apple-orange/20 text-apple-orange rounded-xl text-xs space-y-1">
                      <p className="font-bold uppercase tracking-wider font-mono text-[9px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Proof Rejected by Gemini
                      </p>
                      <p className="leading-relaxed font-medium">"{verificationResult.comment}"</p>
                    </div>
                  )}

                  <button
                    onClick={verifyProofWithAI}
                    disabled={verificationLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {verificationLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Gemini checking against "{habit.name}"...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        <span>Verify "{habit.name}"</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Logging / Skip Bypass Controls */}
            <div className="mt-5 pt-4 border-t border-glass-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <span className="text-[10px] text-text-tertiary font-mono text-center sm:text-left flex items-center justify-center sm:justify-start gap-1 leading-relaxed">
                <HelpCircle className="w-3.5 h-3.5" />
                No photo ready? You can still manually key log.
              </span>
              
              <button
                type="button"
                disabled={verificationLoading}
                onClick={() => {
                  playTick();
                  onQuickLog(habit.id, dateStr);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-glass-pill hover:bg-glass-pill-hover text-text-secondary hover:text-text-primary border border-glass-border font-semibold rounded-2xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <span>Manual Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
