import React, { useState } from 'react';
import { UploadedDocument } from '../types';
import {
  UploadCloud,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  Trash2,
  AlertCircle,
  Eye,
  X,
  CheckCircle2,
} from 'lucide-react';

interface DemoSample {
  id: string;
  badge: string;
  titleKo: string;
  titleEn: string;
  subtitle: string;
  docHeader: string;
  fields: { label: string; value: string; isHighlight?: boolean }[];
  instructions: string;
}

const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'enrollment',
    badge: 'DEMO 1 (সবচেয়ে নির্ভরযোগ্য)',
    titleKo: '재학증명서',
    titleEn: 'Certificate of Enrollment',
    subtitle: 'বিশ্ববিদ্যালয় বা ওয়ান-স্টপ সেন্টার থেকে ইস্যু করা অফিসিয়াল ছাত্রত্ব সনদ',
    docHeader: '재 학 증 명 서 (Certificate of Enrollment)',
    fields: [
      { label: '성명 (Full Name)', value: 'MOHAMMAD TANVIR', isHighlight: true },
      { label: '학번 (Student ID)', value: '20241088', isHighlight: true },
      { label: '학과 (Major)', value: 'Smart Computing & AI' },
      { label: '학적상태 (Status)', value: '재학 (Currently Enrolled)', isHighlight: true },
      { label: '발급일자 (Issued)', value: '2026년 03월 10일' },
      { label: '발급기관 (Issuer)', value: '경동대학교 총장 (KDU President [직인])' },
    ],
    instructions: 'আপনার নাম, স্টুডেন্ট আইডি এবং 재학 (Enrolled) স্ট্যাটাস স্পষ্ট দৃশ্যমান থাকতে হবে।',
  },
  {
    id: 'tuition',
    badge: 'DEMO 2',
    titleKo: '등록금 납부확인서',
    titleEn: 'Tuition Fee Payment Receipt',
    subtitle: 'বর্তমান শিক্ষাবর্ষ বা সেমিস্টারের টিউশন ফি পরিশোধের অফিসিয়াল রসিদ',
    docHeader: '등록금 납부 확인서 (Tuition Receipt)',
    fields: [
      { label: '납부자 (Student)', value: 'MOHAMMAD TANVIR', isHighlight: true },
      { label: '학번 (Student ID)', value: '20241088', isHighlight: true },
      { label: '납부학기 (Semester)', value: '2026학년도 1학기 (Current Term)', isHighlight: true },
      { label: '수납상태 (Payment)', value: '완납 (Full Paid - ₩0 Balance)' },
      { label: '수납은행 (Bank)', value: 'Shinhan Bank / KDU Virtual Account' },
    ],
    instructions: 'বর্তমান সেমিস্টার (e.g. 2026-1) এবং ফি পরিশোধের ক্লিয়ারেন্স দৃশ্যমান থাকতে হবে।',
  },
  {
    id: 'portal',
    badge: 'DEMO 3 (মোবাইল / ওয়েব)',
    titleKo: '포털 종합정보 화면',
    titleEn: 'KDU Student Portal Screenshot',
    subtitle: 'KDU 스마트 종합정보시스템 (portal.kdu.ac.kr) প্রোফাইল স্ক্রিনশট',
    docHeader: '경동대학교 스마트 포털 (KDU Portal Dashboard)',
    fields: [
      { label: '학생 성명 (Name)', value: 'MOHAMMAD TANVIR', isHighlight: true },
      { label: '학번 (ID Number)', value: '20241088', isHighlight: true },
      { label: '소속학과 (Department)', value: 'Smart Computing' },
      { label: '학적구분 (Status)', value: '재학생 (Active Student)', isHighlight: true },
      { label: '수강신청 (Courses)', value: '2026-1학기 18학점 수강중' },
    ],
    instructions: 'পোর্টালের লগইন থাকা অবস্থায় আপনার নাম, আইডি ও বর্তমান সেমিস্টার দেখা যেতে হবে।',
  },
];

interface Step2Props {
  document: UploadedDocument;
  updateDocument: (doc: Partial<UploadedDocument>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  redGuidelineText?: string;
}

export const Step2DocumentUpload: React.FC<Step2Props> = ({
  document,
  updateDocument,
  onBack,
  onSubmit,
  isSubmitting,
  redGuidelineText,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoSample | null>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const MAX_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      setErrorMsg('File size must be under 5 MB');
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Allowed formats: PDF, PNG, JPG, WEBP');
      return;
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateDocument({
          file,
          fileName: file.name,
          fileSize: sizeFormatted,
          fileType: file.type,
          previewUrl: e.target?.result as string,
          uploadedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    } else {
      updateDocument({
        file,
        fileName: file.name,
        fileSize: sizeFormatted,
        fileType: file.type,
        previewUrl: null,
        uploadedAt: new Date().toISOString(),
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!document.file && !document.fileName) {
      setErrorMsg('Please upload a student proof document');
      return;
    }
    onSubmit();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-md mx-auto overflow-hidden">
      {/* Minimal Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#006A3D]">
            Step 2 of 3
          </span>
          <span className="text-xs text-slate-400">Document Upload</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          প্রমাণপত্র জমা
        </h2>
        <p className="text-xs font-bold text-[#D62828] mt-1.5 leading-relaxed">
          {redGuidelineText || 'Certificate of Enrollment (재학증명서) বা Tuition Fee Receipt বা Current Semester Portal Screenshot অথবা anything that proves you are currently studying in KDU'}
        </p>

        {/* 3 Demo Document Sample Cards (as requested by user) */}
        <div className="pt-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
            <span>নমুনা ডকুমেন্ট দেখুন (Demo Samples):</span>
            <span className="text-[#006A3D] lowercase font-medium">ক্লিক করে বড় দেখুন</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Demo 1: Certificate of Enrollment */}
            <button
              type="button"
              onClick={() => setSelectedDemo(DEMO_SAMPLES[0])}
              className="p-2 rounded-xl border border-slate-200 hover:border-[#006A3D] bg-slate-50/70 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-bold text-slate-400 font-mono">DEMO 1</span>
                <span className="w-2 h-2 rounded-full bg-[#006A3D]/40 group-hover:bg-[#006A3D]" />
              </div>
              <div className="space-y-0.5">
                <div className="w-5 h-6 rounded bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                  <span className="text-[8px] font-bold text-[#006A3D]">재학</span>
                </div>
                <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">
                  재학증명서
                </p>
                <p className="text-[9px] text-slate-500 leading-none truncate">
                  Enrollment Cert
                </p>
              </div>
            </button>

            {/* Demo 2: Tuition Fee Receipt */}
            <button
              type="button"
              onClick={() => setSelectedDemo(DEMO_SAMPLES[1])}
              className="p-2 rounded-xl border border-slate-200 hover:border-[#006A3D] bg-slate-50/70 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-bold text-slate-400 font-mono">DEMO 2</span>
                <span className="w-2 h-2 rounded-full bg-blue-500/40 group-hover:bg-blue-600" />
              </div>
              <div className="space-y-0.5">
                <div className="w-5 h-6 rounded bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                  <span className="text-[8px] font-bold text-blue-600">영수</span>
                </div>
                <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">
                  등록금 영수증
                </p>
                <p className="text-[9px] text-slate-500 leading-none truncate">
                  Tuition Receipt
                </p>
              </div>
            </button>

            {/* Demo 3: Student Portal */}
            <button
              type="button"
              onClick={() => setSelectedDemo(DEMO_SAMPLES[2])}
              className="p-2 rounded-xl border border-slate-200 hover:border-[#006A3D] bg-slate-50/70 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-bold text-slate-400 font-mono">DEMO 3</span>
                <span className="w-2 h-2 rounded-full bg-amber-500/40 group-hover:bg-amber-600" />
              </div>
              <div className="space-y-0.5">
                <div className="w-5 h-6 rounded bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                  <span className="text-[8px] font-bold text-amber-600">포털</span>
                </div>
                <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">
                  포털 스크린샷
                </p>
                <p className="text-[9px] text-slate-500 leading-none truncate">
                  Portal Screen
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
          <div className="w-2/3 h-full bg-[#006A3D] rounded-full transition-all" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Upload Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Student Proof Document <span className="text-[#D62828]">*</span>
          </label>

          {!document.file && !document.fileName ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
              }}
              className={`border border-dashed rounded-xl p-8 text-center transition-all relative cursor-pointer ${
                isDragging
                  ? 'border-[#006A3D] bg-emerald-50/40'
                  : 'border-slate-300 hover:border-[#006A3D] hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Click or drag document to upload
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, PNG, JPG (Max 5MB)
              </p>
            </div>
          ) : (
            /* Selected File Chip */
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-[#006A3D] shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {document.fileName}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({document.fileSize})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateDocument({
                      file: null,
                      fileName: '',
                      fileSize: '',
                      previewUrl: null,
                    })
                  }
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {document.previewUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200 max-h-32 bg-white flex items-center justify-center">
                  <img
                    src={document.previewUrl}
                    alt="Preview"
                    className="max-h-32 w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>

        {/* Quiet Single Note */}
        <p className="text-[11px] text-slate-400 leading-normal">
          * নথির লেখা স্পষ্ট ও পাঠযোগ্য হতে হবে। ভুয়া তথ্য দিলে আবেদন বাতিল হবে।
        </p>

        {/* Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="py-2.5 px-3.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>পূর্ববর্তী</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#006A3D] hover:bg-[#005530] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
          >
            <span>{isSubmitting ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Demo Sample Document Preview Modal */}
      {selectedDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#006A3D] font-mono uppercase bg-[#E5F1E9] px-2 py-0.5 rounded">
                  {selectedDemo.badge}
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-1">
                  {selectedDemo.titleKo}
                </h4>
                <p className="text-[11px] text-slate-500">{selectedDemo.titleEn}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDemo(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Visual Mockup Container */}
            <div className="p-4 rounded-xl border border-slate-200 bg-[#FBFBFA] shadow-inner space-y-3 font-sans">
              <div className="text-center border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-bold text-slate-800 tracking-wider block">
                  {selectedDemo.docHeader}
                </span>
                <span className="text-[9px] text-slate-400">KYUNGDONG UNIVERSITY</span>
              </div>

              {/* Simulated Fields */}
              <div className="space-y-1.5 text-xs">
                {selectedDemo.fields.map((f, i) => (
                  <div
                    key={i}
                    className={`p-1.5 rounded-lg flex items-center justify-between text-[11px] ${
                      f.isHighlight
                        ? 'bg-amber-50 border border-amber-200 font-semibold text-amber-900'
                        : 'text-slate-600'
                    }`}
                  >
                    <span className="text-slate-500 text-[10px]">{f.label}:</span>
                    <span className="font-mono">{f.value}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Official Seal Representation */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Verification ID: #KDU-OK</span>
                <span className="w-6 h-6 rounded-full border border-red-300 text-[8px] font-bold text-red-500 flex items-center justify-center rotate-[-12deg]">
                  인
                </span>
              </div>
            </div>

            {/* Guideline Callout */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-[#006A3D] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{selectedDemo.instructions}</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedDemo(null)}
              className="w-full py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              বুঝেছি (Close Preview)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
