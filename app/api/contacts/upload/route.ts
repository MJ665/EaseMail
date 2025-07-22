import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';

const prisma = new PrismaClient();

const toBoolean = (str: string | undefined): boolean | undefined => {
  if (str === undefined || str === null || str.trim() === '') return undefined;
  const lower = str.toLowerCase().trim();
  if (lower === 'yes' || lower === 'y' || lower === 'true') return true;
  if (lower === 'no' || lower === 'n' || lower === 'false') return false;
  return undefined;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const fileContent = await file.text();

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length) {
        return NextResponse.json({ error: 'Error parsing CSV file', details: parseResult.errors }, { status: 400 });
    }

    const contactsData = parseResult.data as any[];

    const contactsToCreate = contactsData.map(row => ({
        userId: user.id,
        fullName: row['Full Name'] || 'N/A',
        firstName: row['First Name'] || null,
        lastName: row['Last Name'] || null,
        designation: row['Designation / Job Title'] || null,
        companyName: row['Company Name'] || 'N/A',
        website: row['Website'] || null,
        linkedinUrl: row['LinkedIn Url'] || null,
        personalLinkedinProfile: row['Personal LinkedIn Profile'] || null,
        emailAddress1: row['Email Address 1'] || 'N/A',
        emailAddress2: row['Email Address 2'] || null,
        genericEmail: row['Generic Email (careers@...)'] || null,
        location: row['Location'] || null,
        country: row['Country'] || null,
        facebookUrl: row['Facebook Url'] || null,
        twitterUrl: row['Twitter URL'] || null,
        experience: row['Experience (if given)'] || null,
        sourceSheet: row['Source Sheet'] || null,
        additionalNotes: row['Additional Notes'] || null,
        emailVerified: toBoolean(row['Email Verified (Yes/No)']),
        emailDomain: row['Email Domain'] || null,
        accountType: row['Account Type'] || null,
        roleBasedEmail: toBoolean(row['Role-Based Email']),
        safeToSend: toBoolean(row['Safe to Send (Y/N)']),
        domain: row['Domain'] || null,
        niche: row['Niche'] || null,
        industry: row['Industry'] || null,
        recruitmentAgency: toBoolean(row['Recuritment Agency']),
        freeDomain: toBoolean(row['Free Domain']),
        diagnosis: row['Diagnosis'] || null,
        mxDomain: row['MX_Domain'] || null,
        emailVerificationResponse: row['Email Veirfication Response'],
        bounceType: row['Bounce Type'] || null,
      })).filter(contact => contact.emailAddress1 && contact.emailAddress1 !== 'N/A');

      if (contactsToCreate.length === 0) {
        return NextResponse.json({ message: 'No valid contacts found to import.' }, { status: 200 });
      }

    const result = await prisma.contact.createMany({
      data: contactsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({ message: `${result.count} contacts imported successfully.` }, { status: 201 });
  } catch (error) {
    console.error('Failed to import contacts:', error);
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 });
  }
}