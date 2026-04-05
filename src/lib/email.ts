import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendStudyReadyEmail({
  to,
  dentistName,
  patientName,
  patientDni,
  orderCode,
  procedures,
  branch
}: {
  to: string
  dentistName: string
  patientName: string
  patientDni: string
  orderCode: string
  procedures: string[]
  branch: string
}) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('[Email] SMTP no configurado, omitiendo notificación')
    return
  }

  const proceduresList = procedures.map(p => `<li style="margin-bottom:4px">${p}</li>`).join('')

  if (!to) return

  await transporter.sendMail({
    from: `"I-R Dental" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `✅ Estudio listo para entrega — ${patientName} (${orderCode})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
        <div style="background:#BA2C66;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-0.5px">I-R Dental</h1>
          <p style="color:#f9c6df;margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px">Notificación de Estudio Listo</p>
        </div>
        <div style="padding:28px">
          <p style="font-size:14px;color:#333;margin:0 0 16px">Dr/a. <strong>${dentistName}</strong>,</p>
          <p style="font-size:14px;color:#333;margin:0 0 20px">Le informamos que el siguiente estudio está <strong style="color:#BA2C66">listo para entrega</strong>:</p>

          <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:20px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">Paciente</span>
              <span style="font-size:13px;font-weight:700;color:#111">${patientName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">DNI</span>
              <span style="font-size:13px;font-weight:700;color:#111">${patientDni}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">Orden N°</span>
              <span style="font-size:13px;font-weight:700;color:#111;font-family:monospace">${orderCode}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700">Sede</span>
              <span style="font-size:13px;font-weight:700;color:#111">${branch}</span>
            </div>
          </div>

          <p style="font-size:12px;color:#555;font-weight:700;text-transform:uppercase;margin-bottom:8px">Estudios realizados:</p>
          <ul style="padding-left:20px;color:#333;font-size:13px;margin:0 0 20px">${proceduresList}</ul>

          <a href="https://irdental.com/portal-medico" style="display:inline-block;background:#BA2C66;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px">Ver en mi Portal</a>
        </div>
        <div style="background:#f8f8f8;padding:16px 28px;font-size:11px;color:#aaa;text-align:center">
          I-R Dental — 0810.333.4507 — info@irdental.com
        </div>
      </div>
    `
  })
}

export async function sendTicketReplyEmail({
  to,
  dentistName,
  subject,
  originalMessage,
  reply,
  repliedBy,
}: {
  to: string
  dentistName: string
  subject: string
  originalMessage: string
  reply: string
  repliedBy: string
}) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('[Email] SMTP no configurado, omitiendo notificación')
    return
  }

  if (!to) return

  await transporter.sendMail({
    from: `"I-R Dental" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `💬 Respondimos tu consulta — ${subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
        <div style="background:#BA2C66;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-0.5px">I-R Dental</h1>
          <p style="color:#f9c6df;margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px">Respuesta a tu consulta</p>
        </div>
        <div style="padding:28px">
          <p style="font-size:14px;color:#333;margin:0 0 16px">Dr/a. <strong>${dentistName}</strong>,</p>
          <p style="font-size:14px;color:#333;margin:0 0 20px">Respondimos tu consulta en el portal:</p>

          <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin-bottom:14px">
            <p style="font-size:10px;color:#aaa;text-transform:uppercase;font-weight:700;margin:0 0 4px">Tu consulta</p>
            <p style="font-size:13px;color:#555;margin:0;font-style:italic">"${originalMessage}"</p>
          </div>

          <div style="background:#fff0f6;border:1.5px solid #BA2C66;border-radius:8px;padding:14px 16px;margin-bottom:20px">
            <p style="font-size:10px;color:#BA2C66;text-transform:uppercase;font-weight:700;margin:0 0 4px">Respuesta de ${repliedBy}</p>
            <p style="font-size:14px;color:#222;margin:0;line-height:1.6">${reply}</p>
          </div>

          <a href="https://irdental.com/portal-medico" style="display:inline-block;background:#BA2C66;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px">Ver en mi Portal</a>
        </div>
        <div style="background:#f8f8f8;padding:16px 28px;font-size:11px;color:#aaa;text-align:center">
          I-R Dental — 0810.333.4507 — info@irdental.com
        </div>
      </div>
    `
  })
}
