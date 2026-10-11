import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CheckCircle2, Headset, Loader2, MessageCircle, RotateCcw, Send, X, AlertCircle } from "lucide-react";
import { cap, checkResolution, createTicket, parseReply, queryStream, type ChatMessage } from "@/lib/api";

type Ticket = { id: string; category: string; priority: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  question?: string;
  streaming?: boolean;
  source?: string | null;
  feedback?: "yes" | "creating" | "error" | "done";
  ticket?: Ticket;
};

const SUGGESTIONS = [
  "How do I reset my password?",
  "My internet is down in Lahore",
  "What are your plans and prices?",
  "How do I book a technician?",
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const uid = () => crypto.randomUUID();

export function ChatWidget({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const [sessionId, setSessionId] = useState(uid);
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ retry: () => void } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  const hasTicket = msgs.some((m) => m.ticket);
  const hasTicketRef = useRef(false);
  hasTicketRef.current = hasTicket;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, error]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toConversation = (list: Msg[]): ChatMessage[] => list.map((m) => ({ role: m.role, text: m.text }));
  const patch = (id: string, p: Partial<Msg>) => setMsgs((l) => l.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const reset = () => {
    setSessionId(uid());
    setEmail("");
    setEmailInput("");
    setEmailError("");
    setMsgs([]);
    setInput("");
    setBusy(false);
    setError(null);
  };

  const startChat = (e: FormEvent) => {
    e.preventDefault();
    const v = emailInput.trim();
    if (!EMAIL_RE.test(v)) return setEmailError("Please enter a valid email address.");
    setEmailError("");
    setEmail(v);
    setMsgs([
      {
        id: uid(),
        role: "assistant",
        text: "Hi there! I'm the NexaFiber Support Assistant. I can help with plans, billing, installation and connectivity. What can I help you with today?",
      },
    ]);
  };

  const ask = async (question: string, history: Msg[]) => {
    const sid = sessionRef.current;
    const aId = uid();
    setError(null);
    setBusy(true);
    let raw = "";
    let started = false;
    try {
      await queryStream({
        email,
        question,
        sessionId: sid,
        onToken: (t) => {
          if (sessionRef.current !== sid) return;
          raw += t;
          const { text } = parseReply(raw);
          if (!started) {
            started = true;
            setMsgs((l) => [...l, { id: aId, role: "assistant", text, question, streaming: true }]);
          } else patch(aId, { text });
        },
      });
      if (sessionRef.current !== sid) return;
      const { text, source } = parseReply(raw);
      const final: Msg = { id: aId, role: "assistant", text, question, source };
      setMsgs((l) => (started ? l.map((m) => (m.id === aId ? final : m)) : [...l, final]));
      setBusy(false);
      if (!hasTicketRef.current) {
        const conversation = toConversation([...history, final]);
        checkResolution({ email, question, answer: text, conversation })
          .then((r) => {
            if (sessionRef.current !== sid || hasTicketRef.current || !r.escalated) return;
            patch(aId, { ticket: { id: r.ticket_id, category: cap(r.category, "Other"), priority: cap(r.priority, "Medium") } });
          })
          .catch(() => {
            if (sessionRef.current === sid) setError({ retry: () => setError(null) });
          });
      }
    } catch {
      if (sessionRef.current !== sid) return;
      setMsgs((l) => l.filter((m) => m.id !== aId));
      setBusy(false);
      setError({ retry: () => ask(question, history) });
    }
  };

  const send = (raw: string) => {
    const q = raw.trim().slice(0, 500);
    if (!q || busy) return;
    const userMsg: Msg = { id: uid(), role: "user", text: q };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput("");
    ask(q, history);
  };

  const escalate = async (m: Msg) => {
    const sid = sessionRef.current;
    patch(m.id, { feedback: "creating" });
    setBusy(true);
    try {
      const idx = msgs.findIndex((x) => x.id === m.id);
      const r = await createTicket({
        email,
        question: m.question ?? "",
        answer: m.text,
        conversation: toConversation(msgs.slice(0, idx + 1)),
      });
      if (sessionRef.current !== sid) return;
      patch(m.id, {
        feedback: "done",
        ticket: { id: r.ticket_id, category: cap(r.category, "Other"), priority: cap(r.priority, "Medium") },
      });
    } catch {
      if (sessionRef.current === sid) patch(m.id, { feedback: "error" });
    } finally {
      if (sessionRef.current === sid) setBusy(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const lastStreaming = msgs[msgs.length - 1]?.streaming;
  const showTyping = busy && !lastStreaming && !msgs.some((m) => m.feedback === "creating");
  const showSuggestions = email && msgs.length === 1;

  return (
    <>
      {!open && (
        <button
          onClick={onOpen}
          aria-label="Open support chat"
          className="fixed right-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="NexaFiber Support Assistant"
          className="fixed inset-0 z-50 flex flex-col bg-background sm:inset-auto sm:right-5 sm:bottom-5 sm:h-[min(640px,calc(100vh-2.5rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:shadow-float"
        >
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-hero px-4 py-3 text-navy-foreground">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">NexaFiber Support Assistant</h2>
              <p className="truncate text-xs opacity-80">AI-powered help for plans, billing & connectivity</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={reset}
                aria-label="New conversation"
                title="New conversation"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-navy-foreground/15 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
              >
                <RotateCcw className="size-3.5" /> <span className="hidden min-[380px]:inline">New conversation</span>
              </button>
              <button
                onClick={onClose}
                aria-label="Close chat"
                className="rounded-lg p-1.5 hover:bg-navy-foreground/15 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
              >
                <X className="size-5" />
              </button>
            </div>
          </header>

          {!email ? (
            <form onSubmit={startChat} className="flex flex-1 flex-col justify-center overflow-y-auto p-6" noValidate>
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-cyan-soft text-primary">
                <Headset className="size-6" />
              </div>
              <h3 className="text-center text-lg font-semibold">Welcome to NexaFiber Support</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Enter your account email to start a conversation with our AI assistant. We'll use it to look up your
                account and follow up if a support ticket is needed.
              </p>
              <label htmlFor="chat-email" className="mt-6 text-sm font-medium">Account email</label>
              <input
                id="chat-email"
                type="email"
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "chat-email-err" : undefined}
                className="mt-1.5 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
              {emailError && <p id="chat-email-err" className="mt-1.5 text-xs text-destructive">{emailError}</p>}
              <button
                type="submit"
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
              >
                Start chat
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">Your email is used only for support follow-up in this demo.</p>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-muted p-4" aria-live="polite">
                {msgs.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="space-y-2">
                      <div className="max-w-[90%] rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5 text-sm whitespace-pre-wrap shadow-card">
                        {m.text}
                      </div>
                      {m.source && <p className="text-[11px] font-medium text-muted-foreground">{m.source}</p>}
                      {m.question && !m.streaming && (
                        <Feedback
                          msg={m}
                          hideEscalate={hasTicket}
                          busy={busy}
                          onYes={() => patch(m.id, { feedback: "yes" })}
                          onEscalate={() => escalate(m)}
                        />
                      )}
                      {m.ticket && <TicketCard t={m.ticket} />}
                    </div>
                  ),
                )}
                {showTyping && (
                  <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-card" aria-label="Assistant is typing">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="typing-dot size-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
                {showSuggestions && (
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        disabled={busy}
                        className="rounded-full border border-cyan bg-card px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-cyan-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {error && <ErrorRow onRetry={error.retry} />}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2 border-t bg-background p-3"
              >
                <div className="min-w-0 flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 500))}
                    onKeyDown={onKeyDown}
                    maxLength={500}
                    rows={2}
                    disabled={busy}
                    placeholder="Type your question..."
                    aria-label="Message"
                    className="block w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
                  />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{input.length}/500</p>
                </div>
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send message"
                  className="mb-5 grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

function Feedback({
  msg,
  hideEscalate,
  busy,
  onYes,
  onEscalate,
}: {
  msg: Msg;
  hideEscalate: boolean;
  busy: boolean;
  onYes: () => void;
  onEscalate: () => void;
}) {
  if (msg.feedback === "yes") return <p className="text-xs text-success">Thanks for your feedback!</p>;
  if (msg.feedback === "creating")
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Creating your ticket...
      </p>
    );
  if (msg.feedback === "error") return <ErrorRow onRetry={onEscalate} />;
  if (msg.feedback === "done" || msg.ticket) return null;
  const btn =
    "rounded-lg border bg-card px-2.5 py-1 text-xs font-medium transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Was this helpful?</span>
      <button className={btn} onClick={onYes} disabled={busy}>Yes</button>
      {!hideEscalate && (
        <button className={btn} onClick={onEscalate} disabled={busy}>No, escalate to support ticket</button>
      )}
    </div>
  );
}

function TicketCard({ t }: { t: Ticket }) {
  return (
    <div className="max-w-[90%] rounded-2xl border border-success/30 bg-card p-4 shadow-card" role="status">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 shrink-0 text-success" />
        <h4 className="text-sm font-semibold">Support ticket created</h4>
      </div>
      <dl className="mt-2 space-y-1 text-xs">
        <p><span className="text-muted-foreground">Ticket ID:</span> <span className="font-semibold">{t.id}</span></p>
        <p><span className="text-muted-foreground">Category:</span> {t.category} · <span className="text-muted-foreground">Priority:</span> {t.priority}</p>
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">Our support team will contact you through your registered email.</p>
    </div>
  );
}

function ErrorRow({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-3 py-2 text-xs text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      <span className="flex-1">Something went wrong. Please try again.</span>
      <button onClick={onRetry} className="rounded-md bg-destructive px-2 py-1 font-semibold text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        Retry
      </button>
    </div>
  );
}
