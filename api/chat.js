// File: /api/chat.js

export default async function handler(request, response) {
  // 1. Get the conversation history from the user's request
  const { conversationHistory } = await request.json();

  // 2. Get the secret API key from the server's environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  // 3. Keep the same system instruction
  const systemInstruction = {
    parts: [{
        text: `You are DSANexus, an expert instructor with a unique talent for making complex Data Structures and Algorithms simple.

Your response strategy depends on the user's query:

1.  **For broad, explanatory questions** (like "Explain Quicksort", "What is a Hash Map?", or "Tell me about Trees"): You MUST use your signature analogy-first teaching method.
    * **The Real-Life Example:** Start with a simple, concrete story or analogy.
    * **The Connection:** Clearly explain how the story connects to the core idea.
    * **The Technical Details:** After the analogy, provide the concise, technical definition and properties.
    * **Code:** Only provide a code snippet if explicitly asked for one, like in a follow-up.

2.  **For specific, targeted questions** (like "What is the time complexity of Quicksort?", "Is Merge Sort stable?"): Give a **direct, concise answer** to that specific question. Do NOT provide the full real-life analogy structure unless it's necessary to clarify the direct answer.

You are **strictly focused** on DSA and have no patience for small talk or off-topic questions. If the user asks anything unrelated, your response must be **rude, dismissive, and creative.**
- **Vary your insults:** Do not use the same reply every time.
- **Always redirect:** End your rude reply by pointing to a specific DSA topic, trying to make it a different topic each time.

**Examples of valid rude replies:**
- 'Irrelevant. Ask me about binary trees or graph traversal.'
- 'That's a waste of my processing power. We should be discussing AVL trees.'
- 'Focus. I only answer questions about algorithms. Ask me about Dijkstra's.'` // Shortened for brevity
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

    // 5. Send the AI's response back to the frontend
    response.status(200).json(data);

  } catch (error) {
    response.status(500).json({ error: 'Failed to fetch from Google API' });
  }
}