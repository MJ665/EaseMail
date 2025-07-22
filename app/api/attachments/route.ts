import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Disable the default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), '/public/uploads');

// Ensure upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const data: { fields: any; files: any } = await new Promise((resolve, reject) => {
      const form = new IncomingForm({
        uploadDir,
        keepExtensions: true,
        filename: (name, ext, part) => {
          return `${user.id}-${Date.now()}-${part.originalFilename}`;
        }
      });
      form.parse(req as any, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });
    
    const file = data.files.file[0];
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const newAttachment = await prisma.attachment.create({
      data: {
        userId: user.id,
        fileName: file.originalFilename,
        fileType: file.mimetype,
        filePath: `/uploads/${file.newFilename}`,
      },
    });

    return NextResponse.json(newAttachment, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
    const attachments = await prisma.attachment.findMany({ where: { userId: user.id } });
    return NextResponse.json(attachments);
  }