// We are now using a different open-source model that does not require special access
const API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

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

    // Format the prompt for the new model
    let prompt = "You are a helpful DSA tutor. Your answers are concise and use markdown formatting.\n";
    conversationHistory.forEach(turn => {
        prompt += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.parts[0].text}\n`;
    });
    prompt += "Assistant:"; // Prompt the model to respond

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}` // Hugging Face uses a Bearer Token
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: 512, // Limit response length
                temperature: 0.7,
                return_full_text: false // Only get the generated part
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