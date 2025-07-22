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
  
  const { to, subject, body, attachments } = await req.json();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${session.user?.name || session.user?.email}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: body,
      attachments: attachments.map((att: { filePath: string, fileName: string }) => ({
          filename: att.fileName,
          path: path.join(process.cwd(), 'public', att.filePath),
      })),
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}