import React, { useState } from 'react';
import { DEPARTMENTS, RepresentativeItem } from '../types';
import { ExternalLink, Mail, Calendar, User } from 'lucide-react';

interface DirectoryViewProps {
  representatives?: RepresentativeItem[];
}

export const DEFAULT_REPS_DATA: RepresentativeItem[] = [];

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  representatives = DEFAULT_REPS_DATA,
}) => {
  const [filterDept, setFilterDept] = useState<string>('all');

  const filteredReps = representatives.filter((rep) => {
    if (filterDept === 'all') return true;
    return rep.deptId === filterDept;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-md mx-auto p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Department Representatives
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Elected departmental seniors for peer guidance and academic life.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterDept('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            filterDept === 'all'
              ? 'bg-[#006A3D] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            onClick={() => setFilterDept(d.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              filterDept === d.id
                ? 'bg-[#006A3D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d.id.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Reps Cards */}
      <div className="space-y-3">
        {filteredReps.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-200/70 bg-slate-50/50 text-center space-y-1.5">
            <User className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              কোনো প্রতিনিধি তালিকাভুক্ত করা হয়নি
            </p>
            <p className="text-[11px] text-slate-400">
              অ্যাডমিন প্যানেল থেকে প্রতিনিধি যুক্ত করা হলে এখানে প্রদর্শিত হবে।
            </p>
          </div>
        ) : (
          filteredReps.map((rep, idx) => {
            const dept = DEPARTMENTS.find((d) => d.id === rep.deptId);
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {rep.photoUrl ? (
                        <img
                          src={rep.photoUrl}
                          alt={rep.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-[#006A3D] text-xs">
                          {rep.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{rep.name}</h4>
                      <p className="text-[11px] text-slate-500">{dept?.nameEn}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#006A3D] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {rep.role}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 pl-11">
                  <Calendar className="w-3 h-3" />
                  <span>{rep.term}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                  <a
                    href={rep.fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#006A3D] font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Facebook Profile</span>
                  </a>
                  <a
                    href={`mailto:${rep.email}`}
                    className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
