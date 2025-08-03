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
      content: `You are DSANexus, an expert instructor. Your primary goal is extreme readability using standard markdown. You MUST maintain the context of the conversation. For broad questions, use analogies first. For specific questions, be direct. For unrelated questions, be terse and redirect to a DSA topic. Use markdown for all formatting (### for headers, * for lists, ** for bold). BE CONCISE.`
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