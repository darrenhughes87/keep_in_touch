// Optional Haiku integration. Degrades gracefully if key missing.

import Anthropic from '@anthropic-ai/sdk';

export function haveAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_BASE = `Write in plain English, British spelling, warm, never marketing-speak. Never use em dashes (—). Never use phrases like "I hope this finds you well" or "just touching base". You are a quiet helper, not a copywriter.`;

export async function cleanDictation(raw: string): Promise<string> {
  if (!haveAnthropicKey()) return raw;
  const c = client();
  const prompt = `Clean up this dictated note. The speaker rambles: changes their mind mid-sentence, repeats themselves, says "um", "you know", "like", etc. Distill into 1 to 3 short sentences capturing only what they actually meant — facts, observations, things that happened. Keep their voice; don't add anything they didn't say. British English. Plain. No em dashes. No quotes, no preamble, no commentary. Output ONLY the cleaned text.

If the input has no clear meaningful content, return the original input unchanged.

Raw dictation:
${raw}`;

  const res = await c.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM_BASE,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = res.content[0];
  return block.type === 'text' ? block.text.trim() : raw;
}

export async function suggestOpener(personName: string, latestNote: string | null): Promise<string> {
  if (!haveAnthropicKey()) {
    return latestNote
      ? `Ask how things are since they mentioned: ${latestNote}`
      : `Drop a quick hello, ask what they've been up to`;
  }

  const c = client();
  const noteLine = latestNote ? `Last note about them: "${latestNote}"` : 'No prior notes.';
  const prompt = `Help the user message ${personName}, a friend, after a gap. Give ONE short opener (one or two sentences, max 25 words) they can send as a WhatsApp message. Lead with something real, not "hey, all good?". ${noteLine}\n\nReply with the message text only, no quotes, no preamble.`;

  const res = await c.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    system: SYSTEM_BASE,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = res.content[0];
  return block.type === 'text' ? block.text.trim() : '';
}

export async function briefingScript(payload: {
  date: string;
  greeting_tone: string;
  suggestions: Array<{ name: string; days_since: number | null; cadence: number; latest_note: string | null; layer: string }>;
  birthdays: Array<{ name: string; days_until: number }>;
}): Promise<string> {
  if (!haveAnthropicKey()) {
    return localBriefingScript(payload);
  }

  const c = client();
  const lines = payload.suggestions.map(s => {
    const since = s.days_since == null ? 'no record of you reaching out before' : `${s.days_since} days since you last spoke`;
    const note = s.latest_note ? ` Your last note: "${s.latest_note}".` : '';
    return `- ${s.name} (${s.layer}, ${since}, you usually chat every ~${s.cadence} days).${note}`;
  }).join('\n');
  const bdays = payload.birthdays.length
    ? `\nBirthdays this week:\n${payload.birthdays.map(b => `- ${b.name} in ${b.days_until} day${b.days_until === 1 ? '' : 's'}`).join('\n')}`
    : '';

  const prompt = `Write a short morning briefing for the user, to be read aloud by a TTS voice. Around 15 to 25 seconds when spoken (40 to 70 words). Soft, calm, not breezy. No em dashes. No "your three suggestions are". Just talk.

Today's people:
${lines || '- nobody surfaced today'}
${bdays}

Reply with the briefing text only.`;

  const res = await c.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: SYSTEM_BASE,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = res.content[0];
  return block.type === 'text' ? block.text.trim() : localBriefingScript(payload);
}

function localBriefingScript(payload: {
  suggestions: Array<{ name: string; days_since: number | null; latest_note: string | null }>;
  birthdays: Array<{ name: string; days_until: number }>;
}): string {
  // Time-neutral — user might listen at any hour. No "morning" or similar.
  if (!payload.suggestions.length && !payload.birthdays.length) {
    return "You're all caught up. No one's drifting.";
  }
  const lines: string[] = [];
  if (payload.suggestions.length === 1) {
    lines.push(`One name: ${payload.suggestions[0].name}.`);
  } else if (payload.suggestions.length > 1) {
    lines.push(`A few people.`);
  }
  for (const s of payload.suggestions) {
    const since = s.days_since ? `${s.days_since} days` : 'a while';
    const note = s.latest_note ? ` Last time, ${s.latest_note}.` : '';
    lines.push(`${s.name}, ${since} since you spoke.${note}`);
  }
  for (const b of payload.birthdays) {
    lines.push(`${b.name}'s birthday is in ${b.days_until} day${b.days_until === 1 ? '' : 's'}.`);
  }
  return lines.join(' ');
}
