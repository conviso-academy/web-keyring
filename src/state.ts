import type { User, Vault, Secret, AuditEntry } from './types';

export interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Auth - Fluxo 2FA
  tempSessionToken: string | null;
  twoFaSetupData: {
    provisioningUri: string;
    backupCodes: string[];
  } | null;

  // Navigation
  currentView: 'login' | 'register' | 'dashboard' | 'audit' | '2fa_setup' | '2fa_verify';
  
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
  tempSessionToken: null,
  twoFaSetupData: null,
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
