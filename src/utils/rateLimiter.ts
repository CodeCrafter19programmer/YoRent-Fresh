/**
 * Rate Limiter Utilities
 * Comprehensive rate limiting solutions to prevent brute force attacks
 * Includes sliding window, token bucket, and distributed rate limiters
 */

/**
 * Interface for rate limiter storage backend
 */
export interface IRateLimiterStore {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  incr(key: string): Promise<number>;
  del(key: string): Promise<void>;
}

/**
 * In-memory rate limiter store (suitable for single-instance applications)
 */
export class InMemoryStore implements IRateLimiterStore {
  private store = new Map<string, { value: any; expiresAt: number }>();

  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, ttl: number = 3600000): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  async incr(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) {
      this.store.set(key, { value: 1, expiresAt: Date.now() + 3600000 });
      return 1;
    }
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      this.store.set(key, { value: 1, expiresAt: Date.now() + 3600000 });
      return 1;
    }
    const newValue = (item.value || 0) + 1;
    item.value = newValue;
    return newValue;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Sliding Window Rate Limiter
 * Tracks requests within a sliding time window
 * More accurate than fixed windows but requires more memory
 */
export class SlidingWindowRateLimiter {
  private store: IRateLimiterStore;
  private windowSize: number; // milliseconds
  private maxRequests: number;

  constructor(
    store: IRateLimiterStore,
    windowSizeMs: number,
    maxRequests: number
  ) {
    this.store = store;
    this.windowSize = windowSizeMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed and track it
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @returns true if request is allowed, false if rate limited
   */
  async isAllowed(identifier: string): Promise<boolean> {
    const key = `sliding:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    let timestamps: number[] = (await this.store.get(key)) || [];

    // Remove timestamps outside the sliding window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      await this.store.set(key, timestamps, Math.ceil(this.windowSize / 1000));
      return true;
    }

    return false;
  }

  /**
   * Get current request count within the window
   */
  async getRequestCount(identifier: string): Promise<number> {
    const key = `sliding:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    let timestamps: number[] = (await this.store.get(key)) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);

    return timestamps.length;
  }

  /**
   * Reset rate limiter for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `sliding:${identifier}`;
    await this.store.del(key);
  }
}

/**
 * Token Bucket Rate Limiter
 * Allows flexible rate limiting with burst capacity
 * Tokens are refilled at a constant rate
 */
export class TokenBucketRateLimiter {
  private store: IRateLimiterStore;
  private capacity: number; // maximum tokens in bucket
  private refillRate: number; // tokens per second
  private lastRefillTime: Map<string, number> = new Map();

  constructor(store: IRateLimiterStore, capacity: number, refillRate: number) {
    this.store = store;
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  /**
   * Check if request is allowed (costs 1 token)
   * @param identifier - Unique identifier
   * @param tokensRequired - Number of tokens to consume (default: 1)
   * @returns true if allowed, false if insufficient tokens
   */
  async isAllowed(
    identifier: string,
    tokensRequired: number = 1
  ): Promise<boolean> {
    const key = `bucket:${identifier}`;
    const now = Date.now();

    let bucket: { tokens: number; lastRefill: number } = await this.store.get(
      key
    );

    if (!bucket) {
      bucket = {
        tokens: this.capacity,
        lastRefill: now,
      };
    }

    // Calculate tokens to add based on time elapsed
    const timePassed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens >= tokensRequired) {
      bucket.tokens -= tokensRequired;
      await this.store.set(key, bucket, 3600); // 1 hour TTL
      return true;
    }

    await this.store.set(key, bucket, 3600);
    return false;
  }

  /**
   * Get current token count
   */
  async getTokenCount(identifier: string): Promise<number> {
    const key = `bucket:${identifier}`;
    const now = Date.now();

    let bucket: { tokens: number; lastRefill: number } = await this.store.get(
      key
    );

    if (!bucket) {
      return this.capacity;
    }

    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    const currentTokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);

    return currentTokens;
  }

  /**
   * Reset token bucket
   */
  async reset(identifier: string): Promise<void> {
    const key = `bucket:${identifier}`;
    await this.store.del(key);
  }
}

/**
 * Distributed Rate Limiter
 * Suitable for multi-instance deployments
 * Uses external store (Redis) to maintain shared state
 */
export class DistributedRateLimiter {
  private store: IRateLimiterStore;
  private maxRequests: number;
  private windowSize: number; // milliseconds

  constructor(
    store: IRateLimiterStore,
    maxRequests: number,
    windowSizeMs: number
  ) {
    this.store = store;
    this.maxRequests = maxRequests;
    this.windowSize = windowSizeMs;
  }

  /**
   * Check if request is allowed
   * Uses atomic increment operation for consistency
   */
  async isAllowed(identifier: string): Promise<boolean> {
    const key = `distributed:${identifier}`;
    const ttl = Math.ceil(this.windowSize / 1000);

    const count = await this.store.incr(key);

    if (count === 1) {
      // First request in this window, set TTL
      await this.store.set(key, count, ttl);
    }

    return count <= this.maxRequests;
  }

  /**
   * Get current request count
   */
  async getRequestCount(identifier: string): Promise<number> {
    const key = `distributed:${identifier}`;
    const count = await this.store.get(key);
    return count || 0;
  }

  /**
   * Get remaining requests allowed
   */
  async getRemainingRequests(identifier: string): Promise<number> {
    const count = await this.getRequestCount(identifier);
    return Math.max(0, this.maxRequests - count);
  }

  /**
   * Reset rate limiter
   */
  async reset(identifier: string): Promise<void> {
    const key = `distributed:${identifier}`;
    await this.store.del(key);
  }
}

/**
 * Login Rate Limiter
 * Prevents brute force attacks on login endpoint
 * Default: 5 attempts per 15 minutes
 */
export class LoginRateLimiter {
  private limiter: DistributedRateLimiter;
  private maxAttempts: number;
  private windowSizeMs: number;

  constructor(store: IRateLimiterStore, maxAttempts: number = 5, windowMin: number = 15) {
    this.maxAttempts = maxAttempts;
    this.windowSizeMs = windowMin * 60 * 1000;
    this.limiter = new DistributedRateLimiter(store, maxAttempts, this.windowSizeMs);
  }

  async isAllowed(identifier: string): Promise<boolean> {
    return this.limiter.isAllowed(identifier);
  }

  async getAttempts(identifier: string): Promise<number> {
    return this.limiter.getRequestCount(identifier);
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    return this.limiter.getRemainingRequests(identifier);
  }

  async reset(identifier: string): Promise<void> {
    return this.limiter.reset(identifier);
  }

  async getResetTimeMs(identifier: string): Promise<number> {
    return this.windowSizeMs;
  }
}

/**
 * Signup Rate Limiter
 * Prevents abuse of signup endpoint
 * Default: 3 signup attempts per hour
 */
export class SignupRateLimiter {
  private limiter: DistributedRateLimiter;
  private maxAttempts: number;
  private windowSizeMs: number;

  constructor(store: IRateLimiterStore, maxAttempts: number = 3, windowMin: number = 60) {
    this.maxAttempts = maxAttempts;
    this.windowSizeMs = windowMin * 60 * 1000;
    this.limiter = new DistributedRateLimiter(store, maxAttempts, this.windowSizeMs);
  }

  async isAllowed(identifier: string): Promise<boolean> {
    return this.limiter.isAllowed(identifier);
  }

  async getAttempts(identifier: string): Promise<number> {
    return this.limiter.getRequestCount(identifier);
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    return this.limiter.getRemainingRequests(identifier);
  }

  async reset(identifier: string): Promise<void> {
    return this.limiter.reset(identifier);
  }

  async getResetTimeMs(identifier: string): Promise<number> {
    return this.windowSizeMs;
  }
}

/**
 * Password Reset Rate Limiter
 * Prevents abuse of password reset endpoint
 * Default: 3 attempts per hour
 */
export class PasswordResetRateLimiter {
  private limiter: DistributedRateLimiter;
  private maxAttempts: number;
  private windowSizeMs: number;

  constructor(store: IRateLimiterStore, maxAttempts: number = 3, windowMin: number = 60) {
    this.maxAttempts = maxAttempts;
    this.windowSizeMs = windowMin * 60 * 1000;
    this.limiter = new DistributedRateLimiter(store, maxAttempts, this.windowSizeMs);
  }

  async isAllowed(identifier: string): Promise<boolean> {
    return this.limiter.isAllowed(identifier);
  }

  async getAttempts(identifier: string): Promise<number> {
    return this.limiter.getRequestCount(identifier);
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    return this.limiter.getRemainingRequests(identifier);
  }

  async reset(identifier: string): Promise<void> {
    return this.limiter.reset(identifier);
  }

  async getResetTimeMs(identifier: string): Promise<number> {
    return this.windowSizeMs;
  }
}

/**
 * API Call Rate Limiter
 * General purpose rate limiter for API endpoints
 * Default: 100 requests per minute
 */
export class APIRateLimiter {
  private limiter: TokenBucketRateLimiter;
  private maxRequests: number;

  constructor(store: IRateLimiterStore, maxRequests: number = 100) {
    this.maxRequests = maxRequests;
    // Refill rate: maxRequests per 60 seconds
    const refillRate = maxRequests / 60;
    this.limiter = new TokenBucketRateLimiter(store, maxRequests, refillRate);
  }

  async isAllowed(identifier: string, tokensRequired: number = 1): Promise<boolean> {
    return this.limiter.isAllowed(identifier, tokensRequired);
  }

  async getAvailableTokens(identifier: string): Promise<number> {
    return this.limiter.getTokenCount(identifier);
  }

  async reset(identifier: string): Promise<void> {
    return this.limiter.reset(identifier);
  }
}

/**
 * Composite Rate Limiter
 * Combines multiple rate limiters for comprehensive protection
 */
export class CompositeRateLimiter {
  private limiters: { name: string; limiter: any }[] = [];

  addLimiter(name: string, limiter: any): void {
    this.limiters.push({ name, limiter });
  }

  async checkAll(identifier: string): Promise<{
    allowed: boolean;
    violations: string[];
  }> {
    const violations: string[] = [];

    for (const { name, limiter } of this.limiters) {
      const allowed = await limiter.isAllowed(identifier);
      if (!allowed) {
        violations.push(name);
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  async reset(identifier: string): Promise<void> {
    for (const { limiter } of this.limiters) {
      if (limiter.reset) {
        await limiter.reset(identifier);
      }
    }
  }
}

/**
 * Rate Limiter Factory
 * Creates preconfigured rate limiters for common scenarios
 */
export class RateLimiterFactory {
  static createLoginLimiter(store: IRateLimiterStore): LoginRateLimiter {
    return new LoginRateLimiter(store, 5, 15); // 5 attempts per 15 minutes
  }

  static createSignupLimiter(store: IRateLimiterStore): SignupRateLimiter {
    return new SignupLimiter(store, 3, 60); // 3 attempts per hour
  }

  static createPasswordResetLimiter(
    store: IRateLimiterStore
  ): PasswordResetRateLimiter {
    return new PasswordResetRateLimiter(store, 3, 60); // 3 attempts per hour
  }

  static createAPILimiter(store: IRateLimiterStore): APIRateLimiter {
    return new APIRateLimiter(store, 100); // 100 requests per minute
  }

  static createSlidingWindowLimiter(
    store: IRateLimiterStore,
    maxRequests: number = 10,
    windowMin: number = 1
  ): SlidingWindowRateLimiter {
    return new SlidingWindowRateLimiter(
      store,
      windowMin * 60 * 1000,
      maxRequests
    );
  }

  static createTokenBucketLimiter(
    store: IRateLimiterStore,
    capacity: number = 10,
    refillRate: number = 1
  ): TokenBucketRateLimiter {
    return new TokenBucketRateLimiter(store, capacity, refillRate);
  }

  static createDistributedLimiter(
    store: IRateLimiterStore,
    maxRequests: number = 100,
    windowMin: number = 1
  ): DistributedRateLimiter {
    return new DistributedRateLimiter(store, maxRequests, windowMin * 60 * 1000);
  }
}

/**
 * Rate Limiter Response Helper
 * Generates standardized rate limit responses
 */
export interface RateLimitResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: {
    error: string;
    message: string;
    retryAfter: number; // seconds
  };
}

export class RateLimiterResponseHelper {
  static generateLimitExceededResponse(retryAfterSeconds: number): RateLimitResponse {
    return {
      statusCode: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(
          Date.now() + retryAfterSeconds * 1000
        ).toISOString(),
      },
      body: {
        error: "TOO_MANY_REQUESTS",
        message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      },
    };
  }

  static generateLoginLimitExceededResponse(): RateLimitResponse {
    return this.generateLimitExceededResponse(900); // 15 minutes
  }

  static generateSignupLimitExceededResponse(): RateLimitResponse {
    return this.generateLimitExceededResponse(3600); // 1 hour
  }

  static generatePasswordResetLimitExceededResponse(): RateLimitResponse {
    return this.generateLimitExceededResponse(3600); // 1 hour
  }

  static generateAPILimitExceededResponse(retryAfterSeconds: number = 60): RateLimitResponse {
    return this.generateLimitExceededResponse(retryAfterSeconds);
  }
}

/**
 * Utility Functions
 */

/**
 * Extract client identifier from request (IP or User ID)
 * @param ip - Client IP address
 * @param userId - Optional user ID
 * @returns Unique identifier
 */
export function getClientIdentifier(ip: string, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ip}`;
}

/**
 * Convert minutes to milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return Math.ceil(ms / 1000);
}

/**
 * Get retry-after time in seconds
 */
export function getRetryAfterSeconds(windowSizeMs: number): number {
  return msToSeconds(windowSizeMs);
}

// Export all classes and functions
export default {
  // Stores
  InMemoryStore,
  // Rate Limiters
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  DistributedRateLimiter,
  // Specific Limiters
  LoginRateLimiter,
  SignupRateLimiter,
  PasswordResetRateLimiter,
  APIRateLimiter,
  // Composite
  CompositeRateLimiter,
  // Factory
  RateLimiterFactory,
  // Response Helper
  RateLimiterResponseHelper,
  // Utilities
  getClientIdentifier,
  minutesToMs,
  secondsToMs,
  msToSeconds,
  getRetryAfterSeconds,
};
