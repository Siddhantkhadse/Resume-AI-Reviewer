import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // 1. Parse the PDF into Raw Text
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    // 2. Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 3. Construct the Professional Recruiter Prompt
    const prompt = `You are an expert ATS (Applicant Tracking System) software and a senior technical recruiter. 
    Review the following resume. 
    
    Please provide your output in the following structure:
    1. ATS SCORE: Give a score out of 100 based on keyword optimization and formatting.
    2. MISSING SKILLS: List 3-4 industry-standard skills that seem to be missing.
    3. ACTIONABLE REWRITES: Take 2 weak bullet points from the text and rewrite them to be quantifiable and impactful (using the "Accomplished X as measured by Y, by doing Z" framework).
    
    Resume Text:
    ${resumeText}`;

    // 4. Connect to Gemini API and request Stream
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContentStream(prompt);

    // 5. Pipe the stream directly back to the React frontend
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // Format as SSE data payload
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // 6. Close the connection
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI Stream Error:', error);
    res.write(`data: ${JSON.stringify({ error: '\n\nAn error occurred while analyzing the resume. Please check your API key.' })}\n\n`);
    res.end();
  }
};

export const rewriteResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // 1. Parse the PDF into Raw Text
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    // 2. Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 3. Construct the ATS Resume Rewrite Prompt
    const prompt = `You are an elite Executive Resume Writer and ATS Optimization Expert. 
Your task is to completely rewrite the provided resume into a strict, highly ATS-friendly format. 

CRITICAL RULES FOR ATS COMPLIANCE:
1. STRICT FORMATTING: Do NOT use markdown tables, columns, or custom HTML. Use ONLY standard markdown headers (#, ##, ###), bold text (**), and standard bullet points (*). This ensures 100% parser compatibility with Workday, Taleo, and Greenhouse.
2. KEYWORD DENSITY: Replace passive/generic verbs ("responsible for", "assisted", "worked on") with hard-hitting action verbs ("Architected", "Spearheaded", "Engineered", "Optimized"). Inject hard, searchable industry keywords natively into the bullet points based on the candidate's field.
3. IMPACT METRICS: Eradicate task-based descriptions. Transform every bullet point into an outcome-oriented achievement using the format: "Accomplished [X] as measured by [Y], by doing [Z]". Quantify results with metrics, percentages, and dollar amounts.
4. STRUCTURE: Use exactly this standard chronological format:
   # [Full Name]
   **Contact Info** | **LinkedIn/Portfolio**
   
   ## Professional Summary
   (3-4 high-impact lines highlighting core value proposition)
   
   ## Core Competencies & Technical Skills
   (Comma-separated list of hard skills, tools, and methodologies)
   
   ## Professional Experience
   ### [Job Title] | [Company Name] | [Dates]
   * [Quantified bullet point]
   * [Quantified bullet point]
   
   ## Education
   ### [Degree] | [University] | [Year]

Output ONLY the final rewritten markdown resume. Do not include any conversational filler, preambles, or explanations.

Original Resume Text:
${resumeText}`;

    // 4. Connect to Gemini API and request Stream
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContentStream(prompt);

    // 5. Pipe the stream directly back to the React frontend
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // Format as SSE data payload
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // 6. Close the connection
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI Stream Error:', error);
    res.write(`data: ${JSON.stringify({ error: '\n\nAn error occurred while rewriting the resume. Please check your API key.' })}\n\n`);
    res.end();
  }
};

