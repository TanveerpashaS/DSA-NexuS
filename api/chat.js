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

    // Get the secret Groq API key from environment variables
    const apiKey = process.env.GROQ_API_KEY;

    // --- FINAL, MOST ROBUST SYSTEM PROMPT ---
    const systemPrompt = {
        role: 'system',
        content: `You are DSANexus, an expert instructor. Your primary goal is to be the most helpful, clear, and reliable tutor possible using standard markdown.

**CORE DIRECTIVES:**
1.  **Analogy First, Always:** For any broad explanatory question (like "Explain X", "What is X?"), you MUST start your answer with an analogy section.
2.  **Maintain Context:** You MUST understand short follow-up questions. If a user asks "why?" or "give me code for that", it refers to the immediately preceding topic.
3.  **Stay Focused:** You only discuss DSA. For any off-topic question, be terse and direct, then redirect. Example: "That's off-topic. Let's focus on DSA. We could discuss binary trees."

**RESPONSE FORMATTING RULES (VERY STRICT):**
- **EVERYTHING MUST BE A BULLET POINT:** Every single piece of information, including scenarios, connections, and technical details, MUST start with a markdown bullet point (\`* \`).
- **STRUCTURE:** Use H3 headers for main titles (\`### 🤖 Title\`), and then use a bulleted list for all content under that title.
- **FORMAT:** Use bold text (\`**text**\`) for key terms and titles within a bullet point.
- **CONCISENESS:** Keep each bullet point short and to the point.

**EXAMPLE of a perfect response to "Explain Hash Tables":**
\`\`\`markdown
### 🤖 The Hash Table Analogy
* **The Scenario:** Imagine a coat check room where each hook has a number. The ticket you get (**key**) tells the attendant exactly which hook your coat (**value**) is on.
* **The Core Idea:** Hash tables map a key to a specific location in memory using a hash function, allowing for instant access.
* **The Connection:** The ticket number is the key, the coat is the value, and the attendant's system is the hash function.

### ⚙️ The Technical Details
* **Time Complexity (Average):** O(1) for search, insert, and delete.
* **Time Complexity (Worst):** O(n) if many collisions occur.
\`\`\``
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