export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'guest' | 'free' | 'pro';
  points?: number;
  aiCalls?: number;
  totalWords?: number;
  createdAt?: string;
  inviteCode?: string;
  lastLoginAt?: string;
  membershipValidUntil?: string;
}

export interface StoredUser extends User {
  passwordHash: string;
  loginAttempts?: number;
  lockoutUntil?: string;
  loginHistory?: LoginHistoryEntry[];
}

export interface LoginHistoryEntry {
  timestamp: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

export interface PasswordResetRequest {
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

// 登录锁定常量
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

export interface ActivityEntry {
  id: string;
  type: 'ai_call' | 'novel' | 'invite' | 'payout' | 'general';
  description: string;
  createdAt: string;
  deltaPoints?: number;
  metadata?: Record<string, any>;
}

export interface InviteRecord {
  id: string;
  ownerId?: string;
  inviteeName: string;
  inviteeEmail: string;
  status: 'pending' | 'registered' | 'paid';
  createdAt: string;
  registeredAt?: string;
  note?: string;
  source?: string;
  reward?: number;
}
