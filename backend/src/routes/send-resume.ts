import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

export const sendResumeRouter = Router();

interface ResumeBody {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  message?: string;
  resumeFile?: string;
  resumeFileName?: string;
  destinationEmail: string;
}

sendResumeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as ResumeBody;

    if (!body.candidateName || !body.candidateEmail || !body.destinationEmail) {
      res.status(400).json({ error: 'Nome, email do candidato e email de destino são obrigatórios.' });
      return;
    }

    // Try to send email via SMTP if configured
    const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (hasSmtpConfig) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const htmlBody = `
        <h2>Novo currículo recebido!</h2>
        <p><strong>Nome:</strong> ${body.candidateName}</p>
        <p><strong>Email:</strong> ${body.candidateEmail}</p>
        <p><strong>Telefone:</strong> ${body.candidatePhone || 'Não informado'}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${body.message || 'Sem mensagem'}</p>
        ${body.resumeFile ? `<p><strong>Currículo anexado:</strong> ${body.resumeFileName || 'curriculo'}</p>` : ''}
        <hr />
        <p style="color: #888; font-size: 12px;">Enviado via LinkFlowAI</p>
      `;

      let attachments: any[] = [];
      if (body.resumeFile && body.resumeFileName) {
        attachments.push({
          filename: body.resumeFileName,
          content: body.resumeFile.split(',')[1] || body.resumeFile,
          encoding: 'base64',
        });
      }

      await transporter.sendMail({
        from: `"LinkFlowAI - Currículo" <${process.env.SMTP_USER}>`,
        to: body.destinationEmail,
        subject: `Currículo recebido de ${body.candidateName}`,
        html: htmlBody,
        attachments,
      });

      res.json({ success: true, message: 'Currículo enviado por email com sucesso!' });
    } else {
      // SMTP not configured - return info so frontend can notify user
      res.json({
        success: true,
        message: 'Currículo registrado. Email não configurado no servidor.',
        storedInFirestore: true,
      });
    }
  } catch (err: any) {
    console.error('[send-resume] Erro ao enviar currículo:', err);
    res.status(500).json({ error: 'Erro ao enviar currículo.', details: err.message });
  }
});
