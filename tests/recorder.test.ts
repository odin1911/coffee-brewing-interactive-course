import { describe, expect, it } from 'vitest';
import { SessionRecorder } from '../src/recorder';

describe('SessionRecorder', () => {
  it('writes a slide segment as soon as the learner leaves it', async () => {
    let now = 1000;
    const calls: Array<{ url: string; body: any }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
      return { ok: true, json: async () => ({ sessionId: 'session-1' }) } as Response;
    };
    const recorder = new SessionRecorder({ fetcher, now: () => now });
    await recorder.start('coffee');
    now = 2200;
    await recorder.slideCompleted('cover');
    expect(calls[1].body.event).toMatchObject({ type: 'slide_segment', slideId: 'cover', durationMs: 1200 });
  });

  it('records answer and feature events immediately', async () => {
    const calls: any[] = [];
    const fetcher = async (_url: string, init?: RequestInit) => { calls.push(init?.body ? JSON.parse(String(init.body)) : null); return { ok: true, json: async () => ({ sessionId: 'session-1' }) } as Response; };
    const recorder = new SessionRecorder({ fetcher });
    await recorder.start('coffee');
    await recorder.answer('quiz', 'basic');
    await recorder.feature('chart_detail_open');
    expect(calls.slice(1).map((call) => call.event.type)).toEqual(['answer', 'feature']);
  });

  it('does nothing when recording is disabled', async () => {
    let calls = 0;
    const fetcher = async () => { calls += 1; return { ok: true, json: async () => ({}) } as Response; };
    const recorder = new SessionRecorder({ enabled: false, fetcher });
    await recorder.start('coffee');
    await recorder.feature('ignored');
    expect(calls).toBe(0);
  });

  it('excludes time while the page is hidden', async () => {
    let now = 1000;
    const calls: any[] = [];
    const fetcher = async (_url: string, init?: RequestInit) => { calls.push(init?.body ? JSON.parse(String(init.body)) : null); return { ok: true, json: async () => ({ sessionId: 'session-1' }) } as Response; };
    const recorder = new SessionRecorder({ fetcher, now: () => now });
    await recorder.start('coffee');
    recorder.setVisibility(false);
    now = 5000;
    recorder.setVisibility(true);
    now = 6200;
    await recorder.slideCompleted('cover');
    expect(calls[1].event.durationMs).toBe(1200);
  });
});
