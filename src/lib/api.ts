import { User, OnboardingStep, DocumentRecord } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Activity {
  id: string;
  action: string;
  detail: string;
  time: string;
  timestamp: string; // ISO timestamp for accurate time calculation
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// Token management
let authToken: string | null = localStorage.getItem('authToken');

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('authToken', token);
  console.log('✅ Token set in memory and localStorage');
}

export function getAuthToken(): string | null {
  // Always read from localStorage to ensure we have the latest value
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
  console.log('✅ Token cleared from memory and localStorage');
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
}

export const api = {
  async register(email: string, password: string, name: string, company: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, company }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    setAuthToken(data.token);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setAuthToken(data.token);
    return data;
  },

  async uploadDocument(file: File, userId: string): Promise<{ 
    success: boolean; 
    document: DocumentRecord;
    steps: OnboardingStep[];
    message: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE}/user/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  async getSteps(userId: string): Promise<OnboardingStep[]> {
    const response = await fetch(`${API_BASE}/steps/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch steps');
    }
    return response.json();
  },

  async updateStepStatus(
    userId: string, 
    stepId: number, 
    status: string, 
    timeSpent?: string
  ): Promise<OnboardingStep> {
    const response = await fetch(`${API_BASE}/steps/${userId}/${stepId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status, timeSpent }),
    });

    if (!response.ok) {
      throw new Error('Failed to update step');
    }

    return response.json();
  },

  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  async getUserActivity(userId: string): Promise<Activity[]> {
    const response = await fetch(`${API_BASE}/activity/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch activity');
    }
    return response.json();
  },

  async getAdminActivity(): Promise<Activity[]> {
    const response = await fetch(`${API_BASE}/admin/activity`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch admin activity');
    }
    return response.json();
  },

  async deleteDocument(userId: string, documentId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/document/${userId}/${documentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
    return response.json();
  },

  async clearDatabase(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/admin/clear-database`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to clear database');
    }
    return response.json();
  },

  async getArchivedFlows(userId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/archived-flows/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch archived flows');
    }
    return response.json();
  },

  async deleteArchivedFlow(userId: string, flowId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/archived-flows/${userId}/${flowId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete archived flow');
    }
    return response.json();
  },

  async archiveFlow(userId: string, flowData: any): Promise<{ success: boolean; flow: any }> {
    const response = await fetch(`${API_BASE}/archived-flows/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(flowData),
    });
    if (!response.ok) {
      throw new Error('Failed to archive flow');
    }
    return response.json();
  },

  async chatWithBot(message: string, context: any): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, context }),
    });
    if (!response.ok) {
      throw new Error('Failed to get chat response');
    }
    return response.json();
  },

  async getUserTeams(userId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/user/${userId}/teams`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user teams');
    }
    return response.json();
  },

  async getUserTeamDocuments(userId: string): Promise<DocumentRecord[]> {
    const response = await fetch(`${API_BASE}/user/${userId}/team-documents`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch team documents');
    }
    return response.json();
  },

  async getNotifications(userId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/notifications/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/notifications/${userId}/${notificationId}/read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  },

  async clearNotifications(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/notifications/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to clear notifications');
    }
  },

  async migrateQueue(): Promise<{ success: boolean; message: string; migratedCount: number; results: any[] }> {
    const response = await fetch(`${API_BASE}/admin/migrate-queue`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to migrate queue');
    }
    return response.json();
  },

  async getDocumentQueue(userId: string): Promise<{
    queue: any[];
    activeDocumentId?: string;
    queueLength: number;
  }> {
    const response = await fetch(`${API_BASE}/document-queue/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch document queue');
    }
    return response.json();
  },

  async activateNextDocument(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/activate-next-document/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to activate next document');
    }
    return response.json();
  },
};
