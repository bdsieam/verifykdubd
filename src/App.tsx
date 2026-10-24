/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StudentFormData,
  UploadedDocument,
  SubmittedApplication,
  AdminUser,
  AdminTab,
  RepresentativeItem,
  RepresentativeAccount,
  ActivityLog,
  FormSettings,
} from './types';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Step1StudentInfo } from './components/Step1StudentInfo';
import { Step2DocumentUpload } from './components/Step2DocumentUpload';
import { Step3ReviewTracking } from './components/Step3ReviewTracking';
import { DirectoryView, DEFAULT_REPS_DATA } from './components/DirectoryView';
import { RulesView } from './components/RulesView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPortal } from './components/AdminPortal';
import {
  VerificationChatHead,
  playFiveSecondNotificationSound,
} from './components/VerificationChatHead';
import { sendSystemPushNotification } from './utils/pwaAndNotifications';

const STORAGE_KEY_ADMIN = 'kdu_active_admin_session_prod';
const STORAGE_KEY_APPLICATIONS = 'kdu_submitted_applications_prod';
const STORAGE_KEY_REPS = 'kdu_representatives_prod';
const STORAGE_KEY_ACCOUNTS = 'kdu_rep_accounts_prod';
const STORAGE_KEY_PASSWORDS = 'kdu_admin_passwords_prod';
const STORAGE_KEY_LOGS = 'kdu_activity_logs_prod';

const INITIAL_APPLICATIONS: SubmittedApplication[] = [];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('verify');
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Clean legacy demo keys on mount
  useEffect(() => {
    try {
      localStorage.removeItem('kdu_submitted_applications_v1');
      localStorage.removeItem('kdu_rep_accounts_v1');
      localStorage.removeItem('kdu_admin_passwords_v1');
      localStorage.removeItem('kdu_active_admin_session_v1');
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Admin and Navigation State (restored from localStorage so Representatives stay logged in across days)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeAdmin, setActiveAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN);
      return saved ? (JSON.parse(saved) as AdminUser) : null;
    } catch {
      return null;
    }
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(STORAGE_KEY_ADMIN);
    } catch {
      return false;
    }
  });
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('verify_queue');
  const [isSlideBarOpen, setIsSlideBarOpen] = useState<boolean>(false);

  // Messenger-style Chat Head & 5-second Notification Sound State
  const [chatHeadApp, setChatHeadApp] = useState<SubmittedApplication | null>(
    null
  );
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const stopAudioRef = useRef<(() => void) | null>(null);
  const ringTimeoutRef = useRef<number | null>(null);

  const triggerChatHeadNotification = (app: SubmittedApplication) => {
    // Stop any previous sound
    if (stopAudioRef.current) {
      stopAudioRef.current();
    }
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
    }

    setChatHeadApp(app);
    setIsRinging(true);
    stopAudioRef.current = playFiveSecondNotificationSound();

    // Trigger native phone/OS push notification banner via Service Worker
    sendSystemPushNotification(app, () => {
      setIsAdminPortalOpen(true);
      setAdminTab('verify_queue');
    });

    ringTimeoutRef.current = window.setTimeout(() => {
      setIsRinging(false);
    }, 5000);
  };

  // Listen for Service Worker notification clicks to jump straight to Verify Queue
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          if (isAdminLoggedIn) {
            setIsAdminPortalOpen(true);
            setAdminTab('verify_queue');
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () =>
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, [isAdminLoggedIn]);

  const stopNotificationSound = () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    setIsRinging(false);
  };

  // Dynamic Form Settings (persisted in localStorage so Google Forms-style edits stay saved)
  const [formSettings, setFormSettings] = useState<FormSettings>(() => {
    const defaultSettings: FormSettings = {
      headingText: 'শিক্ষার্থীর তথ্য',
      formSubtitle: 'Fill in your details to verify your KDU enrollment.',
      redGuidelineText:
        'Certificate of Enrollment (재학증명서) বা Tuition Fee Receipt বা Current Semester Portal Screenshot অথবা anything that proves you are currently studying in KDU',
      customFields: [],
      enablePhoneField: true,
      maxFileSizeMb: 5,
    };
    try {
      const saved = localStorage.getItem('kdu_form_settings_v1');
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore storage errors
    }
    return defaultSettings;
  });

  // Verification Queue Applications (clean production state)
  const [applications, setApplications] = useState<SubmittedApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved) as SubmittedApplication[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to empty array
    }
    return INITIAL_APPLICATIONS;
  });

  useEffect(() => {
    try {
      const serializable = applications.map((app) => ({
        ...app,
        document: {
          ...app.document,
          file: null,
        },
      }));
      localStorage.setItem(
        STORAGE_KEY_APPLICATIONS,
        JSON.stringify(serializable)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [applications]);

  const [justSubmittedApp, setJustSubmittedApp] =
    useState<SubmittedApplication | null>(null);

  // Dynamic Representatives List (clean production state)
  const [representatives, setRepresentatives] = useState<RepresentativeItem[]>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_REPS);
        if (saved) {
          const parsed = JSON.parse(saved) as RepresentativeItem[];
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch {
        // Ignore storage errors
      }
      return DEFAULT_REPS_DATA;
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REPS, JSON.stringify(representatives));
    } catch {
      // Ignore storage errors
    }
  }, [representatives]);

  // Dynamic Representative Accounts (clean production state)
  const [accounts, setAccounts] = useState<RepresentativeAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      const rawPassMap = localStorage.getItem(STORAGE_KEY_PASSWORDS);
      const passMap: Record<string, string> = rawPassMap
        ? JSON.parse(rawPassMap)
        : {};
      if (saved) {
        const parsed = JSON.parse(saved) as RepresentativeAccount[];
        if (Array.isArray(parsed)) {
          return parsed.map((acc) => ({
            ...acc,
            password: passMap[acc.username] || acc.password || '',
          }));
        }
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  // Activity & Audit Log (clean production state)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved) as ActivityLog[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(activityLogs));
    } catch {
      // Ignore storage errors
    }
  }, [activityLogs]);

  // Form Data
  const [formData, setFormData] = useState<StudentFormData>({
    program: 'Bachelor',
    fullName: '',
    studentId: '',
    department: '',
    batchSeason: 'Spring',
    batchYear: '2026',
    phone: '',
    facebookUrl: '',
    confirmKduStudent: false,
    confirmCommunityRules: false,
  });

  // Document Upload Data
  const [document, setDocument] = useState<UploadedDocument>({
    file: null,
    fileName: '',
    fileSize: '',
    fileType: '',
    previewUrl: null,
    uploadedAt: '',
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  const updateFormData = (data: Partial<StudentFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const updateDocument = (doc: Partial<UploadedDocument>) => {
    setDocument((prev) => ({ ...prev, ...doc }));
  };

  // Student Final Submit Handler (No account required)
  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const ref = `#KDU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newApp: SubmittedApplication = {
        referenceId: ref,
        formData: { ...formData },
        document: { ...document },
        submittedAt: new Date().toISOString(),
        status: 'pending',
        currentStep: 2,
      };
      setApplications((prev) => [newApp, ...prev]);
      setJustSubmittedApp(newApp);
      setIsSubmitting(false);
      setCurrentTab('status');
      setStep(3);

      // Reset form inputs so a new form is clean
      setFormData({
        program: 'Bachelor',
        fullName: '',
        studentId: '',
        department: '',
        batchSeason: 'Spring',
        batchYear: '2026',
        phone: '',
        facebookUrl: '',
        confirmKduStudent: false,
        confirmCommunityRules: false,
      });
      setDocument({
        file: null,
        fileName: '',
        fileSize: '',
        fileType: '',
        previewUrl: null,
        uploadedAt: '',
      });

      // If an Admin or Representative is logged in, immediately pop up the Messenger Chat Head + 5s sound!
      if (isAdminLoggedIn) {
        triggerChatHeadNotification(newApp);
      }
    }, 500);
  };

  // Simulate an incoming student verification application for testing Chat Head + 5s sound
  const handleSimulateIncomingApplication = () => {
    const sampleNames = [
      'Mahmudul Hasan Joy',
      'FarhanaYeasmin',
      'Rakibul Islam',
      'Tahmidul Haque',
    ];
    const randomName =
      sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const ref = `#KDU-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const simulatedApp: SubmittedApplication = {
      referenceId: ref,
      formData: {
        program: 'Bachelor',
        fullName: randomName,
        studentId: `2026${Math.floor(1000 + Math.random() * 8999)}`,
        department: 'Smart Computing & Artificial Intelligence',
        batchSeason: 'Spring',
        batchYear: '2026',
        phone: '+82 10-7721-3390',
        facebookUrl: 'https://facebook.com/kdu.student.bd',
        confirmKduStudent: true,
        confirmCommunityRules: true,
      },
      document: {
        file: null,
        fileName: 'Certificate_of_Enrollment_2026.pdf',
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        previewUrl: null,
        uploadedAt: new Date().toISOString(),
      },
      submittedAt: new Date().toISOString(),
      status: 'pending',
      currentStep: 2,
    };

    setApplications((prev) => [simulatedApp, ...prev]);
    triggerChatHeadNotification(simulatedApp);
  };

  const handleReset = () => {
    setJustSubmittedApp(null);
    setCurrentTab('verify');
    setStep(1);
    setFormData({
      program: 'Bachelor',
      fullName: '',
      studentId: '',
      department: '',
      batchSeason: 'Spring',
      batchYear: '2026',
      phone: '',
      facebookUrl: '',
      confirmKduStudent: false,
      confirmCommunityRules: false,
    });
    setDocument({
      file: null,
      fileName: '',
      fileSize: '',
      fileType: '',
      previewUrl: null,
      uploadedAt: '',
    });
  };

  // Admin Review Approve / Reject Handler
  const handleAdminReviewApplication = (
    referenceId: string,
    decision: 'approved' | 'rejected'
  ) => {
    const targetApp = applications.find((a) => a.referenceId === referenceId);
    if (!targetApp || !activeAdmin) return;

    const updatedList = applications.map((app) =>
      app.referenceId === referenceId
        ? {
            ...app,
            status: decision,
            currentStep: (decision === 'approved' ? 4 : 3) as 1 | 2 | 3 | 4,
            reviewedBy: activeAdmin.username,
            reviewedAt: new Date().toISOString(),
          }
        : app
    );

    setApplications(updatedList);

    // If the reviewed app was in the Chat Head, advance Chat Head to the next pending app or close it
    if (chatHeadApp?.referenceId === referenceId) {
      const nextPending = updatedList.find((a) => a.status === 'pending');
      setChatHeadApp(nextPending || null);
    }

    const logEntry: ActivityLog = {
      id: `log-${Date.now()}`,
      actorId: activeAdmin.id,
      actorName: `${activeAdmin.name} (${activeAdmin.username})`,
      action: decision === 'approved' ? 'VERIFY_APPROVE' : 'VERIFY_REJECT',
      details: `শিক্ষার্থী "${targetApp.formData.fullName}" (${referenceId})-এর আবেদন ${
        decision === 'approved' ? 'অনুমোদন (Approved)' : 'বাতিল (Rejected)'
      } করা হয়েছে`,
      timestamp: new Date().toISOString(),
    };

    setActivityLogs((prev) => [logEntry, ...prev]);
  };

  const handleTabChange = (tab: string) => {
    setIsAdminPortalOpen(false);
    setCurrentTab(tab);
    if (tab === 'status') {
      setStep(3);
    } else if (tab === 'verify' && step === 3) {
      setJustSubmittedApp(null);
      setStep(1);
    }
  };

  // Admin handlers
  const handleAdminNavClick = () => {
    if (isAdminLoggedIn) {
      setIsAdminPortalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (admin: AdminUser, logEntry: ActivityLog) => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(admin));
    } catch {
      // Ignore storage errors
    }
    setIsAdminLoggedIn(true);
    setActiveAdmin(admin);
    setIsAdminPortalOpen(true);
    setAdminTab('verify_queue');
    setActivityLogs((prev) => [logEntry, ...prev]);

    // When a Representative or Admin logs in and there is a pending verification application,
    // pop up the Messenger Chat Head + 5-second notification chime + Push Notification!
    const latestPending = applications.find((a) => a.status === 'pending');
    if (latestPending) {
      triggerChatHeadNotification(latestPending);
    }
  };

  const handleAdminLogout = () => {
    stopNotificationSound();
    setChatHeadApp(null);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
    } catch {
      // Ignore storage errors
    }
    if (activeAdmin) {
      const logoutLog: ActivityLog = {
        id: `log-${Date.now()}`,
        actorId: activeAdmin.id,
        actorName: `${activeAdmin.name} (${activeAdmin.username})`,
        action: 'LOGIN',
        details: `অ্যাডমিন পোর্টাল থেকে লগআউট (${activeAdmin.username})`,
        timestamp: new Date().toISOString(),
      };
      setActivityLogs((prev) => [logoutLog, ...prev]);
    }
    setIsAdminLoggedIn(false);
    setActiveAdmin(null);
    setIsAdminPortalOpen(false);
    setIsSlideBarOpen(false);
  };

  const handleUpdateRepresentatives = (
    newReps: RepresentativeItem[],
    logEntry: ActivityLog
  ) => {
    setRepresentatives(newReps);
    setActivityLogs((prev) => [logEntry, ...prev]);
  };

  const handleUpdateAccounts = (
    newAccounts: RepresentativeAccount[],
    logEntry: ActivityLog
  ) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(newAccounts));
      const rawPassMap = localStorage.getItem(STORAGE_KEY_PASSWORDS);
      const passMap: Record<string, string> = rawPassMap
        ? JSON.parse(rawPassMap)
        : {};
      newAccounts.forEach((acc) => {
        if (acc.password) {
          passMap[acc.username] = acc.password;
        }
      });
      localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(passMap));
    } catch {
      // Ignore storage errors
    }
    setActivityLogs((prev) => [logEntry, ...prev]);
  };

  const handleUpdateFormSettings = (
    newSettings: FormSettings,
    logEntry: ActivityLog
  ) => {
    setFormSettings(newSettings);
    try {
      localStorage.setItem('kdu_form_settings_v1', JSON.stringify(newSettings));
    } catch {
      // Ignore storage errors
    }
    setActivityLogs((prev) => [logEntry, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-800 antialiased selection:bg-[#006A3D]/20 selection:text-[#006A3D]">
      {/* Top Brand Header */}
      <Navbar
        isAdminLoggedIn={isAdminLoggedIn}
        isAdminPortalOpen={isAdminPortalOpen && !!activeAdmin}
        isSearchActive={adminTab === 'search'}
        onAdminClick={handleAdminNavClick}
        onOpenSearch={() => {
          setAdminTab((prev) => (prev === 'search' ? 'verify_queue' : 'search'));
          setIsSlideBarOpen(false);
        }}
        onOpenSlideBar={() => setIsSlideBarOpen(true)}
        onSwitchToPublic={() => setIsAdminPortalOpen(false)}
      />

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-4 sm:py-6 pb-24">
        {isAdminPortalOpen && activeAdmin ? (
          <AdminPortal
            currentAdmin={activeAdmin}
            activeTab={adminTab}
            onSelectTab={setAdminTab}
            isSlideBarOpen={isSlideBarOpen}
            onCloseSlideBar={() => setIsSlideBarOpen(false)}
            onSwitchToPublic={() => setIsAdminPortalOpen(false)}
            onLogout={handleAdminLogout}
            applications={applications}
            onReviewApplication={handleAdminReviewApplication}
            onSimulateIncomingApplication={handleSimulateIncomingApplication}
            representatives={representatives}
            onUpdateRepresentatives={handleUpdateRepresentatives}
            accounts={accounts}
            onUpdateAccounts={handleUpdateAccounts}
            activityLogs={activityLogs}
            formSettings={formSettings}
            onUpdateFormSettings={handleUpdateFormSettings}
          />
        ) : (
          <div>
            {currentTab === 'directory' && (
              <DirectoryView representatives={representatives} />
            )}

            {currentTab === 'rules' && <RulesView />}

            {(currentTab === 'verify' || currentTab === 'status') && (
              <div className="animate-in fade-in duration-200">
                {step === 1 && (
                  <Step1StudentInfo
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={() => setStep(2)}
                    customFields={formSettings.customFields}
                    formSettings={formSettings}
                  />
                )}

                {step === 2 && (
                  <Step2DocumentUpload
                    document={document}
                    updateDocument={updateDocument}
                    onBack={() => setStep(1)}
                    onSubmit={handleFinalSubmit}
                    isSubmitting={isSubmitting}
                    redGuidelineText={formSettings.redGuidelineText}
                  />
                )}

                {step === 3 && (
                  <Step3ReviewTracking
                    applications={applications}
                    justSubmittedApp={justSubmittedApp}
                    onClearJustSubmitted={() => setJustSubmittedApp(null)}
                    onReset={handleReset}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Messenger-Style Floating Verification Chat Head for Logged-in Representative/Admin */}
      {isAdminLoggedIn && activeAdmin && (
        <VerificationChatHead
          incomingApp={chatHeadApp}
          pendingCount={pendingCount}
          isRinging={isRinging}
          onStopSound={stopNotificationSound}
          onApprove={(refId) => handleAdminReviewApplication(refId, 'approved')}
          onReject={(refId) => handleAdminReviewApplication(refId, 'rejected')}
          onOpenInPortal={() => {
            setIsAdminPortalOpen(true);
            setAdminTab('verify_queue');
          }}
          onDismiss={() => setChatHeadApp(null)}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        accounts={accounts}
      />

      {/* Fixed Bottom Navigation Bar (switches between Public Nav & Admin Quick Access Nav) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        isAdminMode={isAdminPortalOpen && !!activeAdmin}
        isMasterAdmin={activeAdmin?.role === 'Super Admin'}
        adminTab={adminTab}
        onSelectAdminTab={(tab) => {
          setAdminTab(tab);
          setIsSlideBarOpen(false);
        }}
        onOpenSlideBar={() => setIsSlideBarOpen(true)}
        pendingCount={pendingCount}
      />
    </div>
  );
}
