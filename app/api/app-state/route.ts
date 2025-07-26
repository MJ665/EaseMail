import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use efficient count queries
    const contactsCount = await prisma.contact.count({ where: { userId: user.id } });
    const templatesCount = await prisma.template.count({ where: { userId: user.id } });

    // Return a simple state object
    return NextResponse.json({
      hasContacts: contactsCount > 0,
      hasTemplates: templatesCount > 0,
    });
    
  } catch (error) {
    console.error('Failed to fetch app state:', error);
    return NextResponse.json({ error: 'Failed to fetch app state' }, { status: 500 });
  }
}