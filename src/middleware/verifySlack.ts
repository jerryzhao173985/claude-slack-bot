import { Context, Next } from 'hono';
import { Env } from '../types/env';

type Variables = {
  rawBody: string;
};

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifySlack(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const signature = c.req.header('x-slack-signature');
  const timestamp = c.req.header('x-slack-request-timestamp');

  if (!signature || !timestamp) {
    return c.text('Bad signature', 401);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timestampAge = Math.abs(currentTime - Number(timestamp));

  if (timestampAge > 300) {
    return c.text('Stale request', 401);
  }

  const body = await c.req.text();
  c.set('rawBody', body);

  const sigBasestring = `v0:${timestamp}:${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(c.env.SLACK_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature_buffer = await crypto.subtle.sign('HMAC', key, encoder.encode(sigBasestring));

  const computed_signature = `v0=${bufferToHex(signature_buffer)}`;

  if (computed_signature !== signature) {
    return c.text('Bad signature', 401);
  }

  return next();
}
