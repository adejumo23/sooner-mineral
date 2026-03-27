/**
 * Simple email sender for ticket notifications.
 * Configure SMTP via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 * If not configured, logs and skips sending (no throw).
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let transporter: any = null;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || '587';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.log('[Email] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Skipping send.');
    transporter = null;
    return null;
  }
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: port === '465',
      auth: { user, pass },
    });
  } catch (e) {
    console.warn('[Email] Nodemailer not available. Install with: npm install nodemailer', e);
    transporter = null;
  }
  return transporter;
}

const defaultFrom = process.env.SMTP_FROM || 'Sooner Mineral <noreply@sooner-mineral.local>';

export async function sendTicketEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const trans = getTransporter();
  if (!trans) return false;
  try {
    await trans.sendMail({
      from: defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
    });
    return true;
  } catch (err: any) {
    console.error('[Email] Send failed:', err?.message || err);
    return false;
  }
}
