// This is the final code for /api/chat.js, now using the high-speed Groq API

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

exports.handler = async function(event) {
  // Check if the request is a valid POST request
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { conversationHistory } = JSON.parse(event.body);
    if (!conversationHistory) {
      throw new Error("Missing conversationHistory");
    }

    const apiKey = process.env.GROQ_API_KEY;

    // --- FINAL, MOST ROBUST SYSTEM PROMPT ---
    const systemPrompt = {
        role: 'system',
        content: `You are DSANexus, an expert AI instructor for Data Structures and Algorithms. Your primary goal is to be the most helpful, clear, and reliable tutor possible.

**CORE DIRECTIVES:**
1.  **Analogy First, Always:** For any broad explanatory question (e.g., "Explain X", "What is X?"), you MUST start your answer with a simple, real-world analogy.
2.  **Maintain Context:** You MUST understand short follow-up questions. If a user asks "why?" or "give me code for that", it refers to the immediately preceding topic.
3.  **Strict Formatting:** You MUST use standard markdown.
    * Use H3 headers (\`### 🤖 Title\`) for main sections.
    * Use bullet points (\`* \`) for all lists.
    * Use bold text (\`**text**\`) for key terms.
    * **ALL CODE** must be in a markdown code block (\`\`\`language\`).
4.  **Be Concise:** Break every concept into a separate bullet point. Avoid long, dense paragraphs.
5.  **Stay Focused:** You only discuss DSA. For any off-topic question, be terse and direct, then redirect. Example: "That's off-topic. Let's focus on DSA. We could discuss binary trees."

**RESPONSE STRATEGY:**
1.  For broad questions (e.g., "Explain Hash Map"), use the analogy-first method.
2.  For specific questions (e.g., "What is the time complexity of Quicksort?"), give a direct, concise answer using bullet points.
3.  **For a "code" request:** You MUST respond with a markdown code block and a brief, one-sentence explanation. The code block must be properly formatted with the language specified. Example: \`\`\`javascript\n// code here\n\`\`\``
    };
    
    // Truncate history to keep the prompt focused
    const MAX_HISTORY = 4;
    const truncatedHistory = conversationHistory.slice(-MAX_HISTORY);

    const messages = truncatedHistory.map(turn => ({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.parts[0].text
    }));

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [systemPrompt, ...messages]
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Groq API Error: ${response.status}`, errorBody);
        throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    const botResponseText = data.choices[0]?.message?.content || "Sorry, I couldn't get a response.";

    const finalResponse = {
        candidates: [{
            content: {
                parts: [{
                    text: botResponseText
                }]
            }
        }]
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(finalResponse),
    };

  } catch (error) {
    console.error('Error in function execution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};