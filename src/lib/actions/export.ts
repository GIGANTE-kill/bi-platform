"use server";

import nodemailer from 'nodemailer';

export async function sendReportEmail({
  to,
  subject,
  body,
  attachmentBase64,
  fileName
}: {
  to: string,
  subject: string,
  body: string,
  attachmentBase64: string, // Pode ser base64 puro ou com o prefixo 'data:...'
  fileName: string
}) {
  console.log(`Iniciando envio de e-mail real para ${to}...`);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_SENDER_NAME || 'BI Platform'}" <${process.env.SMTP_SENDER}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      attachments: [
        {
          filename: fileName,
          content: attachmentBase64.includes("base64,")
            ? attachmentBase64.split("base64,")[1]
            : attachmentBase64,
          encoding: 'base64'
        }
      ]
    });

    console.log("E-mail enviado com sucesso: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Erro ao enviar e-mail:", error);
    return { success: false, error: error.message || "Falha desconhecida no envio" };
  }
}
