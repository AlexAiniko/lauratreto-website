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
 *
 * Two shapes:
 *   - Local lead with picked slot: "New booking: Name, Saturday, May 3 11:30"
 *   - Online lead, no slot: "New online lead: Name (no slot picked)"
 * Body always lists what was captured; missing fields render as "(not provided)".
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
  const hasSlot = !!(date && time);
  const subject = hasSlot
    ? `New booking: ${prospectName || prospectEmail}, ${date} ${time}`.trim()
    : `New online lead: ${prospectName || prospectEmail} (no slot picked)`;

  const intro = hasSlot
    ? `New booking from the /client funnel.`
    : `New online lead from the /client funnel. No calendar slot picked, the prospect received the welcome email as the CTA to come back and book.`;

  const lines = [
    intro,
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
      <p style="font-size: 15px; margin: 0 0 16px;">${escapeHtml(intro)}</p>
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

// ----- Welcome emails (one per /client funnel bucket) -----

// Laura's revised copy (2026-04-30). Source: Desktop/LAURA-bucket-welcomes-paste.md
// Architecture note: welcomes fire INLINE via Gmail API at /client submission,
// NOT MailerLite automations. CTA URLs carry UTM tags so we can see which
// bucket converts. train-online uses a secondary text-link CTA to /pricing.
//
// Schema:
//   subject, preview          — inbox-level copy
//   paragraphs[]              — body, in order, including any P.S. / P.D. lines
//   ctaText, ctaUrl           — primary button
//   ctaSecondaryText/Url?     — optional secondary text-link (train-online only)
//   signoff                   — "Laura" (signature block is appended by renderer)
const WELCOME_TEMPLATES = {
  'dance-online': {
    en: {
      subject: 'You moved. I noticed.',
      preview: 'Quick chat to start. The rest follows.',
      ctaText: 'Book the call',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=dance-online',
      paragraphs: [
        'You moved. I noticed.',
        "I'm Laura. I've spent my life in dance. Performing, teaching, helping people find what their bodies are actually capable of.",
        "The first step is a quick call. We chat, we both decide if we're a good fit.",
        "Even if we don't end up working together, I'll make sure you get something useful out of the call.",
        'My calendar fills up fast. Worth booking early.',
        "Glad you're here.",
        'P.S. Hablamos español también, si lo prefieres.',
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Te moviste. Lo noté.',
      preview: 'Una llamada rápida para empezar. Lo demás sigue.',
      ctaText: 'Reservar la llamada',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=dance-online',
      paragraphs: [
        'Te moviste. Lo noté.',
        'Soy Laura. Llevo toda la vida bailando. Actuando, enseñando, ayudando a la gente a descubrir de qué son capaces sus cuerpos.',
        'El primer paso es una llamada rápida. Hablamos, los dos decidimos si encajamos bien.',
        'Aunque no terminemos trabajando juntas, me aseguro de que saques algo útil de la llamada.',
        'Mi agenda se llena rápido. Vale la pena reservar pronto.',
        'Qué bueno que estás aquí.',
        'P.D. We also coach in English, if you prefer.',
      ],
      signoff: 'Laura',
    },
  },
  'dance-local': {
    en: {
      subject: 'Coffee in Key West',
      preview: 'Quick chat. Either way you walk away with something.',
      ctaText: 'Book the call',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=dance-local',
      paragraphs: [
        "You're in Key West. So am I.",
        'Easiest first step is a quick coffee. On me, somewhere on the island. We chat about what you want and what you have tried, we both decide if we click.',
        "Even if we don't end up working together, I'll make sure you walk away with something.",
        'I keep my client list small. Worth booking early.',
        'Looking forward to it.',
        'P.S. Hablamos español también, si lo prefieres.',
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Un café en Key West',
      preview: 'Una charla rápida. De cualquier forma, te vas con algo.',
      ctaText: 'Reservar la llamada',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=dance-local',
      paragraphs: [
        'Estás en Key West. Yo también.',
        'El primer paso más fácil es un café rápido. Te invito yo, en algún lugar de la isla. Hablamos de lo que buscas y de lo que has probado, los dos decidimos si encajamos.',
        'Aunque no terminemos trabajando juntas, la conversación aterriza. Te vas con algo.',
        'Mi lista de clientes es pequeña. Vale la pena reservar pronto.',
        'Hablamos pronto.',
        'P.D. We also coach in English, if you prefer.',
      ],
      signoff: 'Laura',
    },
  },
  'train-online': {
    en: {
      subject: 'PT ended. Now what.',
      preview: 'Quick read. The first step is a phone call.',
      ctaText: 'Book the call',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=train-online&utm_content=call',
      ctaSecondaryText: 'Browse the programs',
      ctaSecondaryUrl: 'https://lauratreto.com/pricing?utm_source=welcome&utm_medium=email&utm_campaign=train-online&utm_content=programs',
      paragraphs: [
        'Most of you find me online from the same spot. Physical therapy ended. The exercises got boring. The app you tried felt like a robot wrote it.',
        "You want strength. You want your body to feel like it's on your side again. And every program online was built for someone twenty years old with no history.",
        "I'm Laura. NASM-certified strength coach. Most of my online clients have been with me for over a year.",
        'The first step is a quick call. We chat, we both decide if 1-on-1 coaching is the right move for you.',
        "Whether we end up working together or not, you'll come out of the call with a clearer plan.",
        'Online 1-on-1 spots are limited. I work with a small roster.',
        "Let's get you stronger.",
        "P.S. If a call isn't the right move for you yet, the strength programs are below. Start one today.",
        'P.P.S. Hablamos español también, si lo prefieres.',
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Terminó la fisio. ¿Y ahora?',
      preview: 'Lectura corta. El primer paso es una llamada.',
      ctaText: 'Reservar la llamada',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=train-online&utm_content=call',
      ctaSecondaryText: 'Ver los programas',
      ctaSecondaryUrl: 'https://lauratreto.com/pricing?utm_source=welcome&utm_medium=email&utm_campaign=train-online&utm_content=programs',
      paragraphs: [
        'La mayoría me encuentran online desde el mismo lugar. La fisio terminó. Los ejercicios se volvieron aburridos. La app que probaste parecía escrita por un robot.',
        'Quieres fuerza. Quieres sentir que tu cuerpo está de tu lado otra vez. Y todo programa online está hecho para alguien de veinte años sin historia.',
        'Soy Laura. Coach de fuerza certificada NASM. La mayoría de mis clientes online llevan más de un año conmigo.',
        'El primer paso es una llamada rápida. Hablamos, los dos decidimos si una sesión uno a uno es lo que necesitas.',
        'Terminemos trabajando juntas o no, sales de la llamada con un plan más claro.',
        'Los espacios de uno a uno online son limitados. Trabajo con una lista pequeña.',
        'Vamos a ponerte fuerte.',
        'P.D. Si una llamada no es para ti ahora, los programas de fuerza están abajo. Empieza uno hoy.',
        'P.P.D. We also coach in English, if you prefer.',
      ],
      signoff: 'Laura',
    },
  },
  'train-local': {
    en: {
      subject: 'Coffee first',
      preview: 'Quick chat. Either way you walk away with something useful.',
      ctaText: 'Book the call',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=train-local',
      paragraphs: [
        "You're in Key West. You want private training. Easiest first step is a quick coffee.",
        "On me, somewhere on the island. We chat about your goals, what hurts, what you've tried. We both decide if private training is the right fit.",
        "Even if we don't end up training together, you walk away with something useful.",
        'My calendar runs about a week or two out. Worth booking early.',
        'See you soon.',
        'P.S. Hablamos español también, si lo prefieres.',
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Primero, un café',
      preview: 'Una charla rápida. De cualquier forma, te vas con algo útil.',
      ctaText: 'Reservar la llamada',
      ctaUrl: 'https://lauratreto.com/client?utm_source=welcome&utm_medium=email&utm_campaign=train-local',
      paragraphs: [
        'Estás en Key West. Quieres entrenar privado. El primer paso más fácil es un café rápido.',
        'Te invito yo, en algún lugar de la isla. Hablamos de tus metas, qué te duele, qué has probado. Los dos decidimos si entrenar privado es la decisión correcta.',
        'Aunque no terminemos entrenando juntas, te vas con algo útil.',
        'Mi agenda corre con una o dos semanas de adelanto. Vale la pena reservar pronto.',
        'Nos vemos pronto.',
        'P.D. We also coach in English, if you prefer.',
      ],
      signoff: 'Laura',
    },
  },
};

// Signature block appended after the signoff. Same for EN and ES.
const WELCOME_SIGNATURE_LINES = [
  'Laura Treto',
  'Movement Coach, Key West',
  '@coachlauratreto',
  'lauratreto.com',
];

// ---------------------------------------------------------------------------
// Dance-lesson booking emails (tourist /book-dance-lesson flow)
// ---------------------------------------------------------------------------

const LESSON_LABELS = {
  solo:   { en: 'Solo Lesson',  es: 'Clase individual', price: '$150', duration_en: '60 min', duration_es: '60 min' },
  couple: { en: 'Couple Lesson', es: 'Clase en pareja', price: '$200', duration_en: '60 min', duration_es: '60 min' },
  group:  { en: 'Small Group',   es: 'Grupo pequeño',    price: '$300', duration_en: '75 min', duration_es: '75 min' },
};

/**
 * Confirmation email to a tourist who booked a dance lesson.
 * Brief and warm, includes the date/time, notes that location is confirmed
 * 24 hours before. FROM laura@.
 */
export async function sendDanceLessonConfirmation({
  prospectName,
  prospectEmail,
  lessonType,
  date,
  time,
  language,
  notes,
  calendarEventLink,
}) {
  const lang = language === 'es' ? 'es' : 'en';
  const firstName = (prospectName || '').split(' ')[0] || '';
  const tier = LESSON_LABELS[lessonType] || LESSON_LABELS.solo;

  let subject;
  let text;
  let html;

  if (lang === 'es') {
    subject = `Tu clase de baile está reservada, ${firstName}`.trim();
    const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
    const lines = [
      greeting,
      ``,
      `Recibí tu reserva para ${tier.es} (${tier.duration_es}). Te veo el ${date || 'día acordado'} a las ${time || 'la hora acordada'}.`,
      ``,
      `Te confirmo el punto de encuentro 24 horas antes (tu hotel, un estudio, o la playa, lo que mejor te quede).`,
    ];
    if (notes) lines.push(``, `Anotado: ${notes}`);
    if (calendarEventLink) lines.push(``, `Evento del calendario: ${calendarEventLink}`);
    lines.push(``, `Cualquier cambio, responde a este correo.`, ``, `Nos vemos pronto,`, `Laura`);
    text = lines.join('\n');
    const bodyParas = [
      `Recibí tu reserva para <strong>${escapeHtml(tier.es)}</strong> (${escapeHtml(tier.duration_es)}). Te veo el <strong>${escapeHtml(date || 'día acordado')}</strong> a las <strong>${escapeHtml(time || 'la hora acordada')}</strong>.`,
      `Te confirmo el punto de encuentro 24 horas antes (tu hotel, un estudio, o la playa, lo que mejor te quede).`,
    ];
    if (notes) bodyParas.push(`Anotado: ${escapeHtml(notes)}`);
    bodyParas.push(`Cualquier cambio, responde a este correo.`);
    html = renderConfirmationHtml({
      greeting,
      bodyParagraphs: bodyParas,
      ctaText: calendarEventLink ? 'Ver evento en mi calendario' : null,
      ctaLink: calendarEventLink,
      signoff: 'Nos vemos pronto,',
    });
  } else {
    subject = `Your Key West dance lesson is booked, ${firstName}`.trim();
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
    const lines = [
      greeting,
      ``,
      `Got your booking for the ${tier.en} (${tier.duration_en}). I'll see you on ${date || 'the day we picked'} at ${time || 'the time we picked'}.`,
      ``,
      `I'll confirm the meet-up spot 24 hours before (your hotel, a studio, or the beach, whatever works best for you).`,
    ];
    if (notes) lines.push(``, `Noted: ${notes}`);
    if (calendarEventLink) lines.push(``, `Calendar event: ${calendarEventLink}`);
    lines.push(``, `Anything changes on your end, just reply.`, ``, `See you soon,`, `Laura`);
    text = lines.join('\n');
    const bodyParas = [
      `Got your booking for the <strong>${escapeHtml(tier.en)}</strong> (${escapeHtml(tier.duration_en)}). I'll see you on <strong>${escapeHtml(date || 'the day we picked')}</strong> at <strong>${escapeHtml(time || 'the time we picked')}</strong>.`,
      `I'll confirm the meet-up spot 24 hours before (your hotel, a studio, or the beach, whatever works best for you).`,
    ];
    if (notes) bodyParas.push(`Noted: ${escapeHtml(notes)}`);
    bodyParas.push(`Anything changes on your end, just reply.`);
    html = renderConfirmationHtml({
      greeting,
      bodyParagraphs: bodyParas,
      ctaText: calendarEventLink ? 'Open calendar event' : null,
      ctaLink: calendarEventLink,
      signoff: 'See you soon,',
    });
  }

  return sendAndRelabel({ to: prospectEmail, subject, text, html });
}

/**
 * Notification email to laura@ summarizing the new dance-lesson booking.
 */
export async function sendDanceLessonNotification({
  prospectName,
  prospectEmail,
  lessonType,
  date,
  time,
  language,
  notes,
  calendarEventLink,
}) {
  const tier = LESSON_LABELS[lessonType] || LESSON_LABELS.solo;
  const subject = `New dance lesson: ${tier.en} ${tier.price} — ${prospectName || prospectEmail} — ${date || 'date TBD'} ${time || ''}`.trim();

  const lines = [
    `New dance lesson booking from /book-dance-lesson.`,
    ``,
    `Tier: ${tier.en} (${tier.price}, ${tier.duration_en})`,
    `Name: ${prospectName || '(not provided)'}`,
    `Email: ${prospectEmail}`,
    `Date: ${date || '(not provided)'}`,
    `Time: ${time || '(not provided)'}`,
    `Notes: ${notes || '(none)'}`,
    `Language: ${language || 'en'}`,
  ];
  if (calendarEventLink) lines.push(``, `Calendar event: ${calendarEventLink}`);
  const text = lines.join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2B2B2B; max-width: 560px;">
      <p style="font-size: 15px; margin: 0 0 16px;">New dance lesson booking from <strong>/book-dance-lesson</strong>.</p>
      <table style="border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Tier</td><td style="padding: 4px 0;">${escapeHtml(tier.en)} (${escapeHtml(tier.price)}, ${escapeHtml(tier.duration_en)})</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Name</td><td style="padding: 4px 0;">${escapeHtml(prospectName || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Email</td><td style="padding: 4px 0;"><a href="mailto:${escapeHtml(prospectEmail)}" style="color: #1A7A7A;">${escapeHtml(prospectEmail)}</a></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Date</td><td style="padding: 4px 0;">${escapeHtml(date || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Time</td><td style="padding: 4px 0;">${escapeHtml(time || '(not provided)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Notes</td><td style="padding: 4px 0;">${escapeHtml(notes || '(none)')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Language</td><td style="padding: 4px 0;">${escapeHtml(language || 'en')}</td></tr>
      </table>
      ${calendarEventLink ? `<p style="margin: 20px 0 0; font-size: 14px;"><a href="${escapeHtml(calendarEventLink)}" style="color: #E8654A;">Open calendar event &rarr;</a></p>` : ''}
    </div>
  `.trim();

  return sendAndRelabel({ to: FROM_ADDRESS, subject, text, html });
}

/**
 * One-time welcome email triggered when a prospect lands in a /client funnel
 * bucket for the first time. Should NOT fire on dedupes.
 */
export async function sendWelcomeEmail({
  bucket,
  prospectName,
  prospectEmail,
  language = 'en',
}) {
  const lang = language === 'es' ? 'es' : 'en';
  const tpl = WELCOME_TEMPLATES[bucket]?.[lang];
  if (!tpl) {
    throw new Error(`sendWelcomeEmail: unknown bucket "${bucket}"`);
  }
  const firstName = (prospectName || '').split(' ')[0] || '';
  const greeting = lang === 'es'
    ? (firstName ? `Hola ${firstName},` : 'Hola,')
    : (firstName ? `Hi ${firstName},` : 'Hi there,');

  // Plain-text fallback: greeting, body paragraphs, primary CTA URL, optional
  // secondary CTA URL, signoff, then the signature block. Email clients that
  // strip HTML still get something readable.
  const textLines = [greeting, '', ...tpl.paragraphs.flatMap((p) => [p, ''])];
  if (tpl.ctaText && tpl.ctaUrl) {
    textLines.push(`${tpl.ctaText}: ${tpl.ctaUrl}`, '');
  }
  if (tpl.ctaSecondaryText && tpl.ctaSecondaryUrl) {
    textLines.push(`${tpl.ctaSecondaryText}: ${tpl.ctaSecondaryUrl}`, '');
  }
  textLines.push(tpl.signoff, '', ...WELCOME_SIGNATURE_LINES);
  const text = textLines.join('\n').replace(/\n{3,}/g, '\n\n');

  const html = renderWelcomeHtml({
    preview: tpl.preview,
    greeting,
    paragraphs: tpl.paragraphs,
    ctaText: tpl.ctaText,
    ctaUrl: tpl.ctaUrl,
    ctaSecondaryText: tpl.ctaSecondaryText,
    ctaSecondaryUrl: tpl.ctaSecondaryUrl,
    signoff: tpl.signoff,
  });

  return sendAndRelabel({
    to: prospectEmail,
    subject: tpl.subject,
    text,
    html,
  });
}

function renderWelcomeHtml({ preview, greeting, paragraphs, ctaText, ctaUrl, ctaSecondaryText, ctaSecondaryUrl, signoff }) {
  const paras = paragraphs
    .map((p) => `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6;">${escapeHtml(p)}</p>`)
    .join('');
  const cta = ctaUrl && ctaText
    ? `<p style="margin: 24px 0 0;"><a href="${escapeHtml(ctaUrl)}" style="display: inline-block; padding: 10px 20px; background: #E8654A; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">${escapeHtml(ctaText)}</a></p>`
    : '';
  const ctaSecondary = ctaSecondaryUrl && ctaSecondaryText
    ? `<p style="margin: 12px 0 0; font-size: 13px;"><a href="${escapeHtml(ctaSecondaryUrl)}" style="color: #1A7A7A; text-decoration: underline;">${escapeHtml(ctaSecondaryText)}</a></p>`
    : '';
  // Signature block. Same lines for EN and ES; renders below the signoff.
  const sigInner = WELCOME_SIGNATURE_LINES
    .map((line, i) => {
      const weight = i === 0 ? '600' : '400';
      const color = i === 0 ? '#2B2B2B' : '#6b6b6b';
      return `<div style="font-size: 13px; color: ${color}; font-weight: ${weight}; line-height: 1.5;">${escapeHtml(line)}</div>`;
    })
    .join('');
  const signature = `<div style="margin: 20px 0 0;">${sigInner}</div>`;
  // Hidden preheader text for inbox preview snippet.
  const preheader = preview
    ? `<div style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preview)}</div>`
    : '';
  return `
    ${preheader}
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2B2B2B; max-width: 520px; padding: 8px 0;">
      <p style="margin: 0 0 14px; font-size: 15px;">${escapeHtml(greeting)}</p>
      ${paras}
      ${cta}
      ${ctaSecondary}
      <p style="margin: 24px 0 4px; font-size: 15px;">${escapeHtml(signoff)}</p>
      ${signature}
    </div>
  `.trim();
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
