# GhostDrop Validator (Render Webhook)

A simple Express.js API that:
- Validates incoming POST requests from GPT
- Pulls Airtable Metadata (singleSelect / multiSelect)
- Validates dropdown values in real time
- Forwards valid data to Airtable

## Endpoints
- POST /clients
- POST /products
- POST /chatbot-scripts
- POST /follow-ups
- POST /embeds

## Setup
1. Clone this repo
2. Run `npm install`
3. Create `.env` with `AIRTABLE_API_TOKEN`
4. Run `npm start`

Deploy on Render with:
- `Build Command`: `npm install`
- `Start Command`: `npm start`
