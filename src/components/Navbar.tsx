import React from 'react';
import { ShieldCheck, Lock, Menu, Globe } from 'lucide-react';

interface NavbarProps {
  isAdminLoggedIn?: boolean;
  isAdminPortalOpen?: boolean;
  isSearchActive?: boolean;
  onAdminClick?: () => void;
  onOpenSearch?: () => void;
  onOpenSlideBar?: () => void;
  onSwitchToPublic?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminLoggedIn = false,
  isAdminPortalOpen = false,
  onAdminClick,
  onOpenSlideBar,
  onSwitchToPublic,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-md mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#006A3D] flex items-center justify-center text-white font-bold text-xs">
            KDU
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-xs tracking-tight">
              KDU Bangla Community
            </span>
            {isAdminPortalOpen && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAdminPortalOpen ? (
            <>
              <button
                type="button"
                onClick={onSwitchToPublic}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
                title="Switch to Public View"
              >
                <Globe className="w-3 h-3" />
                <span>সাইট</span>
              </button>
              <button
                type="button"
                onClick={onOpenSlideBar}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Open Admin Slide Bar"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onAdminClick}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                isAdminLoggedIn
                  ? 'text-white bg-[#006A3D] border-[#006A3D] shadow-xs'
                  : 'text-[#006A3D] bg-[#E5F1E9] hover:bg-[#d5e8dc] border-[#006A3D]/20'
              }`}
            >
              {isAdminLoggedIn ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Portal</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Admin login</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
