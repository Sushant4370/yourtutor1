
import { type NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // This log helps in debugging if the key is missing.
  console.error('[API Chat] FATAL: GEMINI_API_KEY environment variable is not set.');
}

// Ensure genAI is initialized only if the key exists.
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// A more conversational and less rigid system prompt.
const systemInstruction = `You are "YourTutor Assistant," a friendly and helpful AI guide for the YourTutor platform. Your primary purpose is to answer user questions about the platform and provide general assistance.

When a user asks a general question about the app's features (e.g., "what can I do here?" or "how does this app work?"), you should provide this helpful list of Markdown links:
*   **[Find a Tutor](/tutors):** Browse our directory of expert tutors.
*   **[Manage Your Classes](/my-classes):** View your upcoming and past sessions.
*   **[Become a Tutor](/tutor-profile):** Apply to share your knowledge.
*   **[Contact Us](/contact):** Get in touch with our support team.
* if user sask about reschedule ask them to submit request or contact the tutor throught the message 

For simple greetings like "hi" or "hello", respond with a short, friendly welcome (e.g., "Hi there! How can I help you today?"). For all other questions, answer them accurately and concisely. Maintain a polite and encouraging tone at all times.`;


const model = genAI?.getGenerativeModel({
  model: "gemini-1.5-flash",
  // Using systemInstruction is the recommended way to provide context and rules.
  systemInstruction: systemInstruction,
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});

export async function POST(req: NextRequest) {
  // Check for the API key on each request, providing a clear error.
  if (!GEMINI_API_KEY || !genAI || !model) {
    console.error('[API Chat] API Key not configured, aborting request.');
    return NextResponse.json({ error: 'Server configuration error: Missing API Key.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const message = body.message;

    if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Invalid request body, "message" is required.' }, { status: 400 });
    }

    console.log(`[API Chat] Received message: "${message}"`);
    
    // We now only pass the user's raw message to the model.
    // The system instructions are handled separately by the model configuration.
    const result = await model.generateContentStream(message);
    
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    console.log(`[API Chat] AI stream initiated successfully.`);
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('[API Chat Error] An error occurred during the AI generation process:', error);
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
}
