import { apiRequest } from './client';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest,
  LoginResponse,
  LoginSuccessResponse,
  TwoFaSetupResponse 
} from '../types';

export type LoginResult = LoginResponse | LoginSuccessResponse;

export async function login(email: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>({
    method: 'POST',
    endpoint: '/api/auth/login',
    body: { email, password } satisfies LoginRequest
  });
}

export async function register(email: string, password: string): Promise<LoginSuccessResponse> {
  return apiRequest<LoginSuccessResponse>({
    method: 'POST',
    endpoint: '/api/auth/register',
    body: { email, password } satisfies RegisterRequest
  });
}

export async function setup2FA(session_token: string): Promise<TwoFaSetupResponse> {
  return apiRequest<TwoFaSetupResponse>({
    method: 'POST',
    endpoint: '/api/auth/2fa/setup',
    body: { session_token }
  });
}

export async function verifySetup2FA(session_token: string, code: string): Promise<LoginSuccessResponse> {
  return apiRequest<LoginSuccessResponse>({
    method: 'POST',
    endpoint: '/api/auth/2fa/setup/verify',
    body: { session_token, code }
  });
}

export async function verify2FA(session_token: string, code: string): Promise<LoginSuccessResponse> {
  return apiRequest<LoginSuccessResponse>({
    method: 'POST',
    endpoint: '/api/auth/2fa/verify',
    body: { session_token, code }
  });
}

export async function logout(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>({
    method: 'POST',
    endpoint: '/api/auth/logout'
  });
}

export async function getMe(): Promise<User> {
  return apiRequest<User>({
    method: 'GET',
    endpoint: '/api/auth/me'
  });
}

