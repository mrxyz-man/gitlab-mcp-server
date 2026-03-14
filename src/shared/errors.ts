export class PolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export type ExternalErrorKind =
  | 'auth'
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'server'
  | 'not_found'
  | 'validation'
  | 'unknown';

export class ExternalServiceError extends Error {
  constructor(
    readonly service: string,
    readonly kind: ExternalErrorKind,
    readonly message: string,
    readonly options?: {
      status?: number;
      requestId?: string;
      retriable?: boolean;
      body?: string;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'ExternalServiceError';
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}
