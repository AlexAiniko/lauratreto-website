// Gmail send + label-rewrite helpers.
// Sends from laura@lauratreto.com (the Google account behind the refresh token).
// After every send, the message is moved out of SENT into a Booking-Bot label
// to keep Laura's Sent folder uncluttered by automated messages.

import { getGoogleClient } from './google.js';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

const FROM_NAME = 'Laura Treto';
const FROM_ADDRESS = 'laura@lauratreto.com';
const BOOKING_BOT_LABEL = 'Booking-Bot';

let cachedLabelId = null;

async function getOrCreateBookingBotLabel(gmail) {
  if (cachedLabelId) return cachedLabelId;
  const list = await gmail.users.labels.list({ userId: 'me' });
  const found = (list.data.labels || []).find((l) => l.name === BOOKING_BOT_LABEL);
  if (found) {
    cachedLabelId = found.id;
    return cachedLabelId;
  }
  const created = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: BOOKING_BOT_LABEL,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    },
  });
  cachedLabelId = created.data.id;
  return cachedLabelId;
}

async function sendAndRelabel({ to, subject, text, html }) {
  const { gmail } = getGoogleClient();

  const composer = new MailComposer({
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to,
    subject,
    text,
    html,
  });
  const built = await composer.compile().build();
  const raw = Buffer.from(built).toString('base64url');

  const sent = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
  const messageId = sent.data.id;

  try {
    const labelId = await getOrCreateBookingBotLabel(gmail);
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
        removeLabelIds: ['SENT'],
      },
    });
  } catch (err) {
    // Non-fatal: the email already went out.
    console.error('[lib/email] label rewrite failed for', messageId, err?.message || err);
  }

  return sent.data;
}

/**
 * Self-addressed memo to laura@lauratreto.com summarizing a new booking.
 */
export async function sendBookingNotification({
  prospectName,
  prospectEmail,
  prospectPhone,
  date,
  time,
  intent,
  mode,
  language,
  calendarEventLink,
}) {
  const subject = `New booking: ${prospectName || prospectEmail} — ${date || 'date TBD'} ${time || ''}`.trim();

  const lines = [
    `New booking from the /client funnel.`,
    ``,
    `Name: ${prospectName || '(not provided)'}`,
    `Email: ${prospectEmail}`,
    `Phone: ${prospectPhone || '(not provided)'}`,
    `Date: ${date || '(not provided)'}`,
    `Time: ${time || '(not provided)'}`,
    `Intent: ${intent || '(not provided)'}`,
    `Mode: ${mode || '(not provided)'}`,
    `Language: ${language || 'en'}`,
  ];
  if (calendarEventLink) {
    lines.push(``, `Calendar event: ${calendarEventLink}`);
  }
  const text = lines.join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2B2B2B; max-width: 560px;">
      <p style="font-size: 15px; margin: 0 0 16px;">New booking from the /client funnel.</p>
      <table style="border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Name</td><td style="padding: 4px 0;">${escapeHtml(prospectName || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Email</td><td style="padding: 4px 0;"><a href="mailto:${escapeHtml(prospectEmail)}" style="color: #1A7A7A;">${escapeHtml(prospectEmail)}</a></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Phone</td><td style="padding: 4px 0;">${escapeHtml(prospectPhone || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Date</td><td style="padding: 4px 0;">${escapeHtml(date || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Time</td><td style="padding: 4px 0;">${escapeHtml(time || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Intent</td><td style="padding: 4px 0;">${escapeHtml(intent || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Mode</td><td style="padding: 4px 0;">${escapeHtml(mode || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Language</td><td style="padding: 4px 0;">${escapeHtml(language || 'en')}</td></tr>
      </table>
      ${calendarEventLink ? `<p style="margin: 20px 0 0; font-size: 14px;"><a href="${escapeHtml(calendarEventLink)}" style="color: #E8654A;">Open calendar event &rarr;</a></p>` : ''}
    </div>
  `.trim();

  return sendAndRelabel({
    to: FROM_ADDRESS,
    subject,
    text,
    html,
  });
}

/**
 * Friendly first-person confirmation to the prospect.
 */
export async function sendBookingConfirmation({
  prospectName,
  prospectEmail,
  date,
  time,
  language,
  calendarEventLink,
}) {
  const lang = language === 'es' ? 'es' : 'en';
  const firstName = (prospectName || '').split(' ')[0] || '';

  let subject;
  let text;
  let html;

  if (lang === 'es') {
    subject = `Cita confirmada, ${firstName}`;
    const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
    const lines = [
      greeting,
      ``,
      `Recibí tu reserva. Te veo el ${date || 'día acordado'} a las ${time || 'la hora acordada'}.`,
      ``,
      `Si necesitas cambiar la hora o cancelar, responde a este correo y lo arreglamos.`,
    ];
    if (calendarEventLink) {
      lines.push(``, `Aquí tienes el evento del calendario: ${calendarEventLink}`);
    }
    lines.push(``, `Nos vemos pronto,`, `Laura`);
    text = lines.join('\n');
    html = renderConfirmationHtml({
      greeting,
      bodyParagraphs: [
        `Recibí tu reserva. Te veo el <strong>${escapeHtml(date || 'día acordado')}</strong> a las <strong>${escapeHtml(time || 'la hora acordada')}</strong>.`,
        `Si necesitas cambiar la hora o cancelar, responde a este correo y lo arreglamos.`,
      ],
      ctaText: calendarEventLink ? 'Ver evento en mi calendario' : null,
      ctaLink: calendarEventLink,
      signoff: 'Nos vemos pronto,',
    });
  } else {
    subject = `You're booked, ${firstName}`.trim();
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
    const lines = [
      greeting,
      ``,
      `Got your booking. I'll see you on ${date || 'the day we picked'} at ${time || 'the time we picked'}.`,
      ``,
      `If anything changes on your end, just reply to this email and we'll sort it out.`,
    ];
    if (calendarEventLink) {
      lines.push(``, `Calendar event: ${calendarEventLink}`);
    }
    lines.push(``, `See you soon,`, `Laura`);
    text = lines.join('\n');
    html = renderConfirmationHtml({
      greeting,
      bodyParagraphs: [
        `Got your booking. I'll see you on <strong>${escapeHtml(date || 'the day we picked')}</strong> at <strong>${escapeHtml(time || 'the time we picked')}</strong>.`,
        `If anything changes on your end, just reply to this email and we'll sort it out.`,
      ],
      ctaText: calendarEventLink ? 'Open calendar event' : null,
      ctaLink: calendarEventLink,
      signoff: 'See you soon,',
    });
  }

  return sendAndRelabel({
    to: prospectEmail,
    subject,
    text,
    html,
  });
}

function renderConfirmationHtml({ greeting, bodyParagraphs, ctaText, ctaLink, signoff }) {
  const paras = bodyParagraphs.map((p) => `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6;">${p}</p>`).join('');
  const cta = ctaLink && ctaText
    ? `<p style="margin: 24px 0 0;"><a href="${escapeHtml(ctaLink)}" style="display: inline-block; padding: 10px 20px; background: #E8654A; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">${escapeHtml(ctaText)}</a></p>`
    : '';
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2B2B2B; max-width: 520px; padding: 8px 0;">
      <p style="margin: 0 0 14px; font-size: 15px;">${escapeHtml(greeting)}</p>
      ${paras}
      ${cta}
      <p style="margin: 24px 0 4px; font-size: 15px;">${escapeHtml(signoff)}</p>
      <p style="margin: 0; font-size: 15px; font-weight: 600;">Laura</p>
    </div>
  `.trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
