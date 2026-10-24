import React, { useState } from 'react';
import {
  AdminUser,
  AdminTab,
  SubmittedApplication,
  RepresentativeItem,
  RepresentativeAccount,
  ActivityLog,
  FormSettings,
  DEPARTMENTS,
} from '../types';
import {
  Users,
  UserPlus,
  History,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  FileText,
  CheckSquare,
  Globe,
  X,
  Eye,
  BellRing,
  Download,
  Check,
  Smartphone,
  Sliders,
  Search,
  Phone,
  GraduationCap,
  Lock,
} from 'lucide-react';
import {
  usePWAInstall,
  usePushNotifications,
} from '../utils/pwaAndNotifications';
import { FormBuilderView } from './FormBuilderView';

interface AdminPortalProps {
  currentAdmin: AdminUser;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isSlideBarOpen: boolean;
  onCloseSlideBar: () => void;
  onSwitchToPublic: () => void;
  onLogout: () => void;
  applications: SubmittedApplication[];
  onReviewApplication: (
    referenceId: string,
    decision: 'approved' | 'rejected'
  ) => void;
  onSimulateIncomingApplication?: () => void;
  representatives: RepresentativeItem[];
  onUpdateRepresentatives: (
    reps: RepresentativeItem[],
    logEntry: ActivityLog
  ) => void;
  accounts: RepresentativeAccount[];
  onUpdateAccounts: (
    accounts: RepresentativeAccount[],
    logEntry: ActivityLog
  ) => void;
  activityLogs: ActivityLog[];
  formSettings: FormSettings;
  onUpdateFormSettings: (
    newSettings: FormSettings,
    logEntry: ActivityLog
  ) => void;
  onUpdateAdminPasswords?: (
    passMap: Record<string, string>,
    logEntry: ActivityLog
  ) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentAdmin,
  activeTab,
  onSelectTab,
  isSlideBarOpen,
  onCloseSlideBar,
  onSwitchToPublic,
  onLogout,
  applications,
  onReviewApplication,
  representatives,
  onUpdateRepresentatives,
  accounts,
  onUpdateAccounts,
  activityLogs,
  formSettings,
  onUpdateFormSettings,
  onUpdateAdminPasswords,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const [queueFilter, setQueueFilter] = useState<
    'pending' | 'approved' | 'rejected' | 'all'
  >('pending');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [inspectingApp, setInspectingApp] =
    useState<SubmittedApplication | null>(null);

  const [editingRep, setEditingRep] =
    useState<Partial<RepresentativeItem> | null>(null);
  const [repModalOpen, setRepModalOpen] = useState(false);

  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountSuccessMsg, setAccountSuccessMsg] = useState('');

  // Password Change state in Slide Bar
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const isMasterAdmin = currentAdmin.role === 'Super Admin';

  const availableDepartments = formSettings.departments?.length
    ? formSettings.departments
    : DEPARTMENTS;

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter(
    (a) => a.status === 'approved'
  ).length;
  const rejectedCount = applications.filter(
    (a) => a.status === 'rejected'
  ).length;

  const matchesSearch = (app: SubmittedApplication, rawQuery: string) => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    const nameMatch = app.formData.fullName.toLowerCase().includes(q);
    const idMatch = app.formData.studentId
      ? app.formData.studentId.toLowerCase().includes(q)
      : false;
    const refMatch = app.referenceId.toLowerCase().includes(q);
    const deptMatch = app.formData.department
      ? app.formData.department.toLowerCase().includes(q)
      : false;
    const phoneMatch = app.formData.phone
      ? app.formData.phone.toLowerCase().includes(q)
      : false;
    return nameMatch || idMatch || refMatch || deptMatch || phoneMatch;
  };

  const filteredApplications = applications.filter((app) => {
    const statusOk =
      queueFilter === 'all' ? true : app.status === queueFilter;
    return statusOk && matchesSearch(app, studentSearchQuery);
  });

  const searchTabResults = applications.filter((app) =>
    matchesSearch(app, studentSearchQuery)
  );

  // Save Representative (Add / Edit) - Master Admin Only
  const handleSaveRepresentative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) return;
    if (!editingRep || !editingRep.name?.trim()) return;

    let updatedList: RepresentativeItem[] = [];
    let logAction: 'REP_ADD' | 'REP_EDIT' = 'REP_ADD';
    let logDetails = '';

    if (editingRep.id) {
      logAction = 'REP_EDIT';
      logDetails = `প্রতিনিধি "${editingRep.name}"-এর তথ্য আপডেট করা হয়েছে`;
      updatedList = representatives.map((r) =>
        r.id === editingRep.id
          ? ({ ...r, ...editingRep } as RepresentativeItem)
          : r
      );
    } else {
      logAction = 'REP_ADD';
      const newRep: RepresentativeItem = {
        id: `rep-${Date.now()}`,
        name: editingRep.name.trim(),
        deptId: editingRep.deptId || availableDepartments[0]?.id || 'scai',
        role: editingRep.role?.trim() || 'Primary',
        term: editingRep.term || '2026.03 ~ 2027.02',
        fbUrl: editingRep.fbUrl || 'https://facebook.com',
        email: editingRep.email || '',
        photoUrl: editingRep.photoUrl || '',
      };
      logDetails = `নতুন প্রতিনিধি যুক্ত করা হয়েছে: "${newRep.name}"`;
      updatedList = [newRep, ...representatives];
    }

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      actorId: currentAdmin.id,
      actorName: `${currentAdmin.name} (${currentAdmin.username})`,
      action: logAction,
      details: logDetails,
      timestamp: new Date().toISOString(),
    };

    onUpdateRepresentatives(updatedList, log);
    setRepModalOpen(false);
    setEditingRep(null);
  };

  const handleDeleteRepresentative = (id: string, name: string) => {
    if (!isMasterAdmin) return;
    const updated = representatives.filter((r) => r.id !== id);
    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      actorId: currentAdmin.id,
      actorName: `${currentAdmin.name} (${currentAdmin.username})`,
      action: 'REP_DELETE',
      details: `প্রতিনিধি মুছে ফেলা হয়েছে: "${name}"`,
      timestamp: new Date().toISOString(),
    };
    onUpdateRepresentatives(updated, log);
  };

  // Create Representative Account - Master Admin Only (User ID + Password only)
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterAdmin) return;
    const cleanUsername = accountUsername.trim().toLowerCase();
    const cleanPassword = accountPassword.trim();
    if (!cleanUsername || !cleanPassword) return;

    const existingIndex = accounts.findIndex(
      (a) => a.username.toLowerCase() === cleanUsername
    );

    let updatedAccounts: RepresentativeAccount[];
    let logDetails = '';

    if (existingIndex >= 0) {
      updatedAccounts = accounts.map((acc, idx) =>
        idx === existingIndex
          ? {
              ...acc,
              password: cleanPassword,
              updatedAt: new Date().toISOString(),
            }
          : acc
      );
      logDetails = `প্রতিনিধি একাউন্ট (${cleanUsername})-এর পাসওয়ার্ড আপডেট করা হয়েছে`;
    } else {
      const newAcc: RepresentativeAccount = {
        id: `acc-${Date.now()}`,
        username: cleanUsername,
        password: cleanPassword,
        repName: cleanUsername,
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.username,
        status: 'active',
      };
      updatedAccounts = [newAcc, ...accounts];
      logDetails = `নতুন প্রতিনিধি একাউন্ট তৈরি করা হয়েছে (User ID: ${cleanUsername})`;
    }

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      actorId: currentAdmin.id,
      actorName: `${currentAdmin.name} (${currentAdmin.username})`,
      action: 'ACCOUNT_CREATE',
      details: logDetails,
      timestamp: new Date().toISOString(),
    };

    onUpdateAccounts(updatedAccounts, log);
    setAccountUsername('');
    setAccountPassword('');
    setAccountSuccessMsg(
      `একাউন্ট (${cleanUsername}) সফলভাবে তৈরি হয়েছে!`
    );
    setTimeout(() => setAccountSuccessMsg(''), 3000);
  };

  // Save Google Forms-style Form Settings
  const handleSaveFormSettings = (newSettings: FormSettings) => {
    const deptCount = newSettings.departments?.length || 0;
    const customCount = newSettings.customFields?.length || 0;
    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      actorId: currentAdmin.id,
      actorName: `${currentAdmin.name} (${currentAdmin.username})`,
      action: 'FORM_EDIT',
      details: `ভেরিফিকেশন ফরম আপডেট করা হয়েছে (${deptCount}টি ডিপার্টমেন্ট, ${customCount}টি অতিরিক্ত ফিল্ড)`,
      timestamp: new Date().toISOString(),
    };
    onUpdateFormSettings(newSettings, log);
  };

  // Change Password for Logged-in Admin / Representative
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setPasswordError('সবগুলো পাসওয়ার্ড ফিল্ড পূরণ করুন');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New Password এবং New Password Again মিলছে না');
      return;
    }

    const cleanCurrentUser = currentAdmin.username.trim().toLowerCase();
    const matchedAcc = accounts.find(
      (a) => a.username.toLowerCase() === cleanCurrentUser
    );

    let updatedPassMap: Record<string, string> = {};
    try {
      const raw = localStorage.getItem('kdu_admin_passwords_prod');
      const passMap: Record<string, string> = raw ? JSON.parse(raw) : {};
      const existingPass =
        matchedAcc?.password ||
        passMap[cleanCurrentUser] ||
        (isMasterAdmin ? 'kdu2026' : '');
      if (existingPass && existingPass !== oldPassword) {
        setPasswordError('Old Password সঠিক নয়');
        return;
      }
      passMap[cleanCurrentUser] = newPassword;
      updatedPassMap = passMap;
      localStorage.setItem('kdu_admin_passwords_prod', JSON.stringify(passMap));
    } catch {
      updatedPassMap = { [cleanCurrentUser]: newPassword };
    }

    // Sync updated password to Representative Accounts list so Master Admin always sees the latest password
    if (matchedAcc) {
      const updatedAccounts = accounts.map((acc) =>
        acc.username.toLowerCase() === cleanCurrentUser
          ? {
              ...acc,
              password: newPassword,
              updatedAt: new Date().toISOString(),
            }
          : acc
      );
      const log: ActivityLog = {
        id: `log-${Date.now()}`,
        actorId: currentAdmin.id,
        actorName: `${currentAdmin.name} (${currentAdmin.username})`,
        action: 'ACCOUNT_CREATE',
        details: `প্রতিনিধি "${currentAdmin.username}" নিজের পাসওয়ার্ড পরিবর্তন করেছেন`,
        timestamp: new Date().toISOString(),
      };
      onUpdateAccounts(updatedAccounts, log);
    } else if (currentAdmin.role !== 'Super Admin') {
      const newRepAcc: RepresentativeAccount = {
        id: `acc-${Date.now()}`,
        username: cleanCurrentUser,
        password: newPassword,
        repName: currentAdmin.name || cleanCurrentUser,
        createdAt: new Date().toISOString(),
        createdBy: cleanCurrentUser,
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      const log: ActivityLog = {
        id: `log-${Date.now()}`,
        actorId: currentAdmin.id,
        actorName: `${currentAdmin.name} (${currentAdmin.username})`,
        action: 'ACCOUNT_CREATE',
        details: `প্রতিনিধি "${currentAdmin.username}" নিজের পাসওয়ার্ড আপডেট করেছেন`,
        timestamp: new Date().toISOString(),
      };
      onUpdateAccounts([newRepAcc, ...accounts], log);
    } else if (onUpdateAdminPasswords) {
      const log: ActivityLog = {
        id: `log-${Date.now()}`,
        actorId: currentAdmin.id,
        actorName: `${currentAdmin.name} (${currentAdmin.username})`,
        action: 'ACCOUNT_CREATE',
        details: `অ্যাডমিন "${currentAdmin.username}" নিজের পাসওয়ার্ড পরিবর্তন করেছেন`,
        timestamp: new Date().toISOString(),
      };
      onUpdateAdminPasswords(updatedPassMap, log);
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordSuccess('Password সফলভাবে আপডেট করা হয়েছে!');
    setTimeout(() => setPasswordSuccess(''), 3500);
  };

  const renderApplicationCard = (app: SubmittedApplication) => {
    const isLanguage = app.formData.program === 'Language Program';
    return (
      <div
        key={app.referenceId}
        className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs space-y-2.5"
      >
        {/* Top Row: Name, Program & Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs font-bold text-slate-900">
                {app.formData.fullName || 'Unnamed Student'}
              </h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {app.formData.program}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              {app.referenceId}
              {!isLanguage && app.formData.studentId
                ? ` · ID: ${app.formData.studentId}`
                : ''}
              {` · ${app.formData.batchSeason} ${app.formData.batchYear}`}
            </p>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              app.status === 'approved'
                ? 'bg-emerald-50 text-[#006A3D]'
                : app.status === 'rejected'
                ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {app.status === 'approved'
              ? 'Approved'
              : app.status === 'rejected'
              ? 'Rejected'
              : 'Pending'}
          </span>
        </div>

        {/* Minimal Details Line (Department & Phone) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-50 text-[11px] text-slate-600">
          <span className="truncate max-w-[65%] flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {!isLanguage && app.formData.department
                ? app.formData.department
                : 'Korean Language Program'}
            </span>
          </span>
          {app.formData.phone && (
            <span className="text-slate-600 font-mono text-[10px] inline-flex items-center gap-1 shrink-0">
              <Phone className="w-2.5 h-2.5 text-[#006A3D]" />
              <span>{app.formData.phone}</span>
            </span>
          )}
        </div>

        {/* Document & Action Row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setInspectingApp(app)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#006A3D]" />
            <span>বিস্তারিত ও ডকুমেন্ট</span>
          </button>

          <div className="flex items-center gap-1.5">
            {app.status !== 'rejected' && (
              <button
                type="button"
                onClick={() =>
                  onReviewApplication(app.referenceId, 'rejected')
                }
                className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>বাতিল</span>
              </button>
            )}
            {app.status !== 'approved' && (
              <button
                type="button"
                onClick={() =>
                  onReviewApplication(app.referenceId, 'approved')
                }
                className="px-3 py-1.5 rounded-xl bg-[#006A3D] hover:bg-[#005530] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto space-y-3">
      {/* ======================= 1. VERIFY QUEUE (ULTRA-MINIMAL) ======================= */}
      {(activeTab === 'verify_queue' ||
        (!isMasterAdmin && (activeTab === 'reps' || activeTab === 'accounts'))) && (
        <div className="space-y-2.5">
          {/* Quick Student Search Bar right in Verify Queue */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="নাম (Name), Student ID বা App No দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:border-[#006A3D] text-slate-800 placeholder:text-slate-400 shadow-2xs"
            />
            {studentSearchQuery && (
              <button
                type="button"
                onClick={() => setStudentSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Minimal 4-Tab Filter Bar */}
          <div className="grid grid-cols-4 gap-1 bg-white border border-slate-200/80 p-1 rounded-2xl text-[11px] font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setQueueFilter('pending')}
              className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                queueFilter === 'pending'
                  ? 'bg-[#006A3D] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              অপেক্ষমাণ ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('approved')}
              className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                queueFilter === 'approved'
                  ? 'bg-[#006A3D] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              অনুমোদিত ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('rejected')}
              className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                queueFilter === 'rejected'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              বাতিল ({rejectedCount})
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                queueFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              সব ({applications.length})
            </button>
          </div>

          {/* Application Cards */}
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
              <p className="text-xs text-slate-400">
                {studentSearchQuery
                  ? `"${studentSearchQuery}" নামে কোনো শিক্ষার্থী পাওয়া যায়নি`
                  : 'এই তালিকায় কোনো আবেদন নেই'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredApplications.map((app) => renderApplicationCard(app))}
            </div>
          )}
        </div>
      )}

      {/* ======================= 1B. DEDICATED STUDENT SEARCH BY NAME TAB ======================= */}
      {activeTab === 'search' && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  শিক্ষার্থী খুঁজুন (Search Student)
                </h2>
                <p className="text-[11px] text-slate-500">
                  শিক্ষার্থীর নাম, Student ID অথবা Application No. লিখুন
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5F1E9] text-[#006A3D]">
                {searchTabResults.length} জন
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#006A3D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="শিক্ষার্থীর নাম লিখুন (যেমন: Tanvir, Sadia)..."
                className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D] focus:bg-white text-slate-800 placeholder:text-slate-400"
              />
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStudentSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {searchTabResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-1">
              <p className="text-xs font-bold text-slate-700">
                "{studentSearchQuery}" নামে কোনো শিক্ষার্থী পাওয়া যায়নি
              </p>
              <p className="text-[11px] text-slate-400">
                নামের বানান বা Student ID চেক করে আবার চেষ্টা করুন
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchTabResults.map((app) => renderApplicationCard(app))}
            </div>
          )}
        </div>
      )}

      {/* ======================= 2. GOOGLE FORMS-STYLE FORM EDITOR ======================= */}
      {activeTab === 'form_edit' && (
        <FormBuilderView
          initialSettings={formSettings}
          onSaveSettings={handleSaveFormSettings}
        />
      )}

      {/* ======================= 3. REPRESENTATIVES (MASTER ADMIN ONLY) ======================= */}
      {isMasterAdmin && activeTab === 'reps' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              প্রতিনিধি তালিকা ({representatives.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditingRep({
                  name: '',
                  deptId: availableDepartments[0]?.id || 'scai',
                  role: '',
                  term: '2026.03 ~ 2027.02',
                  fbUrl: 'https://facebook.com',
                  email: '',
                  photoUrl: '',
                });
                setRepModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#006A3D] hover:bg-[#005530] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>যোগ করুন</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
            {representatives.map((rep) => {
              const dept = availableDepartments.find(
                (d) => d.id === rep.deptId
              );
              return (
                <div
                  key={rep.id}
                  className="p-3 bg-white flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 truncate">
                          {rep.name}
                        </h4>
                        <span className="text-[9px] font-semibold text-[#006A3D] bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                          {rep.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {dept?.code || rep.deptId.toUpperCase()} ·{' '}
                        {dept?.nameEn || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRep(rep);
                        setRepModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteRepresentative(rep.id, rep.name)
                      }
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= 4. ACCOUNTS (MASTER ADMIN ONLY) ======================= */}
      {isMasterAdmin && activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                প্রতিনিধি একাউন্ট তৈরি ও তালিকা
              </h2>
              <p className="text-[11px] text-slate-500">
                User ID এবং Password দিয়ে একাউন্ট খুলুন ও পাসওয়ার্ড দেখুন
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5F1E9] text-[#006A3D]">
              {accounts.length}টি একাউন্ট
            </span>
          </div>

          {accountSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006A3D] text-xs flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{accountSuccessMsg}</span>
            </div>
          )}

          {/* Create Representative Account Form (User ID + Password -> Create) */}
          <form
            onSubmit={handleCreateAccount}
            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2.5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  User ID *
                </label>
                <input
                  type="text"
                  value={accountUsername}
                  onChange={(e) => setAccountUsername(e.target.value)}
                  placeholder="যেমন: rep.tanvir"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono text-xs focus:outline-none focus:border-[#006A3D]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Password *
                </label>
                <input
                  type="text"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono text-xs focus:outline-none focus:border-[#006A3D]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white bg-[#006A3D] hover:bg-[#005530] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account (নতুন একাউন্ট খুলুন)</span>
            </button>
          </form>

          {/* Representative Accounts List showing User ID & Current Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-700">
                প্রতিনিধিদের একাউন্ট ও পাসওয়ার্ড তালিকা
              </span>
              <span className="text-[10px] text-slate-400">
                পাসওয়ার্ড আপডেট করলে অটো পরিবর্তন হবে
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
              {accounts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white">
                  কোনো প্রতিনিধি একাউন্ট তৈরি করা হয়নি
                </div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 bg-white flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400">
                          User ID:
                        </span>
                        <span className="font-bold text-slate-900 font-mono text-xs">
                          {acc.username}
                        </span>
                        {acc.updatedAt && (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Password Updated
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-400">
                          Password:
                        </span>
                        <span className="font-mono font-bold text-[#006A3D] bg-[#E5F1E9]/70 px-2 py-0.5 rounded-md text-xs select-all">
                          {acc.password || 'rep123'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-[#006A3D] bg-[#E5F1E9] px-2 py-0.5 rounded-full">
                        Active
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = accounts.filter(
                            (a) => a.id !== acc.id
                          );
                          const log: ActivityLog = {
                            id: `log-${Date.now()}`,
                            actorId: currentAdmin.id,
                            actorName: `${currentAdmin.name} (${currentAdmin.username})`,
                            action: 'REP_DELETE',
                            details: `প্রতিনিধি লগইন একাউন্ট মুছে ফেলা হয়েছে: "${acc.username}"`,
                            timestamp: new Date().toISOString(),
                          };
                          onUpdateAccounts(updated, log);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 cursor-pointer"
                        title="একাউন্ট ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= 5. ACTIVITY LOGS ======================= */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            অ্যাক্টিভিটি ও পরিবর্তন রেকর্ড
          </h2>

          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
            {activityLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white">
                কোনো অ্যাক্টিভিটি লগ নেই
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-white space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-snug">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================= 6. PASSWORD CHANGE PAGE ======================= */}
      {activeTab === 'password_change' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-[#E5F1E9] text-[#006A3D] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                পাসওয়ার্ড পরিবর্তন (Password Change)
              </h2>
              <p className="text-[11px] text-slate-500">
                আপনার একাউন্টের পাসওয়ার্ড আপডেট করুন
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            {/* Fixed User ID displayed inside */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                User ID (Fixed)
              </label>
              <input
                type="text"
                value={currentAdmin.username}
                readOnly
                disabled
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed select-none"
              />
            </div>

            {/* Old Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Old Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old Password"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D] text-slate-800"
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D] text-slate-800"
                required
              />
            </div>

            {/* New Password Again */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                New Password Again
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="New Password Again"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006A3D] text-slate-800"
                required
              />
            </div>

            {passwordError && (
              <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="text-[11px] font-semibold text-[#006A3D] bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordSuccess}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#006A3D] hover:bg-[#005530] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* ======================= SLIDE BAR (MENU DRAWER) ======================= */}
      {isSlideBarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-72 max-w-[82vw] bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Top Admin Profile */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#006A3D] text-white flex items-center justify-center font-bold text-xs">
                    {currentAdmin.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {currentAdmin.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      @{currentAdmin.username}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseSlideBar}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Slide Bar Menu Links */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('verify_queue');
                    onCloseSlideBar();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === 'verify_queue'
                      ? 'bg-[#E5F1E9] text-[#006A3D] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4" />
                    <span>ভেরিফিকেশন যাচাই</span>
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D62828] text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {/* STUDENT SEARCH BY NAME OPTION */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('search');
                    onCloseSlideBar();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === 'search'
                      ? 'bg-[#E5F1E9] text-[#006A3D] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Search className="w-4 h-4" />
                    <span>শিক্ষার্থী খুঁজুন (Search)</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {applications.length}
                  </span>
                </button>

                {/* FORM EDIT OPTION */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('form_edit');
                    onCloseSlideBar();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === 'form_edit'
                      ? 'bg-[#E5F1E9] text-[#006A3D] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4" />
                    <span>ফরম এডিট (Form Edit)</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#006A3D]">
                    Builder
                  </span>
                </button>

                {isMasterAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('reps');
                        onCloseSlideBar();
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                        activeTab === 'reps'
                          ? 'bg-[#E5F1E9] text-[#006A3D] font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>প্রতিনিধি পরিচালনা</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('accounts');
                        onCloseSlideBar();
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                        activeTab === 'accounts'
                          ? 'bg-[#E5F1E9] text-[#006A3D] font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>প্রতিনিধি একাউন্ট</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('logs');
                    onCloseSlideBar();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-[#E5F1E9] text-[#006A3D] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>অ্যাক্টিভিটি রেকর্ড</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('password_change');
                    onCloseSlideBar();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'password_change'
                      ? 'bg-[#E5F1E9] text-[#006A3D] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>পাসওয়ার্ড পরিবর্তন (Password Change)</span>
                </button>
              </div>

              {/* Representative Push & App Install Controls (kept minimal inside Menu) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">
                    প্রতিনিধি অ্যালার্ট ও অ্যাপ
                  </span>
                  {permission === 'granted' && (
                    <span className="text-[9px] font-bold text-[#006A3D] flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> চালু
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {isSupported && permission !== 'granted' && (
                    <button
                      type="button"
                      onClick={requestPermission}
                      className="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg bg-[#006A3D] text-white flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <BellRing className="w-3 h-3" />
                      <span>পুশ চালু করুন</span>
                    </button>
                  )}
                  {!isInstalled && (isInstallable || isIOS) && (
                    <button
                      type="button"
                      onClick={() =>
                        isIOS ? setShowIOSGuide(true) : install()
                      }
                      className="flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Install App</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  onCloseSlideBar();
                  onSwitchToPublic();
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>পাবলিক সাইট দেখুন</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onCloseSlideBar();
                  onLogout();
                }}
                className="w-full px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#006A3D]" />
                <span>iPhone হোম স্ক্রিনে যুক্ত করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
              <li>
                Safari ব্রাউজারের নিচে <strong>Share</strong> বাটনে ট্যাপ করুন।
              </li>
              <li>
                <strong>Add to Home Screen</strong> নির্বাচন করুন।
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* ======================= STUDENT DETAILS & DOCUMENT PREVIEW MODAL ======================= */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl border border-slate-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  শিক্ষার্থীর বিস্তারিত তথ্য ও প্রমাণপত্র
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {inspectingApp.referenceId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Complete Student Details Grid */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="col-span-2 flex items-center justify-between border-b border-slate-200/60 pb-2">
                <div>
                  <span className="text-slate-400 text-[10px] block">
                    Full Name
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {inspectingApp.formData.fullName}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inspectingApp.status === 'approved'
                      ? 'bg-emerald-50 text-[#006A3D]'
                      : inspectingApp.status === 'rejected'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {inspectingApp.status === 'approved'
                    ? 'Approved'
                    : inspectingApp.status === 'rejected'
                    ? 'Rejected'
                    : 'Pending'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">
                  Program
                </span>
                <span className="font-semibold text-slate-800">
                  {inspectingApp.formData.program}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">
                  Student ID
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {inspectingApp.formData.studentId || 'N/A (Language)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">
                  Batch / Intake
                </span>
                <span className="font-medium text-slate-800">
                  {inspectingApp.formData.batchSeason}{' '}
                  {inspectingApp.formData.batchYear}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">
                  Phone Number
                </span>
                <span className="font-mono text-slate-800">
                  {inspectingApp.formData.phone || 'দেওয়া হয়নি'}
                </span>
              </div>

              {inspectingApp.formData.department && (
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] block">
                    Department / Major
                  </span>
                  <span className="font-medium text-slate-800 block">
                    {inspectingApp.formData.department}
                  </span>
                </div>
              )}

              {/* Custom Fields if any */}
              {inspectingApp.formData.customFieldValues &&
                Object.entries(inspectingApp.formData.customFieldValues).map(
                  ([fieldId, val]) => {
                    if (!val) return null;
                    const fieldDef = formSettings.customFields.find(
                      (f) => f.id === fieldId
                    );
                    return (
                      <div key={fieldId} className="col-span-2">
                        <span className="text-slate-400 text-[10px] block">
                          {fieldDef?.label || 'Additional Info'}
                        </span>
                        <span className="font-medium text-slate-800 block">
                          {val}
                        </span>
                      </div>
                    );
                  }
                )}
            </div>

            {/* Uploaded Proof Document */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-bold flex items-center gap-1 text-slate-700">
                  <FileText className="w-3 h-3 text-[#006A3D]" />
                  <span>জমা দেওয়া ডকুমেন্ট</span>
                </span>
                <span>{inspectingApp.document.fileSize || ''}</span>
              </div>
              {inspectingApp.document.previewUrl ? (
                <img
                  src={inspectingApp.document.previewUrl}
                  alt="Uploaded proof"
                  className="w-full max-h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1 text-[11px]">
                  <p className="font-bold text-[#006A3D]">
                    KYUNGDONG UNIVERSITY
                  </p>
                  <p className="font-bold text-slate-800">
                    {inspectingApp.document.fileName ||
                      'Certificate of Enrollment (재학증명서)'}
                  </p>
                  <p className="text-slate-600 text-[10px]">
                    Name: {inspectingApp.formData.fullName} · Program:{' '}
                    {inspectingApp.formData.program}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onReviewApplication(inspectingApp.referenceId, 'rejected');
                  setInspectingApp(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onReviewApplication(inspectingApp.referenceId, 'approved');
                  setInspectingApp(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#006A3D] text-white text-xs font-semibold cursor-pointer"
              >
                Approve করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= REPRESENTATIVE ADD/EDIT MODAL (MASTER ADMIN ONLY) ======================= */}
      {isMasterAdmin && repModalOpen && editingRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800">
                {editingRep.id ? 'প্রতিনিধি সম্পাদনা' : 'নতুন প্রতিনিধি যোগ'}
              </h4>
              <button
                type="button"
                onClick={() => setRepModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveRepresentative}
              className="space-y-2.5 text-xs"
            >
              {/* DP (Profile Photo) Preview + Upload / Change / Remove */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {editingRep.photoUrl ? (
                    <img
                      src={editingRep.photoUrl}
                      alt={editingRep.name || 'DP'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-[#006A3D] text-sm">
                      {(editingRep.name || 'R').charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <label className="px-2.5 py-1 rounded-lg bg-[#006A3D] text-white text-[11px] font-semibold cursor-pointer hover:bg-[#005530] transition-colors">
                      DP আপলোড / পরিবর্তন
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setEditingRep({
                                ...editingRep,
                                photoUrl: reader.result,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {editingRep.photoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRep({ ...editingRep, photoUrl: '' })
                        }
                        className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-600 text-[10px] font-semibold cursor-pointer"
                      >
                        রিমুভ
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    ডিভাইস থেকে ছবি দিন অথবা নিচে ছবির লিংক দিন
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={editingRep.name || ''}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, name: e.target.value })
                }
                placeholder="নাম (Full Name) *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editingRep.deptId || availableDepartments[0]?.id}
                  onChange={(e) =>
                    setEditingRep({ ...editingRep, deptId: e.target.value })
                  }
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl"
                >
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.nameEn}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={editingRep.role ?? ''}
                  onChange={(e) =>
                    setEditingRep({
                      ...editingRep,
                      role: e.target.value,
                    })
                  }
                  placeholder="পদবী / Role (যেমন: Primary)"
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <input
                type="text"
                value={editingRep.photoUrl || ''}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, photoUrl: e.target.value })
                }
                placeholder="ছবির লিংক (Photo URL)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />

              <input
                type="url"
                value={editingRep.fbUrl || ''}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, fbUrl: e.target.value })
                }
                placeholder="ফেসবুক প্রোফাইল লিংক"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRepModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006A3D] hover:bg-[#005530] rounded-xl cursor-pointer"
                >
                  সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
