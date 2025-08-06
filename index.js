const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());

const AIRTABLE_BASE_ID = "app39rqq10aRiXVcB";
const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_API_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

async function fetchFieldOptions() {
  const url = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Airtable metadata");
  }

  const data = await response.json();
  const options = {};

  data.tables.forEach((table) => {
    table.fields.forEach((field) => {
      if (field.type === "singleSelect" || field.type === "multipleSelects") {
        options[`${table.name} > ${field.name}`] = field.options.choices.map(
          (choice) => choice.name
        );
      }
    });
  });

  return options;
}

async function validateFields(payload, tableName, fieldOptions) {
  const invalidFields = [];

  const record = payload.records[0];
  const fields = record.fields;

  for (const key in fields) {
    const fullKey = `${tableName} > ${key}`;
    if (fieldOptions[fullKey]) {
      const allowed = fieldOptions[fullKey];
      const value = fields[key];

      if (Array.isArray(value)) {
        const invalid = value.filter((v) => !allowed.includes(v));
        if (invalid.length > 0) invalidFields.push({ field: key, invalid });
      } else if (!allowed.includes(value)) {
        invalidFields.push({ field: key, invalid: value });
      }
    }
  }

  return invalidFields;
}

async function forwardToAirtable(endpoint, payload) {
  const url = `${AIRTABLE_API_BASE}/${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}

async function handleRoute(req, res, tableName, endpointPath) {
  try {
    const payload = req.body;
    const fieldOptions = await fetchFieldOptions();
    const errors = await validateFields(payload, tableName, fieldOptions);

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Invalid field values",
        details: errors,
      });
    }

    const result = await forwardToAirtable(endpointPath, payload);
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

app.post("/clients", (req, res) =>
  handleRoute(req, res, "Clients", "clients")
);
app.post("/products", (req, res) =>
  handleRoute(req, res, "Products", "products")
);
app.post("/chatbot-scripts", (req, res) =>
  handleRoute(req, res, "Chatbot Scripts", "chatbot-scripts")
);
app.post("/follow-ups", (req, res) =>
  handleRoute(req, res, "Follow-Ups", "follow-ups")
);
app.post("/embeds", (req, res) =>
  handleRoute(req, res, "Embeds", "embeds")
);

app.get("/", (req, res) => {
  res.send("👻 GhostDrop is live");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
