export type ProgramType = 'Language Program' | 'Bachelor' | 'Masters' | string;

export type AdminTab =
  | 'verify_queue'
  | 'search'
  | 'reps'
  | 'accounts'
  | 'logs'
  | 'form_edit'
  | 'password_change';

export type BatchSeason = 'Spring' | 'Winter' | string;

export interface StudentFormData {
  program: ProgramType;
  fullName: string;
  studentId: string;
  department: string;
  batchSeason: BatchSeason;
  batchYear: string;
  phone: string;
  facebookUrl?: string;
  confirmKduStudent: boolean;
  confirmCommunityRules: boolean;
  customValues?: Record<string, string>;
  customFieldValues?: Record<string, string>;
}

export interface UploadedDocument {
  file: File | null;
  fileName: string;
  fileSize: string;
  fileType: string;
  previewUrl: string | null;
  uploadedAt: string;
  docCategory?: string;
}

export interface SubmittedApplication {
  referenceId: string;
  formData: StudentFormData;
  document: UploadedDocument;
  submittedAt: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  currentStep: 1 | 2 | 3 | 4;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface DepartmentOption {
  id: string;
  nameEn: string;
  nameBn: string;
  code: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: 'Super Admin' | 'Representative' | 'Representative Admin';
  department?: string;
  photoUrl?: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface RepresentativeAccount {
  id: string;
  username: string;
  password: string;
  repName?: string;
  department?: string;
  email?: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'disabled';
  updatedAt?: string;
}

export interface RepresentativeItem {
  id: string;
  name: string;
  deptId: string;
  role: 'Primary' | 'Backup' | string;
  term: string;
  fbUrl: string;
  email: string;
  photoUrl?: string;
}

export type CustomFieldType = 'text' | 'select' | 'number' | 'tel' | 'url';

export interface CustomFormField {
  id: string;
  label: string;
  labelBn?: string;
  labelEn?: string;
  placeholder: string;
  required: boolean;
  type?: CustomFieldType;
  options?: string[];
  showFor?: 'all' | 'non_language' | 'language_only';
}

export type FormCustomField = CustomFormField;

export interface FormSettings {
  headingText: string;
  formSubtitle?: string;
  redGuidelineText: string;
  programs?: string[];
  departments?: DepartmentOption[];
  batchSeasons?: string[];
  batchYears?: string[];
  fullNameLabel?: string;
  studentIdLabel?: string;
  departmentLabel?: string;
  batchLabel?: string;
  phoneLabel?: string;
  facebookLabel?: string;
  enablePhoneField: boolean;
  phoneRequired?: boolean;
  facebookRequired?: boolean;
  agreement1Text?: string;
  agreement2Text?: string;
  customFields: CustomFormField[];
  maxFileSizeMb: number;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action:
    | 'LOGIN'
    | 'VERIFY_APPROVE'
    | 'VERIFY_REJECT'
    | 'REP_ADD'
    | 'REP_EDIT'
    | 'REP_DELETE'
    | 'ACCOUNT_CREATE'
    | 'FORM_EDIT';
  details: string;
  timestamp: string;
}

export const DEPARTMENTS: DepartmentOption[] = [
  {
    id: 'scai',
    nameEn: 'Smart Computing & Artificial Intelligence',
    nameBn: 'স্মার্ট কম্পিউটিং ও আর্টিফিশিয়াল ইন্টেলিজেন্স',
    code: 'SCAI',
  },
  {
    id: 'ba',
    nameEn: 'Business Administration (Global)',
    nameBn: 'বিজনেস অ্যাডমিনিস্ট্রেশন',
    code: 'GBA',
  },
  {
    id: 'hm',
    nameEn: 'Hotel & Culinary Management',
    nameBn: 'হোটেল ও কালিনারি ম্যানেজমেন্ট',
    code: 'HCM',
  },
  {
    id: 'kc',
    nameEn: 'Korean Language & Culture',
    nameBn: 'কোরিয়ান ভাষা ও সংস্কৃতি',
    code: 'KLC',
  },
  {
    id: 'it',
    nameEn: 'Global IT & Software Engineering',
    nameBn: 'গ্লোবাল আইটি ও সফটওয়্যার ইঞ্জিনিয়ারিং',
    code: 'GIT',
  },
  {
    id: 'other',
    nameEn: 'Other KDU Academic Department',
    nameBn: 'অন্যান্য বিভাগ',
    code: 'GEN',
  },
];

export const BATCH_SEASONS: BatchSeason[] = ['Spring', 'Winter'];

const CURRENT_YEAR = new Date().getFullYear();
export const BATCH_YEARS: string[] = Array.from({ length: 8 }, (_, i) =>
  String(CURRENT_YEAR - i)
);
