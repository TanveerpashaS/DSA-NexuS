// Using a smaller, guaranteed-to-be-available model for testing
const API_URL = "https://api-inference.huggingface.co/models/distilgpt2";

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

    // We only need the last user message for this simple model test
    const lastUserMessage = conversationHistory[conversationHistory.length - 1].parts[0].text;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            inputs: lastUserMessage, // Send only the last message as input
            parameters: {
                max_new_tokens: 100,
                temperature: 0.7,
                return_full_text: false
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