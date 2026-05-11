import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function formatItalianDate(date) {
  const [year, month, day] = String(date || '').split('-').map(Number);
  if (!year || !month || !day) return String(date || '');

  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function buildEmail({ courseName, instructorName, date, time, durationMinutes }) {
  const formattedDate = formatItalianDate(date);
  const safeCourse = escapeHtml(courseName);
  const safeInstructor = escapeHtml(instructorName || 'Team MAV GYM');
  const safeDate = escapeHtml(formattedDate);
  const safeTime = escapeHtml(time);
  const safeDuration = Number.isFinite(durationMinutes) ? escapeHtml(durationMinutes) : null;

  const durationText = safeDuration ? `Durata: ${durationMinutes} minuti` : null;
  const text = [
    'Ciao,',
    '',
    'la tua prenotazione a MAV GYM e confermata.',
    `Corso: ${courseName}`,
    `Data: ${formattedDate}`,
    `Orario: ${time}`,
    `Istruttore: ${instructorName || 'Team MAV GYM'}`,
    durationText,
    '',
    'Ti aspettiamo in palestra.',
    '',
    'MAV GYM',
  ].filter(Boolean).join('\n');

  const durationRow = safeDuration
    ? `<p style="font-size:15px;line-height:1.6;margin:0 0 10px;"><strong>Durata:</strong> ${safeDuration} minuti</p>`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf8f4;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f4;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #eee3d8;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:30px 28px;background:linear-gradient(135deg,#e63946,#f36a73);color:#fff;">
                <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:800;">MAV GYM</div>
                <h1 style="margin:12px 0 0;font-size:30px;line-height:1.08;">Prenotazione confermata</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="font-size:17px;line-height:1.6;margin:0 0 18px;">La tua lezione e stata prenotata correttamente.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #f0e5da;border-radius:14px;background:#fff8f6;margin:20px 0;">
                  <tr>
                    <td style="padding:18px;">
                      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7c2d33;font-weight:800;">Corso</div>
                      <div style="font-size:24px;font-weight:900;margin-top:6px;">${safeCourse}</div>
                      <div style="font-size:14px;color:#64748b;margin-top:4px;">con ${safeInstructor}</div>
                    </td>
                  </tr>
                </table>
                <p style="font-size:15px;line-height:1.6;margin:0 0 10px;"><strong>Data:</strong> ${safeDate}</p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 10px;"><strong>Orario:</strong> ${safeTime}</p>
                ${durationRow}
                <p style="font-size:15px;line-height:1.6;margin:18px 0 0;">Ti aspettiamo in palestra.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:#0f172a;color:#f8fafc;font-size:13px;line-height:1.5;">
                MAV GYM - Via Tortona 27, Milano
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html, formattedDate };
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Payload JSON non valido' }, 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const courseName = String(body.courseName || '').trim();
  const instructorName = String(body.instructorName || '').trim();
  const date = String(body.date || '').trim();
  const time = String(body.time || '').trim();
  const durationMinutes = Number(body.durationMinutes);

  if (!isValidEmail(email) || !courseName || !date || !time) {
    return json({ error: 'Dati prenotazione non validi' }, 400);
  }

  try {
    const smtpUser = getRequiredEnv('SMTP_USER');
    const smtpPass = getRequiredEnv('SMTP_PASS');
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
    const from = process.env.EMAIL_FROM || `MAV GYM <${smtpUser}>`;
    const replyTo = process.env.EMAIL_REPLY_TO || smtpUser;
    const bcc = process.env.EMAIL_BCC || undefined;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const { text, html, formattedDate } = buildEmail({
      courseName,
      instructorName,
      date,
      time,
      durationMinutes,
    });

    const result = await transporter.sendMail({
      from,
      to: email,
      replyTo,
      bcc,
      subject: `Prenotazione MAV GYM - ${courseName} ${formattedDate} ${time}`,
      text,
      html,
    });

    return json({ ok: true, messageId: result.messageId });
  } catch (error) {
    console.error('Errore invio booking email', error);
    return json({ error: 'Email prenotazione non inviata' }, 500);
  }
}
