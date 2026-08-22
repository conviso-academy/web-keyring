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

export const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));
