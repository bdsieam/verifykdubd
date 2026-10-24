import React, { useState } from 'react';
import {
  StudentFormData,
  ProgramType,
  DEPARTMENTS,
  BATCH_SEASONS,
  BATCH_YEARS,
  FormCustomField,
  FormSettings,
} from '../types';
import { ArrowRight } from 'lucide-react';

interface Step1Props {
  formData: StudentFormData;
  updateFormData: (data: Partial<StudentFormData>) => void;
  onNext: () => void;
  customFields?: FormCustomField[];
  formSettings?: FormSettings;
}

export const Step1StudentInfo: React.FC<Step1Props> = ({
  formData,
  updateFormData,
  onNext,
  customFields = [],
  formSettings,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const programs = formSettings?.programs?.length
    ? formSettings.programs
    : ['Language Program', 'Bachelor', 'Masters'];

  const departments = formSettings?.departments?.length
    ? formSettings.departments
    : DEPARTMENTS;

  const batchSeasons = formSettings?.batchSeasons?.length
    ? formSettings.batchSeasons
    : BATCH_SEASONS;

  const batchYears = BATCH_YEARS;

  const enablePhone =
    formSettings?.enablePhoneField !== undefined
      ? formSettings.enablePhoneField
      : true;

  const phoneRequired = formSettings?.phoneRequired ?? false;

  const activeCustomFields = formSettings?.customFields || customFields;

  const isLanguage = formData.program === 'Language Program';

  // Filter custom fields based on program visibility
  const visibleCustomFields = activeCustomFields.filter((f) => {
    if (!f.showFor || f.showFor === 'all') return true;
    if (f.showFor === 'non_language') return !isLanguage;
    if (f.showFor === 'language_only') return isLanguage;
    return true;
  });

  const handleProgramSelect = (program: ProgramType) => {
    updateFormData({ program });
    const newErrors = { ...errors };
    delete newErrors.studentId;
    delete newErrors.department;
    delete newErrors.batch;
    setErrors(newErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      errs.fullName = 'Please enter your full name (English, as per ID)';
    }

    if (!isLanguage) {
      if (!formData.studentId.trim()) {
        errs.studentId = 'KDU student ID is required';
      }
      if (!formData.department) {
        errs.department = 'Please select your department';
      }
      if (!formData.batchSeason || !formData.batchYear) {
        errs.batch = 'Please select batch';
      }
    }

    if (enablePhone && phoneRequired && !formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    }

    if (!formData.confirmKduStudent) {
      errs.confirmKduStudent = 'Confirmation is required';
    }
    if (!formData.confirmCommunityRules) {
      errs.confirmCommunityRules = 'Agreement is required';
    }

    // Dynamic custom fields validation
    visibleCustomFields.forEach((field) => {
      if (field.required) {
        const val = formData.customFieldValues?.[field.id]?.trim();
        if (!val) {
          errs[`custom_${field.id}`] = `${field.label || field.labelEn || 'This field'} is required`;
        }
      }
    });

    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onNext();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-md mx-auto overflow-hidden">
      {/* Minimal Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#006A3D]">
            Step 1 of 3
          </span>
          <span className="text-xs text-slate-400">Student Info</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {formSettings?.headingText || 'শিক্ষার্থীর তথ্য'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {formSettings?.formSubtitle ||
            'Fill in your details to verify your KDU enrollment.'}
        </p>

        {/* Minimal Progress Bar */}
        <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
          <div className="w-1/3 h-full bg-[#006A3D] rounded-full transition-all" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Program Segmented Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Program <span className="text-[#D62828]">*</span>
          </label>
          <div
            className="grid gap-1 p-1 bg-slate-100 rounded-xl"
            style={{
              gridTemplateColumns: `repeat(${Math.min(programs.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {programs.map((p) => {
              const active = formData.program === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProgramSelect(p)}
                  className={`py-1.5 px-1 text-xs font-medium rounded-lg transition-all cursor-pointer truncate ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p === 'Language Program' ? 'Language' : p}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {formSettings?.fullNameLabel || 'Full Name (English)'}{' '}
            <span className="text-[#D62828]">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="As per Student ID / Passport"
            className={`w-full px-3 py-2 text-xs border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D] focus:ring-1 focus:ring-[#006A3D] ${
              errors.fullName ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.fullName && (
            <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* 2-4: Show ONLY if NOT Language Program */}
        {!isLanguage && (
          <>
            {/* 2. Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formSettings?.studentIdLabel || 'KDU Student ID'}{' '}
                <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => updateFormData({ studentId: e.target.value })}
                placeholder="e.g. 20241088"
                className={`w-full px-3 py-2 text-xs font-mono border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D] focus:ring-1 focus:ring-[#006A3D] ${
                  errors.studentId ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.studentId && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.studentId}
                </p>
              )}
            </div>

            {/* 3. Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formSettings?.departmentLabel || 'Department / Major'}{' '}
                <span className="text-[#D62828]">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => updateFormData({ department: e.target.value })}
                className={`w-full px-3 py-2 text-xs border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D] ${
                  errors.department ? 'border-red-400' : 'border-slate-200'
                }`}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.nameEn}>
                    {dept.nameEn} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.department}
                </p>
              )}
            </div>

            {/* 4. Batch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formSettings?.batchLabel || 'Batch'}{' '}
                <span className="text-[#D62828]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formData.batchSeason}
                  onChange={(e) =>
                    updateFormData({ batchSeason: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D]"
                >
                  {batchSeasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.batchYear}
                  onChange={(e) =>
                    updateFormData({ batchYear: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D]"
                >
                  {batchYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {errors.batch && (
                <p className="text-[11px] text-red-600 mt-1">{errors.batch}</p>
              )}
            </div>
          </>
        )}

        {/* 5. Contact */}
        {enablePhone && (
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {formSettings?.phoneLabel || 'Korea Phone Number'}{' '}
              {phoneRequired ? (
                <span className="text-[#D62828]">*</span>
              ) : (
                <span className="text-slate-400 font-normal">(Optional)</span>
              )}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              placeholder="+82 10-XXXX-XXXX"
              className={`w-full px-3 py-2 text-xs border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D] ${
                errors.phone ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {errors.phone && (
              <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
            )}
          </div>
        )}

        {/* Dynamic Custom Fields Added by Admin (Google Forms Style) */}
        {visibleCustomFields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {visibleCustomFields.map((field) => {
              const errorKey = `custom_${field.id}`;
              const val = formData.customFieldValues?.[field.id] || '';
              const fieldLabel =
                field.label || field.labelBn || field.labelEn || 'Custom Field';

              return (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {fieldLabel}{' '}
                    {field.required && <span className="text-[#D62828]">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={val}
                      onChange={(e) => {
                        const updated = {
                          ...(formData.customFieldValues || {}),
                          [field.id]: e.target.value,
                        };
                        updateFormData({ customFieldValues: updated });
                      }}
                      className={`w-full px-3 py-2 text-xs border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D] ${
                        errors[errorKey] ? 'border-red-400' : 'border-slate-200'
                      }`}
                    >
                      <option value="">
                        {field.placeholder || 'Select an option'}
                      </option>
                      {(field.options || []).map((opt, idx) => (
                        <option key={`${field.id}-opt-${idx}`} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={val}
                      onChange={(e) => {
                        const updated = {
                          ...(formData.customFieldValues || {}),
                          [field.id]: e.target.value,
                        };
                        updateFormData({ customFieldValues: updated });
                      }}
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2 text-xs border rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#006A3D] ${
                        errors[errorKey] ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                  )}

                  {errors[errorKey] && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {errors[errorKey]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 6. Agreements */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.confirmKduStudent}
              onChange={(e) =>
                updateFormData({ confirmKduStudent: e.target.checked })
              }
              className="mt-0.5 rounded text-[#006A3D] focus:ring-[#006A3D] accent-[#006A3D]"
            />
            <span className="text-xs text-slate-600 leading-normal">
              {formSettings?.agreement1Text ||
                'আমি নিশ্চিত করছি যে আমি KDU-র একজন বাংলাদেশি শিক্ষার্থী।'}
            </span>
          </label>
          {errors.confirmKduStudent && (
            <p className="text-[11px] text-red-600 pl-6">
              {errors.confirmKduStudent}
            </p>
          )}

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.confirmCommunityRules}
              onChange={(e) =>
                updateFormData({ confirmCommunityRules: e.target.checked })
              }
              className="mt-0.5 rounded text-[#006A3D] focus:ring-[#006A3D] accent-[#006A3D]"
            />
            <span className="text-xs text-slate-600 leading-normal">
              {formSettings?.agreement2Text ||
                'আমি কমিউনিটির নিয়মাবলী মেনে চলবো।'}
            </span>
          </label>
          {errors.confirmCommunityRules && (
            <p className="text-[11px] text-red-600 pl-6">
              {errors.confirmCommunityRules}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#006A3D] hover:bg-[#005530] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>পরবর্তী ধাপ (Upload Document)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
