import React, { useState, useEffect, useRef } from 'react';
import { SubmittedApplication } from '../types';
import {
  CheckCircle2,
  XCircle,
  FileText,
  X,
  Volume2,
  VolumeX,
  MessageCircle,
} from 'lucide-react';

interface VerificationChatHeadProps {
  incomingApp: SubmittedApplication | null;
  pendingCount: number;
  isRinging: boolean;
  onStopSound: () => void;
  onApprove: (referenceId: string) => void;
  onReject: (referenceId: string) => void;
  onOpenInPortal: () => void;
  onDismiss: () => void;
}

/**
 * Plays a 5-second Messenger-style melodic notification chime using Web Audio API
 */
export function playFiveSecondNotificationSound(): () => void {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  let isStopped = false;
  const timers: number[] = [];

  // Play a pleasant two-tone Messenger-like "ding-dong" chime every ~1 second for 5 seconds
  const chimeOffsetsMs = [0, 1000, 2000, 3000, 4000];

  chimeOffsetsMs.forEach((offsetMs) => {
    const t = window.setTimeout(() => {
      if (isStopped || ctx.state === 'closed') return;
      try {
        const now = ctx.currentTime;

        // Note 1 (E6 - 1318.5 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1318.5, now);
        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.26);

        // Note 2 (B6 - 1975.5 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1975.5, now + 0.14);
        gain2.gain.setValueAtTime(0.001, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.16);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.14);
        osc2.stop(now + 0.56);
      } catch {
        // Ignore audio context restrictions if any
      }
    }, offsetMs);
    timers.push(t);
  });

  const closeTimer = window.setTimeout(() => {
    if (!isStopped && ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
  }, 5200);
  timers.push(closeTimer);

  return () => {
    isStopped = true;
    timers.forEach((id) => clearTimeout(id));
    if (ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
  };
}

export const VerificationChatHead: React.FC<VerificationChatHeadProps> = ({
  incomingApp,
  pendingCount,
  isRinging,
  onStopSound,
  onApprove,
  onReject,
  onOpenInPortal,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const prevAppRef = useRef<string | null>(null);

  // Auto-show preview bubble when a new incomingApp arrives
  useEffect(() => {
    if (incomingApp && incomingApp.referenceId !== prevAppRef.current) {
      prevAppRef.current = incomingApp.referenceId;
      setIsExpanded(false);
    }
  }, [incomingApp]);

  if (!incomingApp) return null;

  const initials = incomingApp.formData.fullName
    ? incomingApp.formData.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded Messenger-Style Quick Chat Window */}
      {isExpanded ? (
        <div className="w-80 max-w-[90vw] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Chat Window Top Bar */}
          <div className="bg-[#006A3D] text-white px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white text-[#006A3D] font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold truncate">
                    {incomingApp.formData.fullName}
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] text-emerald-100 truncate">
                  নতুন ভেরিফিকেশন আবেদন · {incomingApp.referenceId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isRinging && (
                <button
                  type="button"
                  onClick={onStopSound}
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                  title="Mute Sound"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                title="Minimize to Chat Head"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Message Style Body */}
          <div className="p-3.5 bg-[#F8FAF7] space-y-2.5 text-xs">
            {/* Incoming Message Bubble */}
            <div className="bg-white p-3 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#006A3D] bg-emerald-50 px-2 py-0.5 rounded">
                  {incomingApp.formData.program}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Just now</span>
              </div>

              {incomingApp.formData.studentId && (
                <p className="text-[11px] text-slate-700">
                  <strong>ID:</strong>{' '}
                  <span className="font-mono">{incomingApp.formData.studentId}</span>
                </p>
              )}
              {incomingApp.formData.department && (
                <p className="text-[11px] text-slate-700">
                  <strong>Dept:</strong> {incomingApp.formData.department}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500 font-medium">
                  Batch: {incomingApp.formData.batchSeason}{' '}
                  {incomingApp.formData.batchYear}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenInPortal();
                  }}
                  className="text-[#006A3D] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-[#006A3D]" />
                  <span>পূর্ণ বিস্তারিত</span>
                </button>
              </div>
            </div>

            {/* Instant Approve / Reject Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  onReject(incomingApp.referenceId);
                  setIsExpanded(false);
                }}
                className="py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>বাতিল</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onApprove(incomingApp.referenceId);
                  setIsExpanded(false);
                }}
                className="py-2 rounded-xl bg-[#006A3D] hover:bg-[#005530] text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Compact Floating Preview Speech Bubble + Circular Chat Head */
        <div className="flex items-center gap-2.5">
          {/* Speech Bubble Preview */}
          <div
            onClick={() => {
              onStopSound();
              setIsExpanded(true);
            }}
            className="bg-white border border-slate-200/90 shadow-lg rounded-2xl rounded-br-xs px-3 py-2 max-w-[215px] cursor-pointer hover:bg-slate-50 transition-all animate-in slide-in-from-right-4 duration-200"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#D62828] flex items-center gap-1">
                {isRinging ? (
                  <>
                    <Volume2 className="w-3 h-3 animate-bounce" />
                    <span>নতুন আবেদন! (5s সাউন্ড)</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3 h-3 text-[#006A3D]" />
                    <span className="text-[#006A3D]">নতুন ভেরিফিকেশন আবেদন</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStopSound();
                  onDismiss();
                }}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {incomingApp.formData.fullName}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              ট্যাপ করে চেক ও Approve করুন
            </p>
          </div>

          {/* Messenger-Style Circular Floating Avatar Head */}
          <button
            type="button"
            onClick={() => {
              onStopSound();
              setIsExpanded(true);
            }}
            className={`relative w-13 h-13 rounded-full bg-gradient-to-br from-[#006A3D] to-emerald-800 text-white shadow-xl border-2 border-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
              isRinging ? 'ring-4 ring-[#D62828]/40 animate-bounce' : ''
            }`}
            title="Open Verification Chat Head"
          >
            <span className="font-bold text-sm tracking-tight">{initials}</span>

            {/* Red Unread Counter Badge */}
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#D62828] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
              {pendingCount > 0 ? pendingCount : 1}
            </span>

            {/* Active Online Green Dot */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
          </button>
        </div>
      )}
    </div>
  );
};
