// This is the final, production-ready code for /api/chat.js

exports.handler = async function(event) {
  // 1. Check if the request is valid
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { conversationHistory } = JSON.parse(event.body);
    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      throw new Error("Invalid or missing conversationHistory");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // --- Smart History Management ---
    // Keep the last 6 messages to maintain context without overwhelming the API.
    const MAX_HISTORY_LENGTH = 6;
    const truncatedHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);

    const systemInstruction = {
      parts: [{
        text: `You are DSANexus, an expert instructor. Your primary goal is extreme readability and reliability.

**CONTEXT RULE:** You MUST maintain the context of the conversation. If a user's prompt is a short follow-up (e.g., "code", "why?"), you must assume it refers to the immediately preceding topic.

**RESPONSE FORMATTING RULES:**
- Start main topics with a markdown H3 header (e.g., \`### 🤖 The Analogy\`).
- Use markdown bullet points (* item) for all lists. Use bold text (**text**) for key terms.
- **BE CONCISE.** Never use more than 2-3 sentences for any single bullet point.

**RESPONSE STRATEGY:**
1.  For broad questions (e.g., "Explain Hash Map"), use the analogy-first method.
2.  For specific questions (e.g., "What is the time complexity of Quicksort?"), give a direct, concise answer using bullet points.

You are **strictly focused** on DSA. For unrelated questions, be terse and direct, then redirect to a DSA topic. Example: 'That's off-topic. Let's focus on DSA. We could discuss binary trees.'`
      }]
    };

    // --- Safety Settings Control ---
    // This tells the API to be less strict about the "rude" personality.
    // It will block only high-probability harmful content.
    const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ];

    const googleApiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: truncatedHistory,
        systemInstruction,
        safetySettings, // Add safety settings to the request
      }),
    });

    if (!googleApiResponse.ok) {
        const errorBody = await googleApiResponse.text();
        console.error(`Google API Error: ${googleApiResponse.status}`, errorBody);
        throw new Error(`Google API responded with status: ${googleApiResponse.status}`);
    }

    const data = await googleApiResponse.json();

    // Check if the response was blocked by safety filters
    if (!data.candidates || data.candidates.length === 0) {
      const blockReason = data.promptFeedback?.blockReason || "Unknown";
      const safetyRatings = JSON.stringify(data.promptFeedback?.safetyRatings || "N/A");
      console.error(`Response blocked by safety filter. Reason: ${blockReason}`);
      throw new Error(`Response was blocked by the safety filter. Reason: ${blockReason}.`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Error in function execution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};