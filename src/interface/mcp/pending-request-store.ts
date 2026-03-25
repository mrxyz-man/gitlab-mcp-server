import { randomUUID } from 'node:crypto';

type PendingRequest = {
  execute: () => Promise<unknown> | unknown;
  createdAt: number;
};

export class PendingRequestStore {
  private readonly items = new Map<string, PendingRequest>();

  constructor(
    private readonly ttlMs = 10 * 60 * 1000,
    private readonly maxItems = 200
  ) {}

  register(execute: () => Promise<unknown> | unknown): string {
    this.cleanup();
    this.ensureCapacity();

    const requestId = randomUUID();
    this.items.set(requestId, {
      execute,
      createdAt: Date.now()
    });

    return requestId;
  }

  async resume(requestId: string): Promise<unknown> {
    this.cleanup();
    const item = this.items.get(requestId);
    if (!item) {
      throw new Error('Pending request is not found or expired.');
    }

    const result = await item.execute();
    this.items.delete(requestId);
    return result;
  }

  has(requestId: string): boolean {
    this.cleanup();
    return this.items.has(requestId);
  }

  private ensureCapacity(): void {
    if (this.items.size < this.maxItems) {
      return;
    }

    const oldest = [...this.items.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) {
      this.items.delete(oldest[0]);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, item] of this.items.entries()) {
      if (now - item.createdAt > this.ttlMs) {
        this.items.delete(id);
      }
    }
  }
}
