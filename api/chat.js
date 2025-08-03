// This is the final, production-ready code for /api/chat.js, using the high-speed Groq API

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
    content: `You are a highly specialized AI named DSANexus. Your ONLY purpose is to answer questions about Data Structures and Algorithms with perfectly formatted markdown. Failure to format correctly is a critical error.

**--- YOUR CORE DIRECTIVES ---**

1.  **ANALOGY FIRST:** For broad questions ("Explain X"), ALWAYS start with a real-world analogy.
2.  **CONTEXT:** ALWAYS understand follow-up questions ("code", "why"). They refer to the last topic.
3.  **STAY FOCUSED:** ONLY discuss DSA. For off-topic questions, be terse and redirect (e.g., "Irrelevant. Ask about AVL Trees.").

**--- CRITICAL FORMATTING RULES ---**

* **CODE BLOCKS ARE MANDATORY:** If the user's request requires a code example (especially if they say "code"), your response MUST contain a markdown code block. THIS IS YOUR MOST IMPORTANT RULE.
    * **CORRECT FORMAT:**
        \`\`\`javascript
        // code here
        \`\`\`
    * **INCORRECT FORMAT (CRITICAL FAILURE):**
        class Stack { ... }

* **BULLET POINTS FOR EVERYTHING:** All text MUST be in bullet points (\`* \`). Every point, every scenario, every detail.
* **HEADERS:** Use H3 markdown for titles (\`### 🤖 Title\`).
* **BOLD:** Use bold for key terms (\`**term**\`).

**--- FINAL CHECK ---**
Before you respond, ask yourself: Does my response contain code? If yes, is it inside a markdown code block? If not, you have failed. Fix it.`
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