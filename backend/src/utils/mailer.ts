import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.host) return null; // dev mode: no SMTP configured
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  const client = getTransporter();

  if (!client) {
    // No SMTP configured: log to console so the flow is still testable in dev.
    console.log(`[mailer] (dev mode, no SMTP configured) To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }

  await client.sendMail({ from: env.smtp.from, to, subject, html });
}
