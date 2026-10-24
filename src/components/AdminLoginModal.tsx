import React, { useState } from 'react';
import { AdminUser, ActivityLog, RepresentativeAccount } from '../types';
import { Lock, User, X, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser, logEntry: ActivityLog) => void;
  accounts?: RepresentativeAccount[];
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  accounts = [],
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('ইউজার আইডি ও পাসওয়ার্ড উভয়ই প্রদান করুন');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      let loggedInUser: AdminUser;

      // Check matched representative account first
      const matchedAccount = accounts.find(
        (acc) => acc.username.toLowerCase() === cleanUser
      );

      if (cleanUser === 'admin' || cleanUser === 'superadmin' || cleanUser === 'lead') {
        try {
          const raw = localStorage.getItem('kdu_admin_passwords_prod');
          const passMap: Record<string, string> = raw ? JSON.parse(raw) : {};
          const savedAdminPass = passMap[cleanUser] || 'kdu2026';
          if (savedAdminPass !== cleanPass) {
            setLoading(false);
            setError('সঠিক পাসওয়ার্ড প্রদান করুন');
            return;
          }
        } catch {
          // Ignore storage error
        }
        loggedInUser = {
          id: 'adm-super-01',
          username: cleanUser,
          name: 'Lead Community Admin',
          role: 'Super Admin',
          lastLogin: new Date().toISOString(),
        };
      } else if (matchedAccount) {
        if (matchedAccount.password && matchedAccount.password !== cleanPass) {
          setLoading(false);
          setError('ইউজার আইডি অথবা পাসওয়ার্ড সঠিক নয়');
          return;
        }
        loggedInUser = {
          id: matchedAccount.id,
          username: matchedAccount.username,
          name: matchedAccount.repName || matchedAccount.username,
          role: 'Representative Admin',
          department: matchedAccount.department,
          lastLogin: new Date().toISOString(),
        };
      } else {
        setLoading(false);
        setError('ইউজার আইডি অথবা পাসওয়ার্ড সঠিক নয়');
        return;
      }

      const logEntry: ActivityLog = {
        id: `log-${Date.now()}`,
        actorId: loggedInUser.id,
        actorName: `${loggedInUser.name} (${loggedInUser.role})`,
        action: 'LOGIN',
        details: `অ্যাডমিন পোর্টাল লগইন সফল হয়েছে (ID: ${cleanUser})`,
        timestamp: new Date().toISOString(),
      };

      setLoading(false);
      onLoginSuccess(loggedInUser, logEntry);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#006A3D] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Admin & Representative Login
              </h3>
              <p className="text-[11px] text-slate-400">
                কেডিইউ অ্যাডমিন ও প্রতিনিধি পোর্টাল
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              User ID / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter User ID"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#006A3D] focus:ring-1 focus:ring-[#006A3D]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#006A3D] focus:ring-1 focus:ring-[#006A3D]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#006A3D] hover:bg-[#005530] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <span>{loading ? 'লগইন হচ্ছে...' : 'লগইন করুন (Sign In)'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
