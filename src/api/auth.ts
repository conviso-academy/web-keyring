import { mockDelay } from './client';
import type { User } from '../types';

export async function login(email: string, password: string): Promise<{ user: User, session_id: string }> {
  await mockDelay();
  if (email === 'admin@conviso.com' && password === 'admin123') {
    return {
      user: { id: 'u-1', email, created_at: '2026-01-01T00:00:00Z' },
      session_id: 'session-12345'
    };
  }
  
  if (password === 'wrong') {
    throw new Error('Credenciais inválidas');
  }

  // Any other combination for mock purposes
  return {
    user: { id: 'u-2', email, created_at: new Date().toISOString() },
    session_id: `session-${Date.now()}`
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
