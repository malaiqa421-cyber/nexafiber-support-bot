# NexaFiber Support Assistant

An AI-powered customer support chatbot for NexaFiber, a fictional Pakistani fiber ISP (demo project). Customers enter their email, ask a question, get a streaming answer from a knowledge base, and can escalate to a support ticket.

## What it does
- Streams answers word by word from a Pinecone knowledge base (52 articles)
- Checks live account status and area outages from Supabase
- Creates support tickets (Supabase) and alerts the team on Slack with the full conversation
- Escalates unresolved questions automatically, or on one click

## Stack
n8n, Pinecone, Supabase, Slack, React + Vite + Tailwind

## Backend: two n8n endpoints
- `POST /api/v1/query-knowledge`: streaming AI agent (Pinecone search, account and outage tools)
- `POST /api/v1/create-ticket`: validates input (400 on invalid email or question), saves the ticket as Open, sends the Slack alert, returns 201 with a ticket ID. With `"mode": "check"` it first decides whether escalation is needed.

Workflow exports are in `n8n-workflows/`.

## Run locally
1. Import both workflows into n8n, add your own credentials (Pinecone, Supabase, Gemini, OpenRouter, Slack) and activate them.
2. Copy `.env.example` to `.env` and set the endpoint URLs.
3. `npm install` then `npm run dev`

## Notes
- NexaFiber is a fictional company created for demonstration purposes.
- Ticket IDs are returned only after the record is saved in the database.