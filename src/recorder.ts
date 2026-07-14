type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
type RecorderOptions = { baseUrl?: string; enabled?: boolean; now?: () => number; fetcher?: Fetcher };

export class SessionRecorder {
  private readonly baseUrl: string;
  private readonly now: () => number;
  private readonly fetcher: Fetcher;
  private enabled: boolean;
  private sessionId: string | null = null;
  private enteredAt: number | null = null;
  private activeMs = 0;
  private visible = true;

  constructor(options: RecorderOptions = {}) {
    this.baseUrl = options.baseUrl ?? '/api';
    this.enabled = options.enabled ?? true;
    this.now = options.now ?? Date.now;
    this.fetcher = options.fetcher ?? fetch;
  }

  async start(courseId: string) {
    if (!this.enabled) return;
    try {
      const response = await this.fetcher(`${this.baseUrl}/sessions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ courseId }) });
      if (!response.ok) throw new Error(`session start failed: ${response.status}`);
      this.sessionId = (await response.json() as { sessionId?: string }).sessionId ?? null;
      this.enteredAt = this.now();
      this.activeMs = 0;
      this.visible = true;
    } catch {
      this.enabled = false;
    }
  }

  async slideCompleted(slideId: string) {
    const durationMs = this.enteredAt === null ? 0 : Math.max(0, this.activeMs + (this.visible ? this.now() - this.enteredAt : 0));
    this.activeMs = 0;
    this.enteredAt = this.now();
    await this.send({ type: 'slide_segment', slideId, durationMs });
  }

  setVisibility(visible: boolean) {
    if (!this.enabled || !this.sessionId || this.visible === visible) return;
    if (!visible && this.enteredAt !== null) this.activeMs += Math.max(0, this.now() - this.enteredAt);
    if (visible) this.enteredAt = this.now();
    this.visible = visible;
  }

  async answer(slideId: string, optionId: string) {
    await this.send({ type: 'answer', slideId, optionId });
  }

  async feature(name: string) {
    await this.send({ type: 'feature', name });
  }

  async finish(status: 'completed' | 'abandoned' = 'completed') {
    await this.send({ type: 'status', status });
    this.sessionId = null;
  }

  private async send(event: Record<string, unknown>) {
    if (!this.enabled || !this.sessionId) return;
    try {
      const response = await this.fetcher(`${this.baseUrl}/sessions/${this.sessionId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event }) });
      if (!response.ok) this.enabled = false;
    } catch {
      this.enabled = false;
    }
  }
}
