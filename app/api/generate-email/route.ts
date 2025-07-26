// in app/api/generate-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createEmailGenerationPrompt } from '@/lib/gemini-prompt'; // This function is now updated

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY_ANALYZER!);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contact, template, user } = await req.json();

  if (!contact || !template || !user) {
    return NextResponse.json({ error: 'Missing contact, template, or user data in the request.' }, { status: 400 });
  }

  // NEW: createEmailGenerationPrompt now returns a JSON string with the prompt and the signature.
  const { prompt, fixedSignature } = JSON.parse(createEmailGenerationPrompt(contact, template, user));

  try {
    // UPDATED: The model is changed to gemini-1.5-flash.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // The prompt variable is now used here.
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response to ensure it's valid JSON.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Gemini did not return a valid JSON object.");
    }
    text = jsonMatch[0];

    const generatedEmail = JSON.parse(text);

    // NEW: Re-attach the fixed signature to the AI-generated body to ensure it's not altered.
    if (fixedSignature) {
      generatedEmail.body += `<br>---<br>${fixedSignature}`;
    }

    return NextResponse.json(generatedEmail);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: 'Failed to generate email content from AI.', details: (error as Error).message }, { status: 500 });
  }
}