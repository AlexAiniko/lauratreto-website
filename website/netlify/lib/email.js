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

// ----- Welcome emails (one per /client funnel bucket) -----

// Romy's v2 copy. Source: Output/LAURA-bucket-welcomes.md
// CTAs intentionally strip ?src=... params from quiz URLs (function doesn't
// read them) and use /client (no #booking) because the deep-link is broken.
const WELCOME_TEMPLATES = {
  'dance-online': {
    en: {
      subject: 'You moved. I noticed.',
      preview: 'A quick note from me, plus the next step if you want one.',
      ctaText: 'See my Movement Readiness',
      ctaUrl: 'https://lauratreto.com/quiz.html',
      paragraphs: [
        "I'm Laura.",
        "I spent fifteen years performing at the highest level of dance, more than 1,500 shows on five continents. The thing nobody tells you about that life is what it teaches you about your own body. How a small shift in the hip changes everything above it. How breath sets the rhythm before the music does.",
        "That's what I bring to the people I coach online. Not choreography. Movement quality. Mobility. Strength that holds up when you actually use it.",
        "If you want to train with me from wherever you are, I have one ask first. Take the Movement Readiness quiz. It's three minutes. It tells me how you move right now, what your body is asking for, and whether we're a fit before we book anything.",
        "That's the only next step. No pitch, no upsell. Just the quiz.",
        "I'll see your answers when they come in.",
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Te moviste. Lo noté.',
      preview: 'Una nota corta de mí, y el siguiente paso si lo quieres.',
      ctaText: 'Ver mi Movement Readiness',
      ctaUrl: 'https://lauratreto.com/quiz.html',
      paragraphs: [
        'Soy Laura.',
        'Pasé quince años bailando al más alto nivel, más de 1,500 funciones en cinco continentes. Lo que nadie te cuenta de esa vida es lo que te enseña sobre tu propio cuerpo. Cómo un pequeño cambio en la cadera cambia todo lo de arriba. Cómo la respiración marca el ritmo antes que la música.',
        'Eso es lo que llevo a las personas que entreno online. No coreografía. Calidad de movimiento. Movilidad. Fuerza real, la que aguanta cuando la usas de verdad.',
        'Si quieres entrenar conmigo desde donde estés, te pido una sola cosa primero. Haz el quiz de Movilidad y Disponibilidad. Son tres minutos. Me dice cómo te mueves hoy, qué te está pidiendo tu cuerpo, y si encajamos antes de reservar nada.',
        'Ese es el único paso. Sin venta, sin presión. Solo el quiz.',
        'Veo tus respuestas cuando lleguen.',
      ],
      signoff: 'Laura',
    },
  },
  'dance-local': {
    en: {
      subject: 'Welcome to the island side',
      preview: 'Two ways to meet me in Key West, one is free.',
      ctaText: 'Book my free 15 min',
      ctaUrl: 'https://lauratreto.com/client',
      paragraphs: [
        "I'm Laura.",
        "You picked Key West and you picked dance, which means we're already speaking the same language. I moved here this year and I'm building something I couldn't build anywhere else. Movement coaching that uses the island, the water, the salt air, the way the light drops at sunset.",
        "I host community sessions at White Street Pier when the moon and the timing line up. Free, outdoors, salsa-based, all levels. If one's coming up soon, I'll let you know in the next email.",
        'Either way, the easiest first step is a free 15-minute call. We talk, I listen, you decide what you want. No pressure, no script.',
        "Glad you're here.",
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Bienvenida al lado de la isla',
      preview: 'Dos formas de conocerme en Key West, una es gratis.',
      ctaText: 'Reservar mis 15 min gratis',
      ctaUrl: 'https://lauratreto.com/client',
      paragraphs: [
        'Soy Laura.',
        'Escogiste Key West y escogiste el baile, así que ya hablamos el mismo idioma. Me mudé aquí este año y estoy construyendo algo que no podría construir en ningún otro lado. Coaching de movimiento que usa la isla, el agua, el aire salado, la forma en que cae la luz al atardecer.',
        'A veces armo sesiones comunitarias en el White Street Pier, cuando la luna y los tiempos se alinean. Gratis, al aire libre, base de salsa, todos los niveles. Si hay una cerca, te aviso en el próximo correo.',
        'De cualquier forma, el primer paso más fácil es una llamada gratis de 15 minutos. Hablamos, escucho, tú decides qué quieres. Sin presión, sin guión.',
        'Qué bueno que estás aquí.',
      ],
      signoff: 'Laura',
    },
  },
  'train-online': {
    en: {
      subject: 'PT ended. Now what.',
      preview: 'A quick read from your new coach. Three minutes of work at the end.',
      ctaText: 'See my Movement Readiness',
      ctaUrl: 'https://lauratreto.com/quiz.html',
      paragraphs: [
        "I'm Laura.",
        'Most people who find me online are in the same place. Physical therapy ended. The exercises got boring. The app you tried felt like a robot wrote it. You want to get strong, but every program online is built for someone twenty years old with no history.',
        "I work differently. I'm NASM certified and I came up through a career in dance, which means I treat your body like an instrument, not a machine. Compound movement. End-range strength. Power that goes UP with age, not down. Soreness is not the goal. Performance is.",
        "Before I write you any plan, I want to know how you actually move. The Movement Readiness quiz is three minutes. It's the same quiz I run with my one-on-one clients. Take it and I'll see exactly where to start.",
        "There's a 12-week online program called Strong Lean Athletic if it ends up being a fit. We can talk about that later. The quiz is the door.",
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Terminó la fisio. ¿Y ahora qué?',
      preview: 'Una lectura corta de tu nueva coach. Tres minutos de trabajo al final.',
      ctaText: 'Ver mi Movement Readiness',
      ctaUrl: 'https://lauratreto.com/quiz.html',
      paragraphs: [
        'Soy Laura.',
        'La mayoría de las personas que me encuentran online están en el mismo lugar. La fisio terminó. Los ejercicios se volvieron aburridos. La app que probaste parecía escrita por un robot. Quieres ponerte fuerte, pero todo programa online está hecho para alguien de veinte años sin historia.',
        'Yo trabajo distinto. Soy NASM certificada y vengo de una carrera en el baile, así que trato tu cuerpo como un instrumento, no una máquina. Movimientos compuestos. Fuerza en el rango completo. Potencia que SUBE con la edad, no baja. El dolor muscular no es la meta. El rendimiento sí.',
        'Antes de escribirte ningún plan, quiero saber cómo te mueves de verdad. El quiz de Movilidad y Disponibilidad es de tres minutos. Es el mismo quiz que uso con mis clientes uno a uno. Hazlo y veo exactamente por dónde empezar.',
        'Hay un programa online de 12 semanas que se llama Strong Lean Athletic, por si encajamos bien. De eso hablamos después. El quiz es la puerta.',
      ],
      signoff: 'Laura',
    },
  },
  'train-local': {
    en: {
      subject: "I'll be in touch this week",
      preview: 'A real handshake. Booking link inside if you want to skip ahead.',
      ctaText: 'Book my free 15 min',
      ctaUrl: 'https://lauratreto.com/client',
      paragraphs: [
        "I'm Laura.",
        'You picked Key West and private training, which is the closest version of working with me. So this email is short on purpose. I want to actually meet you, not write at you.',
        "Here's how it goes. I run a free 15-minute call before any session. We talk about your body, your history, what you want to do, what hurts, what works. I listen first. Then I tell you honestly whether I'm the right coach for what you need. Sometimes I am. Sometimes I refer out. Both are fine.",
        "If you want to skip ahead and book that call right now, here's the link. If you'd rather wait for me to reach out personally, I'll be in touch within a few days.",
        'Either way, this is a real handshake. Welcome.',
      ],
      signoff: 'Laura',
    },
    es: {
      subject: 'Te escribo esta semana',
      preview: 'Un saludo de verdad. Enlace para reservar adentro si quieres adelantar.',
      ctaText: 'Reservar mis 15 min gratis',
      ctaUrl: 'https://lauratreto.com/client',
      paragraphs: [
        'Soy Laura.',
        'Escogiste Key West y entrenamiento privado, que es la versión más cercana de trabajar conmigo. Por eso este correo es corto a propósito. Quiero conocerte de verdad, no escribirte de lejos.',
        'Así funciona. Hago una llamada gratis de 15 minutos antes de cualquier sesión. Hablamos de tu cuerpo, tu historia, qué quieres hacer, qué te duele, qué te funciona. Escucho primero. Después te digo con honestidad si soy la coach adecuada para lo que necesitas. A veces sí. A veces te recomiendo a otra persona. Las dos están bien.',
        'Si quieres adelantar y reservar esa llamada ahora, aquí está el enlace. Si prefieres esperar a que te escriba personalmente, te contacto en los próximos días.',
        'De cualquier forma, esto es un saludo de verdad. Bienvenida.',
      ],
      signoff: 'Laura',
    },
  },
};

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

  const text = [greeting, '', ...tpl.paragraphs.flatMap((p) => [p, '']), tpl.signoff].join('\n').replace(/\n{3,}/g, '\n\n');

  const html = renderWelcomeHtml({
    preview: tpl.preview,
    greeting,
    paragraphs: tpl.paragraphs,
    ctaText: tpl.ctaText,
    ctaUrl: tpl.ctaUrl,
    signoff: tpl.signoff,
  });

  return sendAndRelabel({
    to: prospectEmail,
    subject: tpl.subject,
    text,
    html,
  });
}

function renderWelcomeHtml({ preview, greeting, paragraphs, ctaText, ctaUrl, signoff }) {
  const paras = paragraphs
    .map((p) => `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6;">${escapeHtml(p)}</p>`)
    .join('');
  const cta = ctaUrl && ctaText
    ? `<p style="margin: 24px 0 0;"><a href="${escapeHtml(ctaUrl)}" style="display: inline-block; padding: 10px 20px; background: #E8654A; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">${escapeHtml(ctaText)}</a></p>`
    : '';
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
      <p style="margin: 24px 0 4px; font-size: 15px;">${escapeHtml(signoff)}</p>
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
