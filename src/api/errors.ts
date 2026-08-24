export class ApiError extends Error {
  public status: number;
  public detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', detail?: string) {
    super(401, message, detail);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not found', detail?: string) {
    super(404, message, detail);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  public secretsCount?: number;

  constructor(message: string = 'Conflict', secretsCount?: number, detail?: string) {
    super(409, message, detail);
    this.name = 'ConflictError';
    this.secretsCount = secretsCount;
  }
}

export interface ValidationErrorItem {
  loc: string[];
  msg: string;
  type: string;
}

export class ValidationError extends ApiError {
  public errors: ValidationErrorItem[];

  constructor(message: string = 'Validation error', errors: ValidationErrorItem[] = [], detail?: string) {
    super(422, message, detail);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class RateLimitError extends ApiError {
  public retryAfter: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 0, detail?: string) {
    super(429, message, detail);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error', detail?: string) {
    super(500, message, detail);
    this.name = 'ServerError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout', detail?: string) {
    super(0, message, detail);
    this.name = 'TimeoutError';
  }
}
