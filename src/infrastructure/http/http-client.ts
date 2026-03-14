import { ExternalServiceError } from '../../shared/errors';

type HttpClientOptions = {
  service: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  logger?: HttpClientLogger;
};

type JsonRequestOptions = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export class HttpClient {
  private readonly service: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly logger?: HttpClientLogger;

  constructor(options: HttpClientOptions) {
    this.service = options.service;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 200;
    this.logger = options.logger;
  }

  async requestJson<T>(options: JsonRequestOptions): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(options.url, {
          method,
          headers: options.headers,
          body: options.body,
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
          return (await response.json()) as T;
        }

        const body = await safeReadBody(response);
        const requestId =
          response.headers.get('x-request-id') ?? response.headers.get('x-gitlab-request-id') ?? undefined;
        const error = mapHttpError(this.service, response.status, body, requestId);
        this.log({
          level: 'error',
          event: 'http.request.failed',
          service: this.service,
          method,
          url: options.url,
          attempt,
          status: response.status,
          requestId,
          retriable: Boolean(error.options?.retriable)
        });

        if (attempt < this.maxRetries && isRetryableHttpStatus(response.status) && isRetryableMethod(method)) {
          const delayMs = backoff(attempt, this.retryBaseDelayMs);
          this.log({
            level: 'warn',
            event: 'http.request.retry',
            service: this.service,
            method,
            url: options.url,
            attempt,
            status: response.status,
            requestId,
            delayMs
          });
          await sleep(delayMs);
          continue;
        }

        throw error;
      } catch (error) {
        clearTimeout(timeout);

        const mapped = mapTransportError(this.service, error);
        this.log({
          level: 'error',
          event: 'http.request.transport_error',
          service: this.service,
          method,
          url: options.url,
          attempt,
          kind: mapped.kind,
          retriable: Boolean(mapped.options?.retriable)
        });
        if (attempt < this.maxRetries && mapped.options?.retriable && isRetryableMethod(method)) {
          const delayMs = backoff(attempt, this.retryBaseDelayMs);
          this.log({
            level: 'warn',
            event: 'http.request.retry',
            service: this.service,
            method,
            url: options.url,
            attempt,
            kind: mapped.kind,
            delayMs
          });
          await sleep(delayMs);
          continue;
        }

        throw mapped;
      }
    }

    throw new ExternalServiceError(this.service, 'unknown', 'Request failed after retries.', {
      retriable: false
    });
  }

  private log(event: HttpClientLogEvent): void {
    if (this.logger) {
      this.logger(event);
      return;
    }

    const line = JSON.stringify(event);
    if (event.level === 'error') {
      console.error(line);
      return;
    }
    if (event.level === 'warn') {
      console.warn(line);
    }
  }
}

type HttpClientLogger = (event: HttpClientLogEvent) => void;

type HttpClientLogEvent = {
  level: 'warn' | 'error';
  event: 'http.request.failed' | 'http.request.transport_error' | 'http.request.retry';
  service: string;
  method: string;
  url: string;
  attempt: number;
  status?: number;
  requestId?: string;
  kind?: string;
  retriable?: boolean;
  delayMs?: number;
};

function mapHttpError(
  service: string,
  status: number,
  body: string,
  requestId?: string
): ExternalServiceError {
  if (status === 401 || status === 403) {
    return new ExternalServiceError(service, 'auth', `Unauthorized (${status})`, {
      status,
      requestId,
      body,
      retriable: false
    });
  }

  if (status === 404) {
    return new ExternalServiceError(service, 'not_found', 'Resource not found (404).', {
      status,
      requestId,
      body,
      retriable: false
    });
  }

  if (status === 429) {
    return new ExternalServiceError(service, 'rate_limit', 'Rate limit reached (429).', {
      status,
      requestId,
      body,
      retriable: true
    });
  }

  if (status >= 500) {
    return new ExternalServiceError(service, 'server', `Server error (${status}).`, {
      status,
      requestId,
      body,
      retriable: true
    });
  }

  if (status >= 400) {
    return new ExternalServiceError(service, 'validation', `Request failed (${status}).`, {
      status,
      requestId,
      body,
      retriable: false
    });
  }

  return new ExternalServiceError(service, 'unknown', `Unexpected HTTP status (${status}).`, {
    status,
    requestId,
    body,
    retriable: false
  });
}

function mapTransportError(service: string, error: unknown): ExternalServiceError {
  if (error instanceof ExternalServiceError) {
    return error;
  }

  if (isAbortError(error)) {
    return new ExternalServiceError(service, 'timeout', 'Request timed out.', {
      retriable: true,
      cause: error
    });
  }

  return new ExternalServiceError(service, 'network', 'Network error during request.', {
    retriable: true,
    cause: error
  });
}

function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybe = error as { name?: string; message?: string };
  const name = (maybe.name ?? '').toLowerCase();
  const message = (maybe.message ?? '').toLowerCase();
  return name.includes('abort') || name.includes('timeout') || message.includes('aborted');
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function isRetryableMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

function backoff(attempt: number, baseMs: number): number {
  const jitter = Math.floor(Math.random() * 40);
  return baseMs * 2 ** attempt + jitter;
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
