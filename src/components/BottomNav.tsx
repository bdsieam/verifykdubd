import React from 'react';
import {
  ShieldCheck,
  Users,
  BookOpen,
  FileSearch,
  CheckSquare,
  History,
  Menu,
} from 'lucide-react';
import { AdminTab } from '../types';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isAdminMode?: boolean;
  isMasterAdmin?: boolean;
  adminTab?: AdminTab;
  onSelectAdminTab?: (tab: AdminTab) => void;
  onOpenSlideBar?: () => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  isAdminMode = false,
  isMasterAdmin = false,
  adminTab = 'verify_queue',
  onSelectAdminTab,
  onOpenSlideBar,
  pendingCount = 0,
}) => {
  // When in Admin Portal, hide user buttons and show important Admin quick-access buttons
  if (isAdminMode) {
    return (
      <nav
        aria-label="Admin Quick Access Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg"
      >
        <div
          className={`max-w-md mx-auto px-2 h-14 grid ${
            isMasterAdmin ? 'grid-cols-4' : 'grid-cols-3'
          } gap-1`}
        >
          {/* 1. Verify Queue */}
          <button
            type="button"
            onClick={() => onSelectAdminTab && onSelectAdminTab('verify_queue')}
            className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              adminTab === 'verify_queue'
                ? 'text-[#006A3D] font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <div className="relative">
              <CheckSquare
                className={`w-4 h-4 ${
                  adminTab === 'verify_queue' ? 'stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#D62828] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">যাচাই</span>
          </button>

          {/* 3. Representatives (Master Admin Only) */}
          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => onSelectAdminTab && onSelectAdminTab('reps')}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                adminTab === 'reps'
                  ? 'text-[#006A3D] font-bold'
                  : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <Users
                className={`w-4 h-4 ${
                  adminTab === 'reps' ? 'stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] tracking-tight">প্রতিনিধি</span>
            </button>
          )}

          {/* 4. Activity Logs */}
          <button
            type="button"
            onClick={() => onSelectAdminTab && onSelectAdminTab('logs')}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              adminTab === 'logs'
                ? 'text-[#006A3D] font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <History
              className={`w-4 h-4 ${
                adminTab === 'logs' ? 'stroke-[2.4]' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[10px] tracking-tight">রেকর্ড</span>
          </button>

          {/* 5. Slide Bar / More Menu */}
          <button
            type="button"
            onClick={onOpenSlideBar}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              adminTab === 'accounts' || adminTab === 'form_edit'
                ? 'text-[#006A3D] font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Menu className="w-4 h-4 stroke-[2]" />
            <span className="text-[10px] tracking-tight">মেনু</span>
          </button>
        </div>
      </nav>
    );
  }

  // Regular Public User Navigation
  const navItems = [
    { id: 'verify', label: 'Verify', icon: ShieldCheck },
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { id: 'status', label: 'Status', icon: FileSearch },
  ];

  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg"
    >
      <div className="max-w-md mx-auto px-2 h-14 grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#006A3D] font-bold'
                  : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
