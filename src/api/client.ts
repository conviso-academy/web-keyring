/// <reference types="vite/client" />
import { state } from '../state';
import { navigate } from '../router';
import { showToast } from '../components/toast';
import {
  ApiError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  ServerError,
  TimeoutError,
  type ValidationErrorItem
} from './errors';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  body?: any;
  queryParams?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
}

export async function apiRequest<T>({
  method,
  endpoint,
  body,
  queryParams,
  headers = {}
}: ApiRequestOptions): Promise<T> {
  let url = `${BASE_URL}${endpoint}`;

  if (queryParams) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const fetchOptions: RequestInit = {
    method,
    credentials: 'include',
    signal: controller.signal,
    cache: 'no-cache',
    headers: {
      ...headers
    }
  };

  if (body !== undefined) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json'
    };
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {};
      }

      const rawDetail = errorData?.detail;
      let message: string;
      if (typeof rawDetail === 'string') {
        message = rawDetail;
      } else if (Array.isArray(rawDetail)) {
        message =
          rawDetail
            .map((item: any) => item?.msg)
            .filter(Boolean)
            .join('; ') || `HTTP Error ${response.status}`;
      } else {
        message = errorData?.message || errorData?.error || response.statusText || `HTTP Error ${response.status}`;
      }

      if (response.status === 401) {
        // Não redirecionar nem limpar estado se for uma rota de autenticação (login, 2fa, etc)
        // Nesses casos, o 401 significa apenas credencial/código inválido e a UI lidará com isso.
        const isAuthEndpoint = endpoint.startsWith('/api/auth/login') || endpoint.includes('/2fa/');
        if (!isAuthEndpoint) {
          state.isAuthenticated = false;
          state.currentUser = null;
          state.tempSessionToken = null;
          state.revealedSecretValue = null;
          state.twoFaSetupData = null;
          navigate('login');
          showToast('Sessão expirada ou não autorizada. Faça login novamente.', 'error');
        }
        throw new AuthenticationError(message);
      } else if (response.status === 422) {
        const errors: ValidationErrorItem[] = Array.isArray(rawDetail)
          ? rawDetail.map((item: any) => ({
              loc: Array.isArray(item?.loc) ? item.loc : [],
              msg: item?.msg ?? '',
              type: item?.type ?? ''
            }))
          : [];
        throw new ValidationError(message, errors);
      } else if (response.status === 400) {
        throw new ValidationError(message);
      } else if (response.status === 404) {
        throw new NotFoundError(message);
      } else if (response.status === 409) {
        const secretsCount =
          typeof errorData?.secrets_count === 'number' ? errorData.secrets_count : undefined;
        throw new ConflictError(message, secretsCount);
      } else if (response.status === 429) {
        throw new RateLimitError(message);
      } else if (response.status >= 500) {
        throw new ServerError(message);
      } else {
        throw new ApiError(response.status, message);
      }
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError('Request timed out');
    }

    throw new ServerError(error instanceof Error ? error.message : 'Network error');
  }
}
