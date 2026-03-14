import { HttpClient } from '../src/infrastructure/http/http-client';
import { ExternalServiceError } from '../src/shared/errors';

describe('HttpClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('retries GET on 503 and eventually succeeds', async () => {
    const response503 = new Response('temporary', { status: 503 });
    const response200 = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(response503)
      .mockResolvedValueOnce(response200) as unknown as typeof fetch;

    global.fetch = fetchMock;

    const client = new HttpClient({
      service: 'gitlab',
      timeoutMs: 1000,
      maxRetries: 2,
      retryBaseDelayMs: 1
    });

    const result = await client.requestJson<{ ok: boolean }>({
      url: 'https://example.test/api',
      method: 'GET'
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('maps timeout to ExternalServiceError(timeout)', async () => {
    global.fetch = jest.fn(async (_input: unknown, init?: RequestInit) => {
      const signal = init?.signal;
      await new Promise((resolve, reject) => {
        if (!signal) {
          return;
        }
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        setTimeout(resolve, 50);
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const client = new HttpClient({
      service: 'gitlab',
      timeoutMs: 1,
      maxRetries: 0
    });

    await expect(
      client.requestJson<{ ok: boolean }>({ url: 'https://example.test/api', method: 'GET' })
    ).rejects.toMatchObject<Partial<ExternalServiceError>>({
      name: 'ExternalServiceError',
      kind: 'timeout'
    });
  });

  test('maps 401 to auth error', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('unauthorized', { status: 401 })) as unknown as typeof fetch;

    const client = new HttpClient({ service: 'gitlab', timeoutMs: 1000, maxRetries: 0 });

    await expect(
      client.requestJson<{ ok: boolean }>({ url: 'https://example.test/api', method: 'GET' })
    ).rejects.toMatchObject<Partial<ExternalServiceError>>({
      name: 'ExternalServiceError',
      kind: 'auth',
      service: 'gitlab'
    });
  });

  test('propagates request id from response headers', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response('rate limited', {
          status: 429,
          headers: { 'x-request-id': 'req-123' }
        })
      ) as unknown as typeof fetch;

    const client = new HttpClient({ service: 'gitlab', timeoutMs: 1000, maxRetries: 0 });

    await expect(
      client.requestJson<{ ok: boolean }>({ url: 'https://example.test/api', method: 'GET' })
    ).rejects.toMatchObject<Partial<ExternalServiceError>>({
      name: 'ExternalServiceError',
      kind: 'rate_limit',
      options: { requestId: 'req-123' }
    });
  });

  test('emits structured log events via custom logger', async () => {
    const events: Array<Record<string, unknown>> = [];
    global.fetch = jest.fn().mockResolvedValue(new Response('temporary', { status: 503 })) as unknown as typeof fetch;

    const client = new HttpClient({
      service: 'gitlab',
      timeoutMs: 1000,
      maxRetries: 0,
      logger: (event) => events.push(event as Record<string, unknown>)
    });

    await expect(
      client.requestJson<{ ok: boolean }>({ url: 'https://example.test/api', method: 'GET' })
    ).rejects.toBeInstanceOf(ExternalServiceError);

    expect(events.some((e) => e.event === 'http.request.failed')).toBe(true);
  });
});
