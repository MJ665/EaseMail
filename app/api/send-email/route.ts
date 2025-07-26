import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Destructure the new payload
  const { smtpConfig, emailData } = await req.json();

  if (!smtpConfig || !smtpConfig.email || !smtpConfig.password) {
    return NextResponse.json({ error: 'SMTP configuration is missing.' }, { status: 400 });
  }

  if (!emailData || !emailData.to || !emailData.subject || !emailData.body) {
    return NextResponse.json({ error: 'Email data is missing.' }, { status: 400 });
  }

  // Use the user-provided credentials to create the transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // We can hardcode this for Google
    port: 587,
    secure: false, 
    auth: {
      user: smtpConfig.email,
      pass: smtpConfig.password,
    },
  });

  try {
    let finalBody = emailData.body;
    const mailAttachments = emailData.attachments.map((att: { filePath: string; fileName: string }) => ({
        filename: att.fileName,
        path: path.join(process.cwd(), 'public', att.filePath),
    }));

// Handle the inline image replacement
if (emailData.inlineAttachment) {
    const inlineImage = emailData.inlineAttachment;
    const cid = `image-${Date.now()}`;
    // THE FIX IS HERE: Added style attribute for responsive image
    finalBody = finalBody.replace(
        '!!!IMAGE HERE', 
        `<img src="cid:${cid}" style="max-width: 500px; width: 100%; height: auto; border-radius: 8px; margin-top: 16px; margin-bottom: 16px;" alt="${inlineImage.fileName}" />`
    );
    mailAttachments.push({
        filename: inlineImage.fileName,
        path: path.join(process.cwd(), 'public', inlineImage.filePath),
        cid: cid
    });
}

    await transporter.sendMail({
      from: `"${session.user?.name || session.user?.email}" <${smtpConfig.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: finalBody,
      attachments: mailAttachments,
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error("Nodemailer error:", error);
    // Provide a more helpful error message to the user
    return NextResponse.json({ error: 'Failed to send email. Please check your Host Email and Google App Password.', details: (error as Error).message }, { status: 500 });
  }
}