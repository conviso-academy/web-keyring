import type { User, Vault, Secret, AuditEntry } from './types';

export interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Navigation
  currentView: 'login' | 'register' | 'dashboard' | 'audit';
  
  // Dashboard
  vaults: Vault[];
  selectedVault: Vault | null;
  secrets: Secret[];
  expandedSecretId: string | null;
  revealedSecretValue: string | null;
  vaultSearchQuery: string;

  // Audit
  auditEntries: AuditEntry[];
  auditPage: number;
  auditTotalPages: number;
  auditFilterVaultId: string | null;
  auditFilterDateStart: string | null;
  auditFilterDateEnd: string | null;

  // UI
  isLoading: boolean;
  loadingMessage: string;
}

export const state: AppState = {
  currentUser: null,
  isAuthenticated: false,
  currentView: 'login',
  vaults: [],
  selectedVault: null,
  secrets: [],
  expandedSecretId: null,
  revealedSecretValue: null,
  vaultSearchQuery: '',
  auditEntries: [],
  auditPage: 1,
  auditTotalPages: 1,
  auditFilterVaultId: null,
  auditFilterDateStart: null,
  auditFilterDateEnd: null,
  isLoading: false,
  loadingMessage: '',
};
