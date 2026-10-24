import React, { useState } from 'react';
import {
  FormSettings,
  DepartmentOption,
  CustomFormField,
  CustomFieldType,
  StudentFormData,
  DEPARTMENTS,
  BATCH_SEASONS,
  BATCH_YEARS,
} from '../types';
import { Step1StudentInfo } from './Step1StudentInfo';
import {
  Undo2,
  Redo2,
  Eye,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Edit3,
  ListChecks,
  Sliders,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface FormBuilderViewProps {
  initialSettings: FormSettings;
  onSaveSettings: (newSettings: FormSettings) => void;
}

const normalizeSettings = (s: FormSettings): FormSettings => ({
  headingText: s.headingText || 'শিক্ষার্থীর তথ্য',
  formSubtitle:
    s.formSubtitle || 'Fill in your details to verify your KDU enrollment.',
  redGuidelineText:
    s.redGuidelineText ||
    'Certificate of Enrollment (재학증명서) বা Tuition Fee Receipt বা Current Semester Portal Screenshot অথবা anything that proves you are currently studying in KDU',
  programs: s.programs?.length
    ? [...s.programs]
    : ['Language Program', 'Bachelor', 'Masters'],
  departments: s.departments?.length
    ? s.departments.map((d) => ({ ...d }))
    : DEPARTMENTS.map((d) => ({ ...d })),
  batchSeasons: s.batchSeasons?.length
    ? [...s.batchSeasons]
    : [...BATCH_SEASONS],
  batchYears: s.batchYears?.length ? [...s.batchYears] : [...BATCH_YEARS],
  fullNameLabel: s.fullNameLabel || 'Full Name (English)',
  studentIdLabel: s.studentIdLabel || 'KDU Student ID',
  departmentLabel: s.departmentLabel || 'Department / Major',
  batchLabel: s.batchLabel || 'Batch',
  phoneLabel: s.phoneLabel || 'Korea Phone Number',
  facebookLabel: s.facebookLabel || 'Facebook Profile URL',
  enablePhoneField:
    s.enablePhoneField !== undefined ? s.enablePhoneField : true,
  phoneRequired: s.phoneRequired ?? false,
  facebookRequired: s.facebookRequired ?? true,
  agreement1Text:
    s.agreement1Text ||
    'আমি নিশ্চিত করছি যে আমি KDU-র একজন বাংলাদেশি শিক্ষার্থী।',
  agreement2Text: s.agreement2Text || 'আমি কমিউনিটির নিয়মাবলী মেনে চলবো।',
  customFields: (s.customFields || []).map((f) => ({
    ...f,
    options: f.options ? [...f.options] : [],
  })),
  maxFileSizeMb: s.maxFileSizeMb || 5,
});

export const FormBuilderView: React.FC<FormBuilderViewProps> = ({
  initialSettings,
  onSaveSettings,
}) => {
  // History stack for Undo / Redo
  const [history, setHistory] = useState<FormSettings[]>([
    normalizeSettings(initialSettings),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // New Department quick inputs
  const [newDeptName, setNewDeptName] = useState<string>('');
  const [newDeptCode, setNewDeptCode] = useState<string>('');

  // New Program quick input
  const [newProgramName, setNewProgramName] = useState<string>('');

  // Preview dummy form data
  const [previewFormData, setPreviewFormData] = useState<StudentFormData>({
    program: 'Bachelor',
    fullName: '',
    studentId: '',
    department: '',
    batchSeason: 'Spring',
    batchYear: BATCH_YEARS[0] || String(new Date().getFullYear()),
    phone: '',
    facebookUrl: '',
    confirmKduStudent: false,
    confirmCommunityRules: false,
    customFieldValues: {},
  });

  const currentSettings = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Push new state to Undo/Redo history stack
  const updateDraft = (updater: (prev: FormSettings) => FormSettings) => {
    const nextState = normalizeSettings(updater(currentSettings));
    const slicedHistory = history.slice(0, historyIndex + 1);
    setHistory([...slicedHistory, nextState]);
    setHistoryIndex(slicedHistory.length);
    setSavedNotice(false);
  };

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex((i) => i - 1);
      setSavedNotice(false);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex((i) => i + 1);
      setSavedNotice(false);
    }
  };

  const handleSave = () => {
    onSaveSettings(currentSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Department helpers
  const departments = currentSettings.departments || [];

  const handleAddDepartment = () => {
    const nameEn = newDeptName.trim();
    if (!nameEn) return;
    const code =
      newDeptCode.trim().toUpperCase() ||
      nameEn
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);

    const newDept: DepartmentOption = {
      id: `dept-${Date.now()}`,
      nameEn,
      nameBn: nameEn,
      code,
    };

    updateDraft((prev) => ({
      ...prev,
      departments: [...(prev.departments || []), newDept],
    }));
    setNewDeptName('');
    setNewDeptCode('');
  };

  const handleUpdateDepartment = (
    id: string,
    patch: Partial<DepartmentOption>
  ) => {
    updateDraft((prev) => ({
      ...prev,
      departments: (prev.departments || []).map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    }));
  };

  const handleDeleteDepartment = (id: string) => {
    updateDraft((prev) => ({
      ...prev,
      departments: (prev.departments || []).filter((d) => d.id !== id),
    }));
  };

  const handleMoveDepartment = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= departments.length) return;
    updateDraft((prev) => {
      const list = [...(prev.departments || [])];
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, departments: list };
    });
  };

  // Custom Question (Google Forms style) helpers
  const customFields = currentSettings.customFields || [];

  const handleAddQuestion = () => {
    const newField: CustomFormField = {
      id: `q-${Date.now()}`,
      label: 'নতুন প্রশ্ন (New Question)',
      placeholder: 'উত্তর লিখুন...',
      type: 'text',
      options: ['Option 1', 'Option 2'],
      showFor: 'all',
      required: false,
    };
    updateDraft((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));
  };

  const handleUpdateQuestion = (
    id: string,
    patch: Partial<CustomFormField>
  ) => {
    updateDraft((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) =>
        f.id === id ? { ...f, ...patch } : f
      ),
    }));
  };

  const handleDuplicateQuestion = (field: CustomFormField) => {
    const copy: CustomFormField = {
      ...field,
      id: `q-${Date.now()}`,
      label: `${field.label} (Copy)`,
      options: field.options ? [...field.options] : [],
    };
    updateDraft((prev) => ({
      ...prev,
      customFields: [...prev.customFields, copy],
    }));
  };

  const handleDeleteQuestion = (id: string) => {
    updateDraft((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f.id !== id),
    }));
  };

  const handleMoveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= customFields.length) return;
    updateDraft((prev) => {
      const list = [...prev.customFields];
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, customFields: list };
    });
  };

  return (
    <div className="space-y-3 pb-6">
      {/* ======================= STICKY GOOGLE FORMS TOOLBAR ======================= */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 px-3.5 py-2.5 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
              canUndo
                ? 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                : 'border-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Undo (পূর্বের অবস্থায় ফিরুন)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold hidden sm:inline">
              Undo
            </span>
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
              canRedo
                ? 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                : 'border-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Redo (পরবর্তী অবস্থায় যান)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold hidden sm:inline">
              Redo
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Preview / Edit Toggle */}
          <button
            type="button"
            onClick={() => setIsPreviewMode((p) => !p)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isPreviewMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isPreviewMode ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Mode</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </>
            )}
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-xl bg-[#006A3D] hover:bg-[#005530] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            {savedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================= PREVIEW MODE ======================= */}
      {isPreviewMode ? (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="bg-[#E5F1E9] border border-[#006A3D]/20 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-[#006A3D]">
            <span className="font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>লাইভ ফরম প্রিভিউ (শিক্ষার্থীরা যেভাবে দেখবে)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className="text-[11px] font-bold underline cursor-pointer"
            >
              এডিটে ফিরুন
            </button>
          </div>

          <Step1StudentInfo
            formData={previewFormData}
            updateFormData={(patch) =>
              setPreviewFormData((prev) => ({ ...prev, ...patch }))
            }
            onNext={() => {}}
            formSettings={currentSettings}
          />

          {/* Step 2 Guideline Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Step 2 Document Guideline Preview
            </span>
            <p className="text-xs font-bold text-[#D62828] leading-relaxed">
              {currentSettings.redGuidelineText}
            </p>
          </div>
        </div>
      ) : (
        /* ======================= GOOGLE FORMS EDIT MODE ======================= */
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* 1. Form Title & Step 2 Document Guideline Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="h-2 bg-[#006A3D]" />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#006A3D]">
                  ফরম শিরোনাম ও নির্দেশনা
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft(() =>
                      normalizeSettings({
                        headingText: 'শিক্ষার্থীর তথ্য',
                        formSubtitle:
                          'Fill in your details to verify your KDU enrollment.',
                        redGuidelineText:
                          'Certificate of Enrollment (재학증명서) বা Tuition Fee Receipt বা Current Semester Portal Screenshot অথবা anything that proves you are currently studying in KDU',
                        customFields: [],
                        enablePhoneField: true,
                        maxFileSizeMb: 5,
                      })
                    )
                  }
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="ডিফল্ট ফরমে রিসেট করুন"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ডিফল্ট রিসেট</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  ফরমের শিরোনাম (Form Title)
                </label>
                <input
                  type="text"
                  value={currentSettings.headingText}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      headingText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  সাবটাইটেল (Description)
                </label>
                <input
                  type="text"
                  value={currentSettings.formSubtitle || ''}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      formSubtitle: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 text-xs text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  ডকুমেন্ট আপলোড নির্দেশনা (Step 2 Red Guideline)
                </label>
                <textarea
                  rows={2}
                  value={currentSettings.redGuidelineText}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      redGuidelineText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D]"
                />
              </div>
            </div>
          </div>

          {/* 2. Department / Major Dropdown Editor Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#006A3D]" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    ডিপার্টমেন্ট তালিকা (Department Dropdown)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    ভবিষ্যতে নতুন ডিপার্টমেন্ট চালু হলে এখানে যোগ বা পরিবর্তন করুন
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {departments.length}টি
              </span>
            </div>

            {/* Existing Departments List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
              {departments.map((dept, idx) => (
                <div
                  key={dept.id}
                  className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/70 rounded-xl p-1.5"
                >
                  <input
                    type="text"
                    value={dept.code}
                    onChange={(e) =>
                      handleUpdateDepartment(dept.id, {
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="CODE"
                    className="w-14 px-2 py-1 text-[11px] font-mono font-bold text-[#006A3D] bg-white border border-slate-200 rounded-lg text-center focus:outline-none focus:border-[#006A3D]"
                  />
                  <input
                    type="text"
                    value={dept.nameEn}
                    onChange={(e) =>
                      handleUpdateDepartment(dept.id, {
                        nameEn: e.target.value,
                        nameBn: e.target.value,
                      })
                    }
                    placeholder="Department Name"
                    className="flex-1 min-w-0 px-2.5 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006A3D]"
                  />
                  <button
                    type="button"
                    onClick={() => handleMoveDepartment(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDepartment(idx, 1)}
                    disabled={idx === departments.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                    title="Delete Department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Department Row */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                placeholder="কোড (যেমন: AI)"
                className="w-24 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#006A3D]"
              />
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDepartment();
                  }
                }}
                placeholder="নতুন ডিপার্টমেন্টের নাম লিখুন..."
                className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#006A3D]"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-3 py-1.5 rounded-xl bg-[#006A3D] hover:bg-[#005530] text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>যোগ</span>
              </button>
            </div>
          </div>

          {/* 3. Programs Quick Editor */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#006A3D]" />
                <h3 className="text-xs font-bold text-slate-900">
                  প্রোগ্রাম তালিকা (Programs)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                ব্যাচ সাল অটোমেটিক ({BATCH_YEARS[0]}–{BATCH_YEARS[BATCH_YEARS.length - 1]})
              </span>
            </div>

            {/* Programs */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {(currentSettings.programs || []).map((prog) => (
                  <span
                    key={prog}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    <span>{prog}</span>
                    {(currentSettings.programs?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((prev) => ({
                            ...prev,
                            programs: (prev.programs || []).filter(
                              (p) => p !== prog
                            ),
                          }))
                        }
                        className="text-slate-400 hover:text-red-500 ml-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="নতুন প্রোগ্রাম (যেমন: PhD)"
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#006A3D]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newProgramName.trim();
                    if (!val) return;
                    updateDraft((prev) => ({
                      ...prev,
                      programs: Array.from(
                        new Set([...(prev.programs || []), val])
                      ),
                    }));
                    setNewProgramName('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  + যোগ
                </button>
              </div>
            </div>
          </div>

          {/* 4. Standard Fields Quick Toggles */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#006A3D]" />
              <h3 className="text-xs font-bold text-slate-900">
                ডিফল্ট ফিল্ড সেটিংস
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">
                  Name Field Label
                </label>
                <input
                  type="text"
                  value={currentSettings.fullNameLabel || ''}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      fullNameLabel: e.target.value,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">
                  Student ID Label
                </label>
                <input
                  type="text"
                  value={currentSettings.studentIdLabel || ''}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      studentIdLabel: e.target.value,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.enablePhoneField}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      enablePhoneField: e.target.checked,
                    }))
                  }
                  className="accent-[#006A3D] rounded"
                />
                <span className="text-slate-700 font-medium">
                  Phone Number ফিল্ড রাখুন
                </span>
              </label>

              {currentSettings.enablePhoneField && (
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500">
                  <input
                    type="checkbox"
                    checked={!!currentSettings.phoneRequired}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        phoneRequired: e.target.checked,
                      }))
                    }
                    className="accent-[#006A3D] rounded"
                  />
                  <span>Required</span>
                </label>
              )}
            </div>
          </div>

          {/* 5. Google Forms-Style Custom Question Cards */}
          <div className="space-y-2.5">
            {customFields.map((field, idx) => (
              <div
                key={field.id}
                className="bg-white rounded-2xl border-l-4 border-l-[#006A3D] border border-slate-200/80 p-4 shadow-2xs space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Question Label */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      প্রশ্নের নাম (Question Label)
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        handleUpdateQuestion(field.id, {
                          label: e.target.value,
                          labelEn: e.target.value,
                          labelBn: e.target.value,
                        })
                      }
                      placeholder="যেমন: Semester / Dormitory Name"
                      className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D]"
                    />
                  </div>

                  {/* Question Type */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      ফিল্ডের ধরন (Type)
                    </label>
                    <select
                      value={field.type || 'text'}
                      onChange={(e) =>
                        handleUpdateQuestion(field.id, {
                          type: e.target.value as CustomFieldType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                    >
                      <option value="text">Short Answer (Text)</option>
                      <option value="select">Dropdown (Select)</option>
                      <option value="number">Number / ID</option>
                      <option value="tel">Phone Number</option>
                      <option value="url">Link (URL)</option>
                    </select>
                  </div>
                </div>

                {/* Placeholder & Program Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">
                      Placeholder / Hint
                    </label>
                    <input
                      type="text"
                      value={field.placeholder}
                      onChange={(e) =>
                        handleUpdateQuestion(field.id, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="উত্তর লিখুন..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">
                      কোন প্রোগ্রামে দেখাবে?
                    </label>
                    <select
                      value={field.showFor || 'all'}
                      onChange={(e) =>
                        handleUpdateQuestion(field.id, {
                          showFor: e.target.value as
                            | 'all'
                            | 'non_language'
                            | 'language_only',
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                    >
                      <option value="all">সব প্রোগ্রামে (All Programs)</option>
                      <option value="non_language">
                        শুধু Bachelor / Masters
                      </option>
                      <option value="language_only">
                        শুধু Language Program
                      </option>
                    </select>
                  </div>
                </div>

                {/* Dropdown Options Editor if Type === 'select' */}
                {field.type === 'select' && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      ড্রপডাউন অপশনসমূহ (Dropdown Options)
                    </span>
                    <div className="space-y-1.5">
                      {(field.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 w-4">
                            {optIdx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const nextOpts = [...(field.options || [])];
                              nextOpts[optIdx] = e.target.value;
                              handleUpdateQuestion(field.id, {
                                options: nextOpts,
                              });
                            }}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextOpts = (field.options || []).filter(
                                (_, i) => i !== optIdx
                              );
                              handleUpdateQuestion(field.id, {
                                options: nextOpts,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuestion(field.id, {
                          options: [
                            ...(field.options || []),
                            `Option ${(field.options?.length || 0) + 1}`,
                          ],
                        })
                      }
                      className="text-[11px] font-semibold text-[#006A3D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>নতুন অপশন যোগ করুন</span>
                    </button>
                  </div>
                )}

                {/* Google Forms Card Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(idx, 1)}
                      disabled={idx === customFields.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(field)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Duplicate Question"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(field.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <span>Required</span>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        handleUpdateQuestion(field.id, {
                          required: e.target.checked,
                        })
                      }
                      className="accent-[#006A3D] w-3.5 h-3.5 rounded"
                    />
                  </label>
                </div>
              </div>
            ))}

            {/* Add New Question Button (Google Forms + Button) */}
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-[#006A3D]/40 hover:border-[#006A3D] bg-[#E5F1E9]/40 hover:bg-[#E5F1E9] text-[#006A3D] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্রশ্ন / ফিল্ড যোগ করুন (Add Question)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
