import {
  SubmittedApplication,
  RepresentativeItem,
  RepresentativeAccount,
  ActivityLog,
  FormSettings,
} from '../types';

export interface D1StatePayload {
  applications?: SubmittedApplication[];
  representatives?: RepresentativeItem[];
  accounts?: RepresentativeAccount[];
  adminPasswords?: Record<string, string>;
  activityLogs?: ActivityLog[];
  formSettings?: FormSettings;
}

export interface D1FetchResult {
  connected: boolean;
  data: D1StatePayload | null;
}

function serializeApplications(
  apps: SubmittedApplication[]
): SubmittedApplication[] {
  return apps.map((app) => ({
    ...app,
    document: {
      ...app.document,
      file: null,
    },
  }));
}

export async function fetchD1State(): Promise<D1FetchResult> {
  try {
    const res = await fetch('/api/state', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { connected: false, data: null };
    }

    const json = await res.json();
    if (res.ok && json && json.ok && json.d1Connected) {
      return {
        connected: true,
        data: (json.data || {}) as D1StatePayload,
      };
    }
    return { connected: false, data: null };
  } catch {
    return { connected: false, data: null };
  }
}

export async function submitApplicationToD1(
  application: SubmittedApplication
): Promise<SubmittedApplication[] | null> {
  try {
    const cleanApp: SubmittedApplication = {
      ...application,
      document: {
        ...application.document,
        file: null,
      },
    };
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        action: 'submit_application',
        application: cleanApp,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;

    const json = await res.json();
    if (res.ok && json && json.ok && Array.isArray(json.applications)) {
      return json.applications as SubmittedApplication[];
    }
    return null;
  } catch {
    return null;
  }
}

export async function reviewApplicationInD1(
  referenceId: string,
  decision: 'approved' | 'rejected',
  reviewedBy: string,
  reviewedAt: string,
  logEntry: ActivityLog
): Promise<SubmittedApplication[] | null> {
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        action: 'review_application',
        referenceId,
        decision,
        reviewedBy,
        reviewedAt,
        logEntry,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;

    const json = await res.json();
    if (res.ok && json && json.ok && Array.isArray(json.applications)) {
      return json.applications as SubmittedApplication[];
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveStateToD1(
  payload: Partial<D1StatePayload>
): Promise<boolean> {
  try {
    const cleanPayload: Partial<D1StatePayload> = { ...payload };
    if (cleanPayload.applications) {
      cleanPayload.applications = serializeApplications(
        cleanPayload.applications
      );
    }

    const res = await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ data: cleanPayload }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return false;

    const json = await res.json();
    return Boolean(res.ok && json && json.ok && json.d1Connected);
  } catch {
    return false;
  }
}
