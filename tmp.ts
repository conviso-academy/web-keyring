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
  TimeoutError
} from './errors';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    headers: {
      'Cache-Control': 'no-cache',
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
        errorData = { message: response.statusText || 'Unknown error occurred' };
      }

      const message = errorData.message || errorData.error || `HTTP Error ${response.status}`;

      if (response.status === 401) {
        state.isAuthenticated = false;
        state.currentUser = null;
        state.tempSessionToken = null;
        state.revealedSecretValue = null;
        state.twoFaSetupData = null;
        navigate('login');
        showToast('Session expired or unauthorized. Please log in again.', 'error');
        throw new AuthenticationError(message);
      } else if (response.status === 400) {
        throw new ValidationError(message);
      } else if (response.status === 404) {
        throw new NotFoundError(message);
      } else if (response.status === 409) {
        throw new ConflictError(message);
      } else if (response.status === 429) {
        throw new RateLimitError(message);
      } else if (response.status >= 500) {
        throw new ServerError(message);
      } else {
        // Fallback for unexpected errors
        throw new ApiError(response.status, message);
      }
    }

    // Temporary mockDelay to avoid breaking other files before Phase 3-6

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
