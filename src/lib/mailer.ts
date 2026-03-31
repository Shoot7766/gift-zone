import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: port === 465,
  };
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const cfg = getSmtpConfig();
  if (!cfg) {
    console.warn("SMTP is not configured. Skipping email send.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });

  await transporter.sendMail({
    from: cfg.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  return true;
}

