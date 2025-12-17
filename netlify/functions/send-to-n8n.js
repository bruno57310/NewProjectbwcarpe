const axios = require("axios");
const jwt = require("jsonwebtoken");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { ids, userEmail, mixWeights } = body;

    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Send between 2 and 4 IDs." }),
      };
    }

    for (const id of ids) {
      if (typeof id !== "string" || id.trim() === "") {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Invalid ID: ${id}` }),
        };
      }
    }

    const token = jwt.sign(
      { iss: "mysaas", ids, email: userEmail, mixWeights },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "10m" }
    );

    const payload = { ids, email: userEmail, mixWeights, jwt: token };

    const basicAuth = Buffer.from(
      `${process.env.N8N_USER || "myuser"}:${process.env.N8N_PASSWORD || "mypassword"}`
    ).toString("base64");

    const n8nUrl =
      process.env.N8N_URL ||
      "https://n8n.srv815941.hstgr.cloud/webhook/my-secure-webhook";

    const response = await axios.post(n8nUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
    });

    console.log("n8n status:", response.status);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        status: response.status,
        response: response.data,
      }),
    };
  } catch (e) {
    console.error("send-to-n8n error", e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: e.message || "Unknown error",
        stack: e.stack,
      }),
    };
  }
};
