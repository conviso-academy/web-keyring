import { mockDelay } from './client';
import type { User } from '../types';

export interface LoginResponse {
  requires_2fa_setup?: boolean;
  requires_2fa?: boolean;
  session_token: string;
  user?: User;
}

export interface TwoFaSetupResponse {
  provisioning_uri: string;
  backup_codes: string[];
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  await mockDelay();
  
  if (password === 'wrong') {
    throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
  }

  // Se for o usuário admin padrão já configurado, vai para verificação direta
  if (email === 'admin@conviso.com') {
    return {
      requires_2fa: true,
      session_token: 'mock-session-verify-admin-uuid-12345'
    };
  }

  // Qualquer outro usuário (ex: novo usuário) precisa configurar o 2FA primeiro
  return {
    requires_2fa_setup: true,
    session_token: `mock-session-setup-${Date.now()}`
  };
}

export async function setup2FA(token: string): Promise<TwoFaSetupResponse> {
  await mockDelay();
  if (!token) {
    throw new Error('Sessão temporária inválida ou expirada.');
  }

  return {
    provisioning_uri: 'otpauth://totp/OVNI:usuario@conviso.com?secret=JBSWY3DPEHPK3PXP&issuer=OVNI',
    backup_codes: [
      'a1b2c3d4',
      'e5f6g7h8',
      'i9j0k1l2',
      'm3n4o5p6',
      'q7r8s9t0',
      'u1v2w3x4',
      'y5z6a7b8',
      'c9d0e1f2',
      'g3h4i5j6',
      'k7l8m9n0'
    ]
  };
}

export async function verifySetup2FA(token: string, code: string): Promise<{ user: User; session_id: string }> {
  await mockDelay();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const cleanCode = code.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error('O código de verificação deve conter exatamente 6 dígitos numéricos.');
  }

  if (cleanCode === '000000') {
    throw new Error('Código TOTP inválido ou expirado.');
  }

  return {
    user: {
      id: 'u-1',
      email: 'usuario@conviso.com',
      created_at: new Date().toISOString()
    },
    session_id: `session-active-${Date.now()}`
  };
}

export async function verify2FA(token: string, code: string): Promise<{ user: User; session_id: string }> {
  await mockDelay();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const cleanCode = code.trim().replace(/\s+/g, '');
  const isTotp = /^\d{6}$/.test(cleanCode);
  const isBackup = /^[a-zA-Z0-9]{8}$/.test(cleanCode);

  if (!isTotp && !isBackup) {
    throw new Error('Código inválido. Digite os 6 dígitos do autenticador ou um código de backup de 8 caracteres.');
  }

  if (cleanCode === '000000' || cleanCode.toLowerCase() === '00000000') {
    throw new Error('Código de verificação incorreto ou já utilizado.');
  }

  return {
    user: {
      id: 'u-1',
      email: 'admin@conviso.com',
      created_at: '2026-01-01T00:00:00Z'
    },
    session_id: `session-active-${Date.now()}`
  };
}

export async function register(email: string, _password: string): Promise<{ user: User }> {
  await mockDelay();
  if (email === 'admin@conviso.com') {
    throw new Error('Este e-mail já está em uso.');
  }
  return {
    user: { id: `u-${Date.now()}`, email, created_at: new Date().toISOString() }
  };
}

export async function logout(): Promise<{ success: boolean }> {
  await mockDelay();
  return { success: true };
}
