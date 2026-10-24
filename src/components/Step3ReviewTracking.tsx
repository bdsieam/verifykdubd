import React, { useState } from 'react';
import { SubmittedApplication } from '../types';
import {
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  FileText,
  RotateCcw,
  Search,
  User,
  GraduationCap,
  Calendar,
  ChevronRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Hash,
  Check,
} from 'lucide-react';

interface Step3Props {
  applications: SubmittedApplication[];
  justSubmittedApp?: SubmittedApplication | null;
  onClearJustSubmitted?: () => void;
  onReset: () => void;
}

export const Step3ReviewTracking: React.FC<Step3Props> = ({
  applications,
  justSubmittedApp,
  onClearJustSubmitted,
  onReset,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(
    justSubmittedApp ? justSubmittedApp.referenceId : ''
  );
  const [selectedAppRef, setSelectedAppRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedBannerRef, setCopiedBannerRef] = useState(false);

  // Find currently clicked/selected application from live applications array
  const selectedApp = selectedAppRef
    ? applications.find((a) => a.referenceId === selectedAppRef) || null
    : null;

  // Filter applications strictly by Application No. (referenceId) OR Student ID (studentId)
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const normalizedQuery = trimmedQuery.replace(/^#/, '');

  const matchedApplications = trimmedQuery
    ? applications.filter((app) => {
        const cleanRef = app.referenceId.toLowerCase().replace(/^#/, '');
        const appNoMatch =
          app.referenceId.toLowerCase().includes(trimmedQuery) ||
          (normalizedQuery.length > 0 && cleanRef.includes(normalizedQuery));

        const studentIdMatch = app.formData.studentId
          ? app.formData.studentId.toLowerCase().includes(trimmedQuery)
          : false;

        return appNoMatch || studentIdMatch;
      })
    : [];

  const copyRef = (refId: string) => {
    navigator.clipboard.writeText(refId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBannerAppNo = (refId: string) => {
    navigator.clipboard.writeText(refId);
    setCopiedBannerRef(true);
    setTimeout(() => setCopiedBannerRef(false), 2000);
  };

  // Mask phone number slightly for privacy in public search card
  const formatMaskedPhone = (phone: string) => {
    if (!phone) return '';
    if (phone.length <= 6) return phone;
    return `${phone.slice(0, 7)}****${phone.slice(-4)}`;
  };

  // ============================================================================
  // VIEW 2: FULL STATUS DETAILS (Opened after clicking a student card)
  // ============================================================================
  if (selectedApp) {
    const isApproved = selectedApp.status === 'approved';
    const isRejected = selectedApp.status === 'rejected';

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-md mx-auto overflow-hidden animate-in fade-in duration-200">
        {/* Top Navigation Bar inside Card */}
        <div className="px-5 pt-4 pb-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedAppRef(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006A3D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>তালিকায় ফিরে যান (আবার খুঁজুন)</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
            title="নতুন ফরম পূরণ করুন"
          >
            <RotateCcw className="w-3 h-3" />
            <span>নতুন আবেদন</span>
          </button>
        </div>

        {/* Status Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#006A3D]">
              ভেরিফিকেশন স্ট্যাটাস
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-600">
              App No: {selectedApp.referenceId}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isApproved
                  ? 'bg-[#006A3D]'
                  : isRejected
                  ? 'bg-red-500'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <h2 className="text-base font-bold text-slate-900">
              {isApproved
                ? 'আবেদন অনুমোদিত (Approved)'
                : isRejected
                ? 'আবেদন বাতিল হয়েছে (Rejected)'
                : 'আবেদন পর্যালোচনা চলছে (Pending)'}
            </h2>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {isApproved
              ? 'আপনার ছাত্রত্ব নিশ্চিত করা হয়েছে। নিচের বাটনে ক্লিক করে মেসেঞ্জার গ্রুপে যোগ দিন।'
              : isRejected
              ? 'দুঃখিত, প্রদত্ত তথ্যের অসংগতির কারণে আবেদনটি অনুমোদন করা যায়নি। সঠিক নথি দিয়ে পুনরায় আবেদন করুন।'
              : 'আপনার আবেদনটি বর্তমানে প্রতিনিধি/অ্যাডমিন টিমের কাছে বিচারাধীন রয়েছে (২৪-৪৮ ঘণ্টা)।'}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isApproved
                  ? 'w-full bg-[#006A3D]'
                  : isRejected
                  ? 'w-full bg-red-500'
                  : 'w-2/3 bg-amber-500'
              }`}
            />
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* 1. Timeline Tracker */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-900 block">
              যাচাইকরণের অগ্রগতি (Timeline)
            </span>

            <div className="relative pl-5 space-y-3.5 text-xs">
              <div
                className={`absolute left-1.5 top-1 bottom-1 w-px ${
                  isApproved
                    ? 'bg-[#006A3D]'
                    : isRejected
                    ? 'bg-red-300'
                    : 'bg-slate-200'
                }`}
              />

              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-5 top-0.5 w-3 h-3 rounded-full bg-[#006A3D]" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    আবেদন জমা সম্পন্ন
                  </span>
                  <span className="text-[10px] font-semibold text-[#006A3D]">
                    Completed
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span
                  className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full ${
                    isApproved
                      ? 'bg-[#006A3D]'
                      : isRejected
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    নথি ও তথ্য যাচাইকরণ
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      isApproved
                        ? 'text-[#006A3D]'
                        : isRejected
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {isApproved
                      ? 'Verified'
                      : isRejected
                      ? 'Failed'
                      : 'In Progress'}
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span
                  className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full ${
                    isApproved
                      ? 'bg-[#006A3D]'
                      : isRejected
                      ? 'bg-red-500'
                      : 'bg-slate-200'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium ${
                      isApproved || isRejected
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    প্রতিনিধি / অ্যাডমিন অনুমোদন
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      isApproved
                        ? 'text-[#006A3D]'
                        : isRejected
                        ? 'text-red-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {isApproved
                      ? 'Approved'
                      : isRejected
                      ? 'Rejected'
                      : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Messenger Join Button (Only Active on Approval) */}
          {isApproved ? (
            <div className="pt-1">
              <a
                href="https://m.me/j/AbZKduBangla2026"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 text-xs font-bold text-white bg-[#006A3D] hover:bg-[#005530] rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Join Official Messenger Community</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[11px]">
                  মেসেঞ্জার গ্রুপ লিংক অনুমোদনের পর সক্রিয় হবে
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Locked
              </span>
            </div>
          )}

          {/* 3. Application Details Summary */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-semibold text-slate-800">
                শিক্ষার্থীর বিবরণ (Student Details)
              </span>
              <button
                type="button"
                onClick={() => copyRef(selectedApp.referenceId)}
                className="text-[11px] font-medium text-[#006A3D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : selectedApp.referenceId}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div>
                <span className="text-slate-400 block">Full Name</span>
                <span className="font-bold text-slate-800">
                  {selectedApp.formData.fullName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Application No.</span>
                <span className="font-mono font-bold text-[#006A3D]">
                  {selectedApp.referenceId}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Program</span>
                <span className="font-semibold text-slate-800">
                  {selectedApp.formData.program}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Student ID</span>
                <span className="font-mono text-slate-800">
                  {selectedApp.formData.studentId
                    ? selectedApp.formData.studentId
                    : 'N/A (Language Program)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Batch / Intake</span>
                <span className="text-slate-800 font-medium">
                  {selectedApp.formData.batchSeason}{' '}
                  {selectedApp.formData.batchYear}
                </span>
              </div>

              {selectedApp.formData.department && (
                <div className="col-span-2">
                  <span className="text-slate-400 block">Department</span>
                  <span className="text-slate-800 font-medium block">
                    {selectedApp.formData.department}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {selectedApp.document.fileName || 'Verification_Document'}
                </span>
              </span>
              <span className="text-[#006A3D] font-medium shrink-0">
                Attached
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 1: SEARCH BY APPLICATION NO. OR STUDENT ID -> CLICKABLE STUDENT CARDS
  // ============================================================================
  return (
    <div className="max-w-md mx-auto space-y-3 animate-in fade-in duration-200">
      {/* Banner if user just submitted a form - Shows Application No. clearly to copy */}
      {justSubmittedApp && (
        <div className="bg-[#E5F1E9] border border-[#006A3D]/25 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#006A3D] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#006A3D]">
                  আপনার ভেরিফিকেশন আবেদন সফলভাবে জমা হয়েছে!
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  পরবর্তীতে স্ট্যাটাস চেক করার জন্য নিচের{' '}
                  <span className="font-bold text-slate-800">
                    Application No.
                  </span>{' '}
                  সংরক্ষণ করে রাখুন (বিশেষ করে Language Program শিক্ষার্থীদের
                  ক্ষেত্রে)।
                </p>
              </div>
            </div>
            {onClearJustSubmitted && (
              <button
                type="button"
                onClick={onClearJustSubmitted}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="bg-white/90 rounded-xl px-3.5 py-2 border border-[#006A3D]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">
                আপনার Application No.
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {justSubmittedApp.referenceId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyBannerAppNo(justSubmittedApp.referenceId)}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#006A3D] text-white hover:bg-[#005530] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedBannerRef ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>কপি করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Search Box Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#006A3D] bg-[#E5F1E9] px-2 py-0.5 rounded-md">
            অ্যাকাউন্ট ছাড়াই স্ট্যাটাস যাচাই
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-2">
            Application No. অথবা Student ID দিয়ে খুঁজুন
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            <span className="font-semibold text-slate-700">Bachelor</span>{' '}
            শিক্ষার্থীরা <span className="font-semibold text-slate-700">Student ID</span> অথবা{' '}
            <span className="font-semibold text-slate-700">Application No.</span> দিয়ে এবং{' '}
            <span className="font-semibold text-teal-700">Language Program</span>{' '}
            শিক্ষার্থীরা তাদের{' '}
            <span className="font-semibold text-teal-700">Application No.</span>{' '}
            দিয়ে সার্চ করুন।
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Application No. (#KDU-2026-...) অথবা Student ID..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D] focus:bg-white text-slate-800 placeholder:text-slate-400 font-mono transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Matching Student Cards List */}
      {trimmedQuery ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-600">
              প্রাপ্ত ফলাফল ({matchedApplications.length}টি)
            </span>
            <span className="text-[10px] text-slate-400">
              বিস্তারিত মিলিয়ে কার্ডে ক্লিক করুন
            </span>
          </div>

          {matchedApplications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">
                এই Application No. বা Student ID-তে কোনো আবেদন পাওয়া যায়নি
              </p>
              <p className="text-[11px] text-slate-400">
                সঠিক Application No. (যেমন: #KDU-2026-0019) অথবা ৮ সংখ্যার
                Student ID দিয়ে আবার চেষ্টা করুন।
              </p>
            </div>
          ) : (
            matchedApplications.map((app) => {
              const isLanguage = app.formData.program === 'Language Program';

              return (
                <button
                  key={app.referenceId}
                  type="button"
                  onClick={() => setSelectedAppRef(app.referenceId)}
                  className="w-full text-left bg-white hover:bg-[#F8FAF7] rounded-2xl border border-slate-200/80 hover:border-[#006A3D]/50 p-4 shadow-2xs transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#E5F1E9] text-[#006A3D] flex items-center justify-center shrink-0 font-bold text-sm mt-0.5">
                        {app.formData.fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 space-y-1">
                        {/* Student Full Name + Program Tag */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#006A3D] transition-colors">
                            {app.formData.fullName}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isLanguage
                                ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                                : 'bg-emerald-50 text-[#006A3D] border border-emerald-200/60'
                            }`}
                          >
                            {app.formData.program}
                          </span>
                        </div>

                        {/* Application No + Student ID / Batch Details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 font-mono text-[#006A3D] font-bold">
                            App No: {app.referenceId}
                          </span>

                          {app.formData.studentId ? (
                            <span className="inline-flex items-center gap-1 font-mono text-slate-700 font-medium">
                              <Hash className="w-3 h-3 text-slate-400" />
                              ID: {app.formData.studentId}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                              <User className="w-3 h-3" />
                              Language Program
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Batch: {app.formData.batchSeason}{' '}
                            {app.formData.batchYear}
                          </span>

                          {app.formData.phone && (
                            <span className="text-[10px] text-slate-400">
                              Phone: {formatMaskedPhone(app.formData.phone)}
                            </span>
                          )}
                        </div>

                        {app.formData.department && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {app.formData.department}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Click to view status indicator */}
                    <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-[#006A3D] group-hover:text-white transition-colors flex items-center gap-0.5">
                        <span>স্ট্যাটাস দেখুন</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#E5F1E9] text-[#006A3D] flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Application No. অথবা Student ID লিখে সার্চ করুন
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            সার্চ করলে আপনার নামের সাথে বিস্তারিত তথ্যের কার্ড দেখাবে। নিজের
            কার্ডটি মিলিয়ে ক্লিক করলেই ভেরিফিকেশন স্ট্যাটাস দেখতে পাবেন।
          </p>
        </div>
      )}
    </div>
  );
};
