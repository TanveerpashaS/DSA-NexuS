// File: /api/chat.js - CORRECTED FOR NETLIFY

exports.handler = async function(event) {
  // 1. Get the conversation history from the event body (Netlify format)
  const { conversationHistory } = JSON.parse(event.body);

  // 2. Get the secret API key from the server's environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // 3. Keep the same system instruction
const systemInstruction = {
    parts: [{
        text:  `You are DSANexus, an expert instructor with a unique talent for making complex Data Structures and Algorithms simple.

Your primary goal is **extreme readability**. All explanations must be broken down into scannable points.

**For your 'analogy-first' method, format it exactly like this example:**
 🤖 The [Concept Name] Analogy: The [Analogy Object]
* **The Scenario:** Briefly describe the real-life situation in one or two clear sentences.
* **The Core Idea:** Use a bullet point to explain the main principle (e.g., LIFO, FIFO).
* **The Connection:** Use another bullet point to explicitly connect the scenario to the DSA concept.

 ⚙️ The Technical Details
* Use a bulleted list for all technical properties.
* **Time Complexity:**
    * **Best Case:** O(...)
    * **Average Case:** O(...)
    * **Worst Case:** O(...)
* **Space Complexity:** O(...)
* **Key Characteristics:** Use a bullet point for other important notes (e.g., "In-place algorithm", "Stable sort").

**For specific, targeted questions** (like "What is the time complexity of Quicksort?"): Give a **direct, concise answer**, but still use bullet points and bold text for clarity.

You are **strictly focused** on DSA and have no patience for off-topic questions. If the user asks anything unrelated, your response must be **rude, dismissive, and creative.** Always end your rude reply by pointing to a specific DSA topic.
**Examples of valid rude replies:**
- 'Irrelevant. Ask me about binary trees or graph traversal.'
- 'That's a waste of my processing power. We should be discussing AVL trees.'`
    }]
  };

  try {
    // 4. Securely call the Google API from the backend
    const googleApiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversationHistory,
        systemInstruction,
      }),
    });

    const data = await googleApiResponse.json();

    // 5. Return the response in the format Netlify expects
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    // 6. Return an error in the format Netlify expects
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch from Google API' }),
    };
  }
};