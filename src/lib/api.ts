import { QUERY_URL, TICKET_URL, USE_MOCK } from "./config";

export type ChatMessage = { role: "user" | "assistant"; text: string };

type Base = { email: string; question: string; answer: string; conversation: ChatMessage[] };

export type ResolutionResult =
  | { escalated: false }
  | { escalated: true; ticket_id: string; priority?: string; category?: string };

export type TicketResult = { ticket_id: string; message?: string; category?: string; priority?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status >= 400) throw new Error(`Request failed (${res.status})`);
  return res;
}

function handleLine(line: string, onToken: (t: string) => void) {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj && obj.type === "item" && typeof obj.content === "string") onToken(obj.content);
  } catch {
    onToken(line);
  }
}

export async function queryStream({
  email,
  question,
  sessionId,
  onToken,
}: {
  email: string;
  question: string;
  sessionId: string;
  onToken: (t: string) => void;
}): Promise<void> {
  if (USE_MOCK) {
    const text = /static ip/i.test(question)
      ? "I could not find reliable information about this in our help center. I'm passing your question to our support team for confirmation."
      : "Thanks for your question! Our plans start at $14/month for Starter (30 Mbps), with Home (100 Mbps) at $24, Pro (300 Mbps) at $39 and Gigabit (1 Gbps) at $64. All plans include a free router.\nSource: NF-201";
    await sleep(600);
    const parts = text.split(/(\s+)/);
    for (const p of parts) {
      onToken(p);
      await sleep(35);
    }
    return;
  }
  const res = await postJson(QUERY_URL, { email, question, sessionId });
  if (!res.body) {
    const t = await res.text();
    t.split("\n").forEach((l) => handleLine(l, onToken));
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    lines.forEach((l) => handleLine(l, onToken));
  }
  buf += decoder.decode();
  handleLine(buf, onToken);
}

export async function checkResolution({ email, question, answer, conversation }: Base): Promise<ResolutionResult> {
  if (USE_MOCK) {
    await sleep(400);
    if (/static ip|human/i.test(question))
      return { escalated: true, ticket_id: "TCK-123456", category: "Plans", priority: "medium" };
    return { escalated: false };
  }
  const res = await postJson(TICKET_URL, { mode: "check", email, question, answer, conversation });
  return res.json();
}

export async function createTicket({ email, question, answer, conversation }: Base): Promise<TicketResult> {
  if (USE_MOCK) {
    await sleep(900);
    return { ticket_id: "TCK-654321", category: "Plans", priority: "medium" };
  }
  const res = await postJson(TICKET_URL, {
    email,
    question,
    ai_answer: answer,
    user_feedback: "Customer clicked escalate to support ticket",
    category: "Other",
    priority: "medium",
    source: "manual",
    conversation,
  });
  return res.json();
}

const TOPICS: Record<string, string> = {
  "1": "Account",
  "2": "Plans & Pricing",
  "3": "Billing",
  "4": "Installation & Router",
  "5": "Troubleshooting",
  "6": "Outage & Maintenance",
  "7": "Policies & Support",
  "8": "Coverage",
};

/** Strips <think> blocks and a trailing "Source: NF-xxx" line. */
export function parseReply(raw: string): { text: string; source: string | null } {
  let text = raw.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "");
  let source: string | null = null;
  const m = text.match(/\n?\s*Source:\s*([A-Z]+-\d+)\s*$/i);
  if (m) {
    const id = (m[1] ?? "").toUpperCase();
    text = text.slice(0, m.index).trimEnd();
    const digits = id.split("-")[1] ?? "";
    const topic = digits.length >= 3 ? TOPICS[digits[digits.length - 3] ?? ""] : undefined;
    source = topic ? `Source · ${topic} (${id})` : `Source · ${id}`;
  }
  return { text: text.trim(), source };
}

export const cap = (s: string | undefined, fb: string) =>
  s && s.trim() ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : fb;