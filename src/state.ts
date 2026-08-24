import type { User, Vault, Secret, AuditEntry, TwoFaSetupResponse, SecretVersion } from './types';

export interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Auth - Fluxo 2FA
  tempSessionToken: string | null;
  twoFaSetupData: TwoFaSetupResponse | null;

  // Navigation
  currentView: 'login' | 'register' | 'dashboard' | 'audit' | '2fa_setup' | '2fa_verify';
  
  // Dashboard
  vaults: Vault[];
  vaultsPagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  } | null;
  selectedVault: Vault | null;

  secrets: Secret[];
  secretsPagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  } | null;
  expandedSecretId: string | null;
  
  revealedSecret: {
    secretId: string;
    value: string;
  } | null;
  revealedSecretValue: string | null;
  secretVersions: SecretVersion[];
  
  vaultSearchQuery: string;
  searchQuery: string;

  // Audit
  auditEntries: AuditEntry[]; // Mantido para compatibilidade se necessário, mas o guia pede auditLog
  auditLog: AuditEntry[];
  
  auditPage: number;
  auditTotalPages: number;
  auditFilterVaultId: string | null;
  auditFilterAction: string | null;
  auditFilterDateStart: string | null;
  auditFilterDateEnd: string | null;
  
  auditPagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  } | null;
  auditFilters: any; // Type it correctly or as any if lazy

  // UI
  isLoading: boolean;
  loadingMessage: string;
  activeModal: string | null;
}

export const state: AppState = {
  currentUser: null,
  isAuthenticated: false,
  tempSessionToken: null,
  twoFaSetupData: null,
  currentView: 'login',
  vaults: [],
  vaultsPagination: null,
  selectedVault: null,
  secrets: [],
  secretsPagination: null,
  expandedSecretId: null,
  revealedSecret: null,
  revealedSecretValue: null,
  secretVersions: [],
  vaultSearchQuery: '',
  searchQuery: '',
  auditEntries: [],
  auditLog: [],
  auditPage: 1,
  auditTotalPages: 1,
  auditFilterVaultId: null,
  auditFilterAction: null,
  auditFilterDateStart: null,
  auditFilterDateEnd: null,
  auditPagination: null,
  auditFilters: {},
  isLoading: false,
  loadingMessage: '',
  activeModal: null,
};
