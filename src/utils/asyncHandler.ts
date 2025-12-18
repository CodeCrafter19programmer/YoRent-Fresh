/**
 * Comprehensive Async Handler Utilities
 * Provides utilities for timeout protection, debounce, throttle, retry logic, polling, and batching operations
 */

/**
 * Type definitions for async operations
 */
type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;
type VoidAsyncFunction = (...args: any[]) => Promise<void>;

interface TimeoutOptions {
  timeoutMs: number;
  throwError?: boolean;
  fallbackValue?: any;
}

interface DebounceOptions {
  wait: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

interface ThrottleOptions {
  limit: number;
  interval?: number;
}

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

interface PollOptions {
  intervalMs: number;
  maxAttempts?: number;
  maxDurationMs?: number;
  shouldStop?: (result: any) => boolean;
}

interface BatchOptions {
  batchSize: number;
  delayMs?: number;
  onError?: (error: Error, item: any) => void;
}

/**
 * Timeout Protection
 * Wraps a promise with a timeout to prevent hanging operations
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<T> => {
  const { timeoutMs, throwError = true, fallbackValue = null } = options;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        const error = new Error(`Operation timed out after ${timeoutMs}ms`);
        error.name = 'TimeoutError';
        if (throwError) {
          reject(error);
        } else {
          reject({ timedOut: true, fallbackValue });
        }
      }, timeoutMs)
    ),
  ]).catch((error) => {
    if (!throwError && error?.timedOut) {
      return fallbackValue as T;
    }
    throw error;
  });
};

/**
 * Async Timeout Wrapper
 * Creates a function that enforces a timeout on async operations
 */
export const createTimeoutWrapper = <T extends AsyncFunction>(
  fn: T,
  timeoutMs: number
): T => {
  return (async (...args: any[]) => {
    return withTimeout(fn(...args), {
      timeoutMs,
      throwError: true,
    });
  }) as T;
};

/**
 * Debounce
 * Delays execution of an async function, canceling previous calls if new ones arrive
 */
export const debounce = <T extends AsyncFunction>(
  fn: T,
  options: DebounceOptions
): { (...args: Parameters<T>): Promise<ReturnType<T>>; cancel: () => void } => {
  const { wait, maxWait, leading = false, trailing = true } = options;

  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;
  let lastCallTime: number | null = null;
  let result: Promise<ReturnType<T>> | null = null;

  const debounced = async function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;
    const time = Date.now();

    if (leading && !timeout && !lastCallTime) {
      result = fn.apply(this, args);
      lastCallTime = time;
    }

    // Clear existing timeout
    if (timeout) clearTimeout(timeout);

    // Set up max wait timeout
    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (trailing && lastArgs) {
          result = fn.apply(lastThis, lastArgs);
        }
        timeout = null;
        maxTimeout = null;
        lastCallTime = null;
      }, maxWait);
    }

    // Set up trailing timeout
    timeout = setTimeout(() => {
      if (trailing && lastArgs) {
        result = fn.apply(lastThis, lastArgs);
      }
      timeout = null;
      lastCallTime = null;
    }, wait);

    return result || Promise.resolve();
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    if (maxTimeout) clearTimeout(maxTimeout);
    timeout = null;
    maxTimeout = null;
    lastArgs = null;
  };

  return debounced;
};

/**
 * Throttle
 * Limits execution frequency of an async function
 */
export const throttle = <T extends AsyncFunction>(
  fn: T,
  options: ThrottleOptions
): { (...args: Parameters<T>): Promise<ReturnType<T>>; cancel: () => void } => {
  const { limit, interval = 1000 } = options;

  let lastCallTime = 0;
  let queuedArgs: any[] | null = null;
  let queuedThis: any = null;
  let timeoutId: NodeJS.Timeout | null = null;
  let callCount = 0;
  let result: Promise<ReturnType<T>> | null = null;

  const throttled = async function (this: any, ...args: Parameters<T>) {
    queuedArgs = args;
    queuedThis = this;

    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (callCount < limit && timeSinceLastCall >= interval / limit) {
      result = fn.apply(this, args);
      lastCallTime = now;
      callCount = 1;
    } else if (!timeoutId) {
      const waitTime =
        interval / limit - timeSinceLastCall > 0
          ? interval / limit - timeSinceLastCall
          : interval;

      timeoutId = setTimeout(async () => {
        if (queuedArgs) {
          result = fn.apply(queuedThis, queuedArgs);
          callCount = 1;
        }
        lastCallTime = Date.now();
        timeoutId = null;
        queuedArgs = null;
      }, waitTime);
    }

    return result || Promise.resolve();
  };

  throttled.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    queuedArgs = null;
  };

  return throttled;
};

/**
 * Retry Logic
 * Retries a failed async operation with exponential backoff
 */
export const retry = async <T>(
  fn: AsyncFunction<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, currentDelay));

      // Calculate next delay with exponential backoff
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
};

/**
 * Polling
 * Polls an async function until a condition is met or timeout occurs
 */
export const poll = async <T>(
  fn: AsyncFunction<T>,
  options: PollOptions
): Promise<T> => {
  const {
    intervalMs,
    maxAttempts = Infinity,
    maxDurationMs = Infinity,
    shouldStop = () => true,
  } = options;

  let attempt = 0;
  const startTime = Date.now();

  while (attempt < maxAttempts) {
    const result = await fn();

    if (shouldStop(result)) {
      return result;
    }

    const elapsed = Date.now() - startTime;
    if (elapsed >= maxDurationMs) {
      throw new Error(
        `Polling timed out after ${maxDurationMs}ms and ${attempt} attempts`
      );
    }

    attempt++;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Polling reached maximum attempts (${maxAttempts}) without meeting stop condition`
  );
};

/**
 * Batch Processing
 * Processes items in batches with concurrent execution within each batch
 */
export const batch = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: BatchOptions
): Promise<(R | Error)[]> => {
  const { batchSize, delayMs = 0, onError } = options;
  const results: (R | Error)[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batchItems = items.slice(i, i + batchSize);

    try {
      const batchResults = await Promise.allSettled(
        batchItems.map((item) => fn(item))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const error = result.reason;
          results.push(error);
          onError?.(error, batchItems[index]);
        }
      });
    } catch (error) {
      const err = error as Error;
      batchItems.forEach((item) => {
        results.push(err);
        onError?.(err, item);
      });
    }

    // Add delay between batches
    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

/**
 * Rate Limiter
 * Controls the rate of async operations
 */
export class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.windowMs
    );

    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequestTime = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequestTime);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.requestTimes.push(now);
  }

  reset(): void {
    this.requestTimes = [];
  }
}

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping calls to failing services
 */
export class CircuitBreaker<T extends AsyncFunction> {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(
    private fn: T,
    failureThreshold: number = 5,
    resetTimeoutMs: number = 60000
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (this.state === 'OPEN') {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeoutMs
      ) {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Memoization with TTL
 * Caches async function results with time-to-live
 */
export const memoize = <T extends AsyncFunction>(
  fn: T,
  ttlMs: number = 5000
): T => {
  const cache = new Map<string, { value: any; expiresAt: number }>();

  return (async (...args: any[]) => {
    const key = JSON.stringify(args);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && now < cached.expiresAt) {
      return cached.value;
    }

    const result = await fn(...args);
    cache.set(key, { value: result, expiresAt: now + ttlMs });

    return result;
  }) as T;
};

/**
 * Sequential Execution
 * Executes promises sequentially
 */
export const sequential = async <T>(
  promiseFns: Array<() => Promise<T>>
): Promise<T[]> => {
  const results: T[] = [];

  for (const promiseFn of promiseFns) {
    results.push(await promiseFn());
  }

  return results;
};

/**
 * Parallel Execution with Concurrency Limit
 * Executes promises in parallel with a maximum concurrency limit
 */
export const parallelLimit = async <T>(
  promiseFns: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> => {
  const results: T[] = new Array(promiseFns.length);
  const executing: Promise<any>[] = [];

  for (let i = 0; i < promiseFns.length; i++) {
    const promise = Promise.resolve().then(async () => {
      const result = await promiseFns[i]();
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((p) => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
};

/**
 * Wait utility
 * Waits for a specified duration
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Async Try-Catch Helper
 * Simplifies error handling for async operations
 */
export const asyncTryCatch = async <T, E = Error>(
  fn: () => Promise<T>
): Promise<[T | null, E | null]> => {
  try {
    const data = await fn();
    return [data, null];
  } catch (error) {
    return [null, error as E];
  }
};

/**
 * Conditional Retry
 * Retries based on result or error condition
 */
export const retryUntil = async <T>(
  fn: AsyncFunction<T>,
  condition: (result: T | Error) => boolean,
  maxAttempts: number = 5,
  delayMs: number = 1000
): Promise<T> => {
  let lastResult: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      lastResult = result;

      if (condition(result)) {
        return result;
      }
    } catch (error) {
      lastResult = error;

      if (condition(error as Error)) {
        throw error;
      }
    }

    if (attempt < maxAttempts - 1) {
      await wait(delayMs);
    }
  }

  throw new Error(
    `retryUntil failed after ${maxAttempts} attempts. Last result: ${lastResult}`
  );
};

export default {
  withTimeout,
  createTimeoutWrapper,
  debounce,
  throttle,
  retry,
  poll,
  batch,
  RateLimiter,
  CircuitBreaker,
  memoize,
  sequential,
  parallelLimit,
  wait,
  asyncTryCatch,
  retryUntil,
};
