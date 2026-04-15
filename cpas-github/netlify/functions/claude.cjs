exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" }, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // Support both direct Anthropic format and CPAS simplified format
    let requestBody;
    if (body.messages) {
      // Direct Anthropic API format — pass through
      requestBody = body;
    } else if (body.prompt) {
      // CPAS simplified format — wrap into messages
      requestBody = {
        model: "claude-sonnet-4-6",
        max_tokens: 6000,
        system: body.systemPrompt || "You are an expert NASA Contracting Officer assistant. Generate professional, complete procurement documents compliant with FAR and NFS. Always use bracketed placeholders like [Contract No.], [Date] for identifiers the CO must fill in.",
        messages: [{ role: "user", content: body.prompt }]
      };
    } else {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Request must include either messages array or prompt string" })
      };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: data.error?.message || "API error" })
      };
    }

    // Return in CPAS format (text field) for simplified calls
    const text = data.content?.[0]?.text || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ...data, text })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
