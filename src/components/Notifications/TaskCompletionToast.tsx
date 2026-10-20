/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TaskCompletionToast: Instant High-End Notification Card for Heads & Co-Heads
 *
 * Specifications:
 * 1. Only displays to the Head or Co-Head who assigned the completed task
 * 2. Positioned in the top-right corner of the screen
 * 3. Animated green checkmark drawing itself onto the card
 * 4. Small festive confetti burst
 * 5. Soft emerald glow with diplomatic gold accents
 * 6. Smooth slide-in with a gentle bounce effect
 * 7. Stays visible for ~5 seconds before fading away (with countdown bar and dismiss button)
 */

import React, { useEffect, useState } from 'react';
import { useVenue } from '../../context/VenueContext';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TaskCompletionToast: React.FC = () => {
  const { activeNotification, dismissNotification, currentUser } = useVenue();
  const [progress, setProgress] = useState(100);
  const [isDismissing, setIsDismissing] = useState(false);

  // Trigger confetti and manage 5-second auto-dismiss lifecycle
  useEffect(() => {
    if (!activeNotification) return;

    // Only proceed if currently authenticated user matches the assigner
    if (currentUser?.id !== activeNotification.assignerId) return;

    setIsDismissing(false);
    setProgress(100);

    // Fire small celebratory confetti burst from top-right area
    try {
      confetti({
        particleCount: 28,
        spread: 55,
        origin: { x: 0.88, y: 0.12 },
        colors: ['#10b981', '#34d399', '#D4AF37', '#B08D57', '#F5F2EA'],
        ticks: 200,
        gravity: 1.1,
        scalar: 0.85,
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore if canvas-confetti is unavailable
    }

    // Smooth countdown progress bar over 5000ms
    const intervalMs = 50;
    const step = (intervalMs / 5000) * 100;
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(progressTimer);
          return 0;
        }
        return prev - step;
      });
    }, intervalMs);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsDismissing(true);
      setTimeout(() => {
        dismissNotification(activeNotification.id);
      }, 350);
    }, 5000);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [activeNotification, currentUser, dismissNotification]);

  // If no notification or user is not the assigner, do NOT render
  if (!activeNotification || currentUser?.id !== activeNotification.assignerId) {
    return null;
  }

  const handleClose = () => {
    setIsDismissing(true);
    setTimeout(() => {
      dismissNotification(activeNotification.id);
    }, 250);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] max-w-sm w-[calc(100vw-2rem)] sm:w-[390px] select-none transition-all duration-300 ${
        isDismissing
          ? 'opacity-0 -translate-y-4 scale-95'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
      style={{
        animation: !isDismissing
          ? 'taskToastSlideBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          : undefined,
      }}
    >
      {/* Dynamic Keyframes for Self-Drawing Checkmark and Smooth Bounce */}
      <style>{`
        @keyframes taskToastSlideBounce {
          0% {
            opacity: 0;
            transform: translateY(-35px) scale(0.92);
          }
          65% {
            opacity: 1;
            transform: translateY(4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes drawCheckCircle {
          0% {
            stroke-dasharray: 151;
            stroke-dashoffset: 151;
          }
          100% {
            stroke-dasharray: 151;
            stroke-dashoffset: 0;
          }
        }

        @keyframes drawCheckTick {
          0% {
            stroke-dasharray: 40;
            stroke-dashoffset: 40;
          }
          40% {
            stroke-dasharray: 40;
            stroke-dashoffset: 40;
          }
          100% {
            stroke-dasharray: 40;
            stroke-dashoffset: 0;
          }
        }

        .check-circle-anim {
          animation: drawCheckCircle 0.55s ease-out forwards;
        }

        .check-tick-anim {
          animation: drawCheckTick 0.65s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
      `}</style>

      {/* Main Toast Container with Soft Glow and Diplomatic Gold/Emerald Border */}
      <div
        className="relative bg-[#14100d]/95 backdrop-blur-md border-2 border-emerald-500/70 p-4 shadow-[0_0_35px_rgba(16,185,129,0.38),0_12px_32px_rgba(0,0,0,0.85)] overflow-hidden"
        style={{
          boxShadow: '0 0 35px rgba(16, 185, 129, 0.38), 0 12px 32px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* Antique Gold Corner Accents */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-[#B08D57]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-[#B08D57]" />
        <div className="absolute bottom-1.5 left-1 w-2.5 h-2.5 border-b border-l border-[#B08D57]" />
        <div className="absolute bottom-1.5 right-1 w-2.5 h-2.5 border-b border-r border-[#B08D57]" />

        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

        <div className="flex items-start gap-3.5">
          {/* Self-Drawing Animated Green Checkmark SVG */}
          <div className="relative shrink-0 mt-0.5">
            <svg
              className="w-10 h-10 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]"
              viewBox="0 0 52 52"
              fill="none"
            >
              {/* Animated Circle */}
              <circle
                cx="26"
                cy="26"
                r="23"
                stroke="#10b981"
                strokeWidth="3.2"
                strokeLinecap="round"
                className="check-circle-anim"
              />
              {/* Animated Checkmark Path */}
              <path
                d="M15 27 L23 35 L37 19"
                stroke="#34d399"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-tick-anim"
              />
            </svg>

            {/* Sparkle badge */}
            <div className="absolute -bottom-1 -right-1 bg-[#1c140e] border border-[#B08D57] rounded-full p-0.5">
              <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-5">
            {/* Header: ✅ Task Completed! */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-bold text-emerald-400 tracking-wide flex items-center gap-1">
                <span>✅</span>
                <span
                  className="font-serif uppercase tracking-wider text-xs sm:text-sm text-emerald-300"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Task Completed!
                </span>
              </span>
            </div>

            {/* Subtitle: [Team Member Name] has completed the task: */}
            <p className="text-xs text-neutral-300 leading-snug">
              <strong className="text-[#F5F2EA] font-semibold font-serif">
                {activeNotification.completedByName}
              </strong>{' '}
              <span className="text-neutral-400">has completed the task:</span>
            </p>

            {/* Task Title: "[Task Title]" */}
            <div className="mt-1.5 p-2 bg-[#1b1511] border border-[#B08D57]/40 rounded-none shadow-inner">
              <p
                className="text-xs sm:text-sm font-bold text-[#D4AF37] leading-tight line-clamp-2"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                "{activeNotification.taskTitle}"
              </p>
            </div>

            {/* Timestamp & Assigner Notice */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
              <span className="text-[#B08D57]/80">Assigner Notification</span>
              <span>
                {new Date(activeNotification.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Close / Dismiss Button */}
          <button
            onClick={handleClose}
            aria-label="Dismiss notification"
            className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-[#F5F2EA] hover:bg-[#281e18] transition rounded-none cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5-second Auto-Dismiss Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a1410]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-[#D4AF37] to-emerald-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
