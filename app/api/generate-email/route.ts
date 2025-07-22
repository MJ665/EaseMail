import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY_ANALYZER!);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contact, template, user } = await req.json();

  if (!contact || !template || !user) {
    return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
  }

  // Replace placeholders in the template
  let promptBody = template.body
    .replace('{Full Name}', contact.fullName || 'there')
    .replace('{First Name}', contact.firstName || 'there')
    .replace('{Last Name}', contact.lastName || '')
    .replace('{Company Name}', contact.companyName || 'your company');
    
  let promptSubject = template.subject
    .replace('{Company Name}', contact.companyName || 'your company');


  const prompt = `
    You are an AI assistant helping a job seeker named ${user.name || user.email}.
    Your task is to refine the following email draft to make it more professional, engaging, and personalized for the recipient.
    Do not change the core meaning or the key details provided by the user.
    The recipient is ${contact.fullName} at ${contact.companyName}.
    
    Here is the user's template for the subject and body:
    
    --- TEMPLATE SUBJECT ---
    ${promptSubject}
    
    --- TEMPLATE BODY ---
    ${promptBody}
    
    --- END OF TEMPLATE ---
    
    Analyze the template and recipient information.
    Generate a final, polished email.
    
    OUTPUT FORMAT MUST BE A VALID JSON OBJECT with two keys: "subject" and "body".
    
    Example output:
    {
        "subject": "Polished Email Subject Here",
        "body": "The full, polished HTML-compatible email body here. Use <p> and <br> tags for formatting."
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response to ensure it's valid JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse the JSON response from Gemini
    const generatedEmail = JSON.parse(text);

    return NextResponse.json(generatedEmail);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: 'Failed to generate email content.' }, { status: 500 });
  }
}