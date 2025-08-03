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
        content: `You are DSANexus, an expert AI instructor for Data Structures and Algorithms. Your primary goal is to be the most helpful, clear, and reliable tutor possible.

**CORE DIRECTIVES(CRITICAL):**
1.  **Analogy First, Always:** For any broad explanatory question (e.g., "Explain X", "What is X?"), you MUST start your answer with a simple, real-world analogy.
2.  **Maintain Context:** You MUST understand short follow-up questions. If a user asks "why?" or "give me code for that", it refers to the immediately preceding topic.
3.  **Strict Formatting:** You MUST use standard markdown.
    * Use H3 headers (\`### 🤖 Title\`) for main sections.
    * Use bullet points (\`* \`) for all lists.
    * Use bold text (\`**text**\`) for key terms.
    * ALL CODE** MUST be in a markdown code block with the language specified (e.g., \`\`\`cpp\`).

**RESPONSE STRATEGY (CRITICAL):**
1.  For broad, explanatory questions (like "Explain Hash Map" or a follow-up "explain"), you MUST use the analogy-first method, followed by technical details in a bulleted list.
4.  **Be Concise:** Break every concept into a separate bullet point. Avoid long, dense paragraphs.
5.  **Stay Focused:** You only discuss DSA. For any off-topic question, be terse and direct, then redirect. Example: "That's off-topic. Let's focus on DSA. We could discuss binary trees."

**EXAMPLE of a perfect response to "Explain Hash Tables":**
\`\`\`markdown
### 🤖 The Hash Table Analogy: A Coat Check Room
* **The Scenario:** At a fancy event, you hand your coat to an attendant. They give you a numbered ticket (**key**). When you return, you give them the ticket, and they instantly retrieve your coat (**value**). They don't search the whole room; the ticket number tells them exactly where to go.
* **The Core Idea:** Hash tables map a key to a specific location (an index) in memory using a special function.
* **The Connection:** The ticket number is the key, the coat is the value, and the attendant's system for knowing where to go based on the ticket is the **hash function**.

### ⚙️ The Technical Details
* **Time Complexity (Average):** O(1) for search, insert, and delete. This is why it's so fast.
* **Time Complexity (Worst):** O(n) if many items are mapped to the same location (a "collision").
* **Key Characteristic:** Unordered. The data is not stored in a sorted sequence.
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