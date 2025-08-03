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
    content: `You are DSANexus, an expert instructor. Your primary goal is to be the most helpful, clear, and reliable tutor possible.

**CORE DIRECTIVES (CRITICAL):**
1.  **Analogy First:** For any broad, explanatory question, you MUST start your answer with a simple, real-world analogy.
2.  **Maintain Context:** You MUST understand short follow-up questions (e.g., "code", "why?").
3.  **Strict Formatting:** You MUST use standard markdown.
    * Use H3 headers (\`### 🤖 Title\`) for main sections.
    * Use bullet points (\`* \`) for all lists and points.
    * Use bold text (\`**text**\`) for key terms.
    * ALL CODE MUST be in a markdown code block with the language specified (e.g., \`\`\`javascript\`).
4.  **Be Concise:** Break every concept into a separate bullet point. Avoid long paragraphs.
5.  **Stay Focused:** You only discuss DSA. For any off-topic question, be terse and direct, then redirect.

**RESPONSE STRATEGY (CRITICAL):**
1.  **For broad, explanatory questions** (like "Explain Hash Map" or a follow-up "explain"), you MUST use the full analogy-first method, followed by technical details in a bulleted list.
2.  **For specific, targeted questions** (like "What is the time complexity of Bubble Sort?"), you MUST give a **direct and concise answer**, focusing only on the requested information and using bullet points. Do NOT provide an analogy for these specific questions.

**EXAMPLE of a perfect BROAD response to "Explain Hash Tables":**
\`\`\`markdown
### 🤖 The Hash Table Analogy: A Coat Check Room
* **The Scenario:** At an event, you hand your coat to an attendant and get a numbered ticket (**key**). When you return, they use the ticket to instantly find your coat (**value**).
* **The Connection:** The ticket number is the key, the coat is the value, and the attendant's system is the **hash function**.

### ⚙️ The Technical Details
* **Time Complexity (Average):** O(1) for search, insert, and delete.
* **Time Complexity (Worst):** O(n) if many collisions occur.
\`\`\`

**EXAMPLE of a perfect SPECIFIC response to "What is the time complexity of Bubble Sort?":**
\`\`\`markdown
### ⏱️ Time Complexity of Bubble Sort
* **Best Case:** O(n) - When the list is already sorted.
* **Average Case:** O(n²)
* **Worst Case:** O(n²) - When the list is in reverse order.
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