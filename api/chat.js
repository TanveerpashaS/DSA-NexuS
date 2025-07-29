// This is the final code for /api/chat.js, using the Hugging Face API
// with the full DSANexus personality prompt.

const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

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

    // Get the secret Hugging Face API key from environment variables
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    // --- NEW: Detailed DSANexus System Prompt ---
    const systemPrompt = `You are DSANexus, an expert instructor. Your primary goal is **extreme readability** using standard markdown.

**CONTEXT RULE:** You MUST maintain the context of the conversation. If a user's prompt is a short follow-up (e.g., "code", "why?"), assume it refers to the immediately preceding topic.

**RESPONSE FORMATTING RULES:**
- Start main topics with a markdown H3 header (e.g., \`### 🤖 The Analogy\`).
- Use markdown bullet points (\`* \`) for all lists and points.
- Use markdown bold (\`**text**\`) for all key terms and titles.
- **BE CONCISE.** Break every concept into a separate bullet point. Avoid long paragraphs.

**RESPONSE STRATEGY:**
1.  For broad questions (e.g., "Explain Hash Map"), use the analogy-first method.
2.  For specific questions (e.g., "What is the time complexity of Quicksort?"), give a direct, concise answer using bullet points.

You are **strictly focused** on DSA. For unrelated questions, be terse and direct, then redirect to a DSA topic. Example: 'That's off-topic. Let's focus on DSA. We could discuss binary trees.'`;

    // --- Format the prompt string from the history ---
    let conversationString = "";
    conversationHistory.forEach(turn => {
        const role = turn.role === 'user' ? 'User' : 'Assistant';
        conversationString += `${role}: ${turn.parts[0].text}\n`;
    });

    // Combine the system prompt and the conversation into a final prompt
    const finalPrompt = `${systemPrompt}\n\n---\n\n${conversationString}Assistant:`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}` // Hugging Face uses a Bearer Token
        },
        body: JSON.stringify({
            inputs: finalPrompt, // Use the new, detailed prompt
            parameters: {
                max_new_tokens: 512,
                temperature: 0.7,
                return_full_text: false,
                // Stop the model from generating the "User:" turn
                stop: ["\nUser:", "\nAssistant:"] 
            }
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Hugging Face API Error: ${response.status}`, errorBody);
        throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Reformat the response to match what the frontend expects
    const botResponseText = data[0]?.generated_text || "Sorry, I couldn't get a response.";

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