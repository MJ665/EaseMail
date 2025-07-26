import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions"

import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdirSync } from 'fs';

const prisma = new PrismaClient();
const uploadDir = path.join(process.cwd(), 'public/uploads');

// Ensure the upload directory exists synchronously on startup
try {
  mkdirSync(uploadDir, { recursive: true });
} catch (error) {
  console.error("Could not create upload directory:", error);
}

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
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Create a buffer from the file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique filename to prevent overwrites
    const uniqueFilename = `${user.id}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Write the file to the filesystem
    await writeFile(filePath, buffer);

    // Save the attachment record to the database
    const newAttachment = await prisma.attachment.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileType: file.type,
        // Store the public path for client-side access
        filePath: `/uploads/${uniqueFilename}`, 
      },
    });

    return NextResponse.json(newAttachment, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file.', details: (error as Error).message }, { status: 500 });
  }
}

// The GET function remains the same and is correct.
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