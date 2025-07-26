interface Contact {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
}

interface Template {
  subject: string;
  body: string;
}

interface User {
  name?: string | null;
  email?: string | null;
}

export function createEmailGenerationPrompt(contact: Contact, template: Template, user: User): string {
  
  const personalizedSubject = template.subject
    .replace(/{Company Name}/g, contact.companyName || 'your company');

  // New logic: Split the body into the main part and the fixed signature
  let mainBody = template.body;
  let fixedSignature = '';
  const signatureDelimiter = '---FIXED SIGNATURE---';

  if (template.body.includes(signatureDelimiter)) {
    const parts = template.body.split(signatureDelimiter);
    mainBody = parts[0];
    fixedSignature = parts[1];
  }

  // Personalize only the main body part
  const personalizedMainBody = mainBody
    .replace(/{Full Name}/g, contact.fullName || 'Hiring Team')
    .replace(/{First Name}/g, contact.firstName || 'there')
    .replace(/{Last Name}/g, contact.lastName || '')
    .replace(/{Company Name}/g, contact.companyName || 'your company');

  const prompt = `
    **ROLE & GOAL:**
    You are an expert email writer acting AS THE APPLICANT. Your goal is to polish a draft email for a job application. The applicant's name is ${user.name || user.email}. You must make them sound professional, capable, and concise. Quality and clarity are more important than length.

    **CONTEXT:**
    - **WRITING AS (The Sender):** ${user.name || user.email}
    - **RECIPIENT:** ${contact.fullName || 'Hiring Manager'} at ${contact.companyName || 'the company'}.
    - **INTENT:** Job Application / Internship Interest.

    **USER'S DRAFT BODY (This is the only part you should edit):**
    ---
    ${personalizedMainBody}
    ---

    **YOUR TASKS & CONSTRAINTS:**
    1.  **REWRITE AS THE APPLICANT:** Use "I," "my," etc., from the perspective of ${user.name}.
    2.  **IMPROVE THE DRAFT:** Refine the grammar, tone, and flow of the user's draft body provided above. Do not add new information or skills. Make it clear and impactful.
    3.  **CRITICAL - PRESERVE IMAGE TAG:** If you see the exact tag "!!!IMAGE HERE" in the user's draft, you MUST include that exact tag in your generated body in the same logical position. Do not replace it or describe it.
    4.  **DO NOT TOUCH THE SIGNATURE:** You will not be given the signature. Your task is only to generate the main email body.

    **REQUIRED OUTPUT FORMAT:**
    You MUST output a single, valid JSON object with two keys: "subject" and "body". The "body" should be the polished main email body as an HTML string (using <p> and <br> tags).

    **EXAMPLE OF PERFECT "body" OUTPUT (if the tag was present):**
    "<p>Dear ${contact.firstName || 'Hiring Team'},</p><p>I am writing to express my strong interest in the opportunities at ${contact.companyName}.</p><p>!!!IMAGE HERE</p><p>My skills are an excellent match for your requirements.</p>"
  `;
  
  // Return the prompt AND the fixed signature separately
  return JSON.stringify({ prompt, fixedSignature });
}