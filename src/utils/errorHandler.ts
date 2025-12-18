/**
 * Comprehensive Error Handling Utilities
 * Provides custom error classes, error handling middleware, and utility functions
 * for consistent error management across the application
 */

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class for input validation failures
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    errors: Record<string, string[]> = {}
  ) {
    super(message, 400, true, { errors });
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.errors = errors;
  }
}

/**
 * Authentication error class for auth-related failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, 401, true, context);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error class for permission-related failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, true, context);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error class for resource not found scenarios
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, true, context);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error class for conflict scenarios (e.g., duplicate entries)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', context?: Record<string, any>) {
    super(message, 409, true, context);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit error class for API rate limiting
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
    super(message, 429, true, { retryAfter });
    Object.setPrototypeOf(this, RateLimitError.prototype);
    this.retryAfter = retryAfter;
  }
}

/**
 * External service error class for third-party API failures
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(
    service: string,
    message: string = `${service} service unavailable`,
    originalError?: Error
  ) {
    super(message, 503, true, { service });
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Database error class for database operation failures
 */
export class DatabaseError extends AppError {
  public readonly operation?: string;
  public readonly originalError?: Error;

  constructor(
    message: string = 'Database operation failed',
    operation?: string,
    originalError?: Error
  ) {
    super(message, 500, true, { operation });
    Object.setPrototypeOf(this, DatabaseError.prototype);
    this.operation = operation;
    this.originalError = originalError;
  }
}

/**
 * Error response interface for standardized error responses
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    details?: Record<string, any>;
    stack?: string;
  };
}

/**
 * Success response interface for consistency
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * Error code enum for consistent error identification
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Get error code from error instance
 */
export function getErrorCode(error: any): ErrorCode {
  if (error instanceof ValidationError) return ErrorCode.VALIDATION_ERROR;
  if (error instanceof AuthenticationError) return ErrorCode.AUTHENTICATION_ERROR;
  if (error instanceof AuthorizationError) return ErrorCode.AUTHORIZATION_ERROR;
  if (error instanceof NotFoundError) return ErrorCode.NOT_FOUND_ERROR;
  if (error instanceof ConflictError) return ErrorCode.CONFLICT_ERROR;
  if (error instanceof RateLimitError) return ErrorCode.RATE_LIMIT_ERROR;
  if (error instanceof ExternalServiceError) return ErrorCode.EXTERNAL_SERVICE_ERROR;
  if (error instanceof DatabaseError) return ErrorCode.DATABASE_ERROR;
  if (error instanceof AppError) return ErrorCode.INTERNAL_SERVER_ERROR;
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Convert any error to a standardized error response
 */
export function formatErrorResponse(
  error: any,
  requestId?: string,
  includeStack: boolean = false
): ErrorResponse {
  const isAppError = error instanceof AppError;
  const code = getErrorCode(error);
  const statusCode = isAppError ? error.statusCode : 500;
  const message = error?.message || 'An unexpected error occurred';

  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId,
      details:
        isAppError && error.context
          ? error.context
          : undefined,
      stack: includeStack && error?.stack ? error.stack : undefined,
    },
  };
}

/**
 * Safely execute async operations with error handling
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorHandler?: (error: Error) => AppError
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (errorHandler) {
      throw errorHandler(error as Error);
    }

    throw new AppError(
      'An unexpected error occurred',
      500,
      false,
      { originalError: (error as Error).message }
    );
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2,
  shouldRetry: (error: Error) => boolean = () => true
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Validate required fields in an object
 */
export function validateRequired(
  obj: Record<string, any>,
  requiredFields: string[]
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const field of requiredFields) {
    if (!obj[field]) {
      errors[field] = [`${field} is required`];
    }
  }

  return errors;
}

/**
 * Assert condition and throw error if false
 */
export function assert(
  condition: boolean,
  message: string,
  statusCode: number = 400
): asserts condition {
  if (!condition) {
    throw new AppError(message, statusCode);
  }
}

/**
 * Assert authentication (throw if not authenticated)
 */
export function assertAuthenticated(user: any, message: string = 'User is not authenticated'): asserts user {
  if (!user) {
    throw new AuthenticationError(message);
  }
}

/**
 * Assert authorization (throw if not authorized)
 */
export function assertAuthorized(
  authorized: boolean,
  message: string = 'User is not authorized'
): asserts authorized {
  if (!authorized) {
    throw new AuthorizationError(message);
  }
}

/**
 * Assert resource exists (throw if not found)
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string = 'Resource'
): asserts resource {
  if (!resource) {
    throw new NotFoundError(resourceName);
  }
}

/**
 * Create error logger for consistent logging
 */
export function createErrorLogger(moduleName: string) {
  return {
    log: (error: any, context?: Record<string, any>) => {
      const errorResponse = formatErrorResponse(error, undefined, true);
      console.error(`[${moduleName}] Error:`, {
        ...errorResponse.error,
        ...context,
      });
    },
    warn: (message: string, context?: Record<string, any>) => {
      console.warn(`[${moduleName}] Warning: ${message}`, context);
    },
    info: (message: string, context?: Record<string, any>) => {
      console.log(`[${moduleName}] Info: ${message}`, context);
    },
  };
}

/**
 * Handle common database errors and convert to AppError
 */
export function handleDatabaseError(error: any, operation: string = 'operation'): DatabaseError {
  if (error.code === 'ER_DUP_ENTRY') {
    return new DatabaseError(
      'Duplicate entry found',
      operation,
      error
    );
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new DatabaseError(
      'Referenced record not found',
      operation,
      error
    );
  }

  return new DatabaseError(
    `Database ${operation} failed: ${error.message}`,
    operation,
    error
  );
}

/**
 * Global error handler for uncaught exceptions
 */
export function setupGlobalErrorHandling() {
  process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  ErrorCode,
  formatErrorResponse,
  safeExecute,
  retryWithBackoff,
  validateRequired,
  assert,
  assertAuthenticated,
  assertAuthorized,
  assertExists,
  createErrorLogger,
  handleDatabaseError,
  setupGlobalErrorHandling,
};
