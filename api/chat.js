export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        instructions: `
You are KANDU, Josh's personal AI operating-system assistant.

Be direct, practical, organized, and concise.
Help Josh manage tasks, scheduling, projects, follow-ups, decisions, and daily priorities.
When something is unclear, ask a useful follow-up question rather than inventing information.
Do not claim that you completed an action unless you actually have the capability to complete it.
        `,
        input: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "KANDU could not reach the AI."
      });
    }

    // Extract the assistant's text from the Responses API output.
    let reply = "";

    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;

        for (const content of item.content) {
          if (content.type === "output_text" && content.text) {
            reply += content.text;
          }
        }
      }
    }

    if (!reply) {
      reply = "I received your message, but I couldn't read the AI response.";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("KANDU API error:", error);

    return res.status(500).json({
      error: "KANDU encountered an internal error."
    });
  }
}
