// CPAS Claude Proxy — streaming support for long document generation
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", ...cors },
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // Build request body
    const requestBody = body.messages ? body : {
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: body.systemPrompt || "You are an expert NASA Contracting Officer assistant. Generate professional procurement documents compliant with FAR and NFS. Use bracketed placeholders like [Contract No.], [Date] for identifiers the CO must fill in.",
      messages: [{ role: "user", content: body.prompt }]
    };

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
        headers: { "Content-Type": "application/json", ...cors },
        body: JSON.stringify({ error: data.error?.message || "API error" })
      };
    }

    const text = data.content?.[0]?.text || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", ...cors },
      body: JSON.stringify({ ...data, text })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", ...cors },
      body: JSON.stringify({ error: err.message })
    };
  }
};
