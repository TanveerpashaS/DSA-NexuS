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

    // Get the secret Groq API key from environment variables
    const apiKey = process.env.GROQ_API_KEY;

    // The system prompt is now the first message in the array
 const systemPrompt = {
    role: 'system',
    content: `You are DSANexus, an expert instructor. Your primary goal is **extreme readability** using standard markdown.

**CONTEXT RULE:** You MUST maintain the context of the conversation. If a user's prompt is a short follow-up (e.g., "code", "why?"), assume it refers to the immediately preceding topic.

**RESPONSE FORMATTING RULES:**
- Start main topics with a markdown H3 header (e.g., \`### 🤖 The Analogy\`).
- Use markdown bold (\`**text**\`) for all key terms and titles.
- **BE CONCISE.** Break every concept into a separate bullet point. Avoid long paragraphs.
- For all lists, you MUST use a markdown bullet point (\`* \`) at the beginning of each item.

**EXAMPLE of a perfect list:**
\`\`\`markdown
* **Time Complexity:** O(n²) on average.
* **Key Characteristic:** An in-place sorting algorithm.
* **Stability:** Bubble Sort is a stable sort.
\`\`\`

**RESPONSE STRATEGY:**
1.  For broad questions (e.g., "Explain Hash Map"), use the analogy-first method.
2.  For specific questions (e.g., "What is the time complexity of Quicksort?"), give a direct, concise answer using bullet points.

You are **strictly focused** on DSA. For unrelated questions, be terse and direct, then redirect to a DSA topic. Example: 'That's off-topic. Let's focus on DSA. We could discuss binary trees.'`
};
    
    // Convert our history to the format Groq/OpenAI expects
    const messages = conversationHistory.map(turn => ({
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
            model: "llama3-8b-8192", // A great, fast model available on Groq
            messages: [systemPrompt, ...messages] // Combine system prompt and history
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Groq API Error: ${response.status}`, errorBody);
        throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Adapt the response back to the format the frontend expects
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