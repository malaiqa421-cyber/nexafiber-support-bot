import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowUpDown, Bot, Check, MapPin, Menu, Router, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChatWidget } from "@/components/ChatWidget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexaFiber Networks — Fiber internet, without the wait" },
      { name: "description", content: "Fast, reliable fiber plans in Pakistan from Rs. 3,000/month with a free router and a 24/7 AI support assistant." },
      { property: "og:title", content: "NexaFiber Networks — Fiber internet, without the wait" },
      { property: "og:description", content: "Fast, reliable fiber plans with a free router and a 24/7 AI support assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const PLANS = [
  { name: "Starter", tagline: "The everyday essentials", speed: "30 Mbps", price: "Rs. 3,000", data: "500 GB data", use: "Browsing & staying connected" },
  { name: "Home", tagline: "For a well-connected home", speed: "100 Mbps", price: "Rs. 5,000", data: "Unlimited data", use: "Streaming & working from home", popular: true },
  { name: "Pro", tagline: "More speed. More possibilities.", speed: "300 Mbps", price: "Rs. 9,000", data: "Unlimited data", use: "Gaming & multiple devices" },
  { name: "Gigabit", tagline: "Our fastest connection", speed: "1 Gbps", price: "Rs. 18,000", data: "Unlimited data", use: "Power users & busy households" },
];

const FAQS = [
  ["How long does installation take?", "A technician visits within 48 hours of booking, and installation usually takes 2 to 3 hours."],
  ["Is there a contract?", "Plans are month-to-month. A 12-month contract gives you 10% off and free installation."],
  ["How do I pay my bill?", "You can pay by card, bank transfer or supported local mobile wallets, and you can turn on automatic payments with a card."],
  ["What if my internet is down?", "Check Service Status in My Account, restart your router, or ask our AI assistant for help."],
];

const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none";

function Index() {
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openChat = () => setChatOpen(true);
  const go = (id: string) => (id === "top" ? window.scrollTo({ top: 0, behavior: "smooth" }) : scrollTo(id));
  const nav = [
    ["Home", "top"],
    ["Why NexaFiber", "why"],
    ["Plans", "plans"],
    ["Coverage", "coverage"],
    ["FAQ", "faq"],
  ] as const;

  return (
    <div className="min-h-screen">
      <div className="bg-navy px-4 py-2 text-center text-xs text-navy-foreground/80">
        NexaFiber is a fictional company created for a demo project.
      </div>

      <nav className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <button onClick={() => go("top")} className="justify-self-start text-left leading-none" aria-label="NexaFiber home">
            <span className="block font-display text-xl font-bold text-primary">NexaFiber</span>
            <span className="mt-1 block text-[10px] font-semibold tracking-[0.3em] text-cyan">NETWORKS</span>
          </button>
          <div className="hidden gap-7 lg:flex">
            {nav.map(([l, id]) => (
              <button key={id} onClick={() => go(id)} className="text-sm font-medium text-muted-foreground transition hover:text-primary focus-visible:text-primary focus-visible:outline-none">
                {l}
              </button>
            ))}
          </div>
          <button onClick={openChat} className={`${btnPrimary} hidden justify-self-end py-2.5 lg:inline-flex`}>Get Support</button>
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="flex flex-col border-t px-4 py-2 lg:hidden">
            {nav.map(([l, id]) => (
              <button key={id} onClick={() => { setMenuOpen(false); go(id); }} className="py-2.5 text-left text-sm font-medium">
                {l}
              </button>
            ))}
            <button onClick={() => { setMenuOpen(false); openChat(); }} className={`${btnPrimary} my-2`}>Get Support</button>
          </div>
        )}
      </nav>

      <header className="bg-hero text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-xs font-semibold tracking-[0.25em] text-cyan">FIBER BROADBAND</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold sm:text-6xl">
            Fiber internet, <span className="text-cyan">without the wait</span>
          </h1>
          <p className="mt-5 max-w-xl text-base opacity-85 sm:text-lg">
            Symmetrical speeds up to 1 Gbps, a free router and installation within 48 hours.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => scrollTo("plans")} className="inline-flex items-center justify-center rounded-xl bg-cyan px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-cyan/50 focus-visible:outline-none">
              See plans
            </button>
            <button onClick={() => scrollTo("coverage")} className="inline-flex items-center justify-center rounded-xl border border-navy-foreground/30 px-6 py-3 text-sm font-semibold transition hover:bg-navy-foreground/10 focus-visible:ring-4 focus-visible:ring-cyan/50 focus-visible:outline-none">
              Check availability
            </button>
          </div>
        </div>
      </header>

      <Section id="plans" title="Plans for every home" subtitle="Simple monthly pricing in PKR. No hidden fees.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`card-lift relative flex flex-col rounded-2xl border bg-card p-6 shadow-card ${p.popular ? "border-cyan bg-cyan-soft/40 ring-2 ring-cyan/40" : ""}`}>
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-cyan px-3 py-1 text-[11px] font-bold text-navy">Most popular</span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-3 text-sm font-semibold text-cyan">{p.speed}</p>
              <p className="mt-3">
                <span className="font-display text-3xl font-bold text-primary">{p.price}</span>
                <span className="text-sm text-muted-foreground"> / month</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {[p.data, "Symmetrical speeds", "Free Wi-Fi router"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="size-4 text-success" />{f}</li>
                ))}
              </ul>
              <p className="mt-5 border-t pt-4 text-sm font-medium">{p.use}</p>
              <button onClick={() => scrollTo("coverage")} className={`${btnPrimary} mt-5 w-full`}>Choose {p.name}</button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All prices are in PKR. All plans include a free router. 12-month contract: 10% off and free installation (otherwise Rs. 5,000).
        </p>
      </Section>

      <Section id="why" title="Why NexaFiber" muted>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [ArrowUpDown, "Symmetrical speeds", "Upload as fast as you download — ideal for video calls, backups and streaming."],
            [Router, "Free router", "Every plan comes with a modern Wi-Fi router at no extra cost."],
            [Bot, "24/7 AI assistant", "Get instant answers about plans, billing and connectivity, any time of day."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Bot;
            return (
              <div key={t as string} className="card-lift rounded-2xl border bg-card p-6 shadow-card">
                <div className="grid size-11 place-items-center rounded-xl bg-cyan-soft text-primary"><I className="size-5" strokeWidth={1.75} /></div>
                <h3 className="mt-4 font-semibold">{t as string}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d as string}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="coverage" title="Where we're available" subtitle="Fiber service is live in three cities, with more cities planned.">
        <div className="grid gap-4 sm:grid-cols-3">
          {["Lahore", "Karachi", "Islamabad"].map((c) => (
            <div key={c} className="card-lift flex items-center gap-3 rounded-2xl border bg-card p-5 shadow-card">
              <MapPin className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{c}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-success">
                  <span className="size-2 rounded-full bg-success" /> Live now
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed bg-muted p-5">
          <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-muted-foreground">More cities</h3>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">Coming soon</p>
            <p className="mt-2 text-sm text-muted-foreground">We plan to add more cities in Pakistan over time.</p>
          </div>
        </div>
      </Section>

      <Section id="faq" title="Frequently asked questions" muted>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5 shadow-card">
            {FAQS.map(([q, a], i) => (
              <AccordionItem key={q} value={`i${i}`} className={i === FAQS.length - 1 ? "border-b-0" : ""}>
                <AccordionTrigger className="text-left text-base font-semibold">{q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-cyan/40 bg-cyan-soft p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Still need help?</h3>
              <p className="text-sm text-muted-foreground">Ask the NexaFiber Support Assistant.</p>
            </div>
            <button onClick={openChat} className={btnPrimary}>Open support chat</button>
          </div>
        </div>
      </Section>

      <footer className="bg-hero text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <p className="font-display text-sm font-bold tracking-[0.2em]">NEXAFIBER NETWORKS</p>
            <p className="mt-3 text-sm opacity-75">
              Fast, reliable fiber internet for homes and businesses. Get instant answers from our AI support assistant or raise a support request whenever you need help.
            </p>
          </div>
          <FooterCol title="Quick links">
            <FLink onClick={() => scrollTo("plans")}>Explore Plans</FLink>
            <FLink onClick={() => scrollTo("coverage")}>Coverage</FLink>
            <FLink onClick={() => scrollTo("faq")}>Frequently Asked Questions</FLink>
          </FooterCol>
          <FooterCol title="Support">
            <FLink onClick={openChat}>AI Support Assistant</FLink>
            <FLink onClick={() => scrollTo("coverage")}>Check Network Status</FLink>
            <FLink onClick={openChat}>Create a Support Ticket</FLink>
            <a href="mailto:support@nexafiber.example" className="text-sm text-cyan hover:underline">support@nexafiber.example</a>
          </FooterCol>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="border-t border-navy-foreground/15 py-5 text-xs opacity-70">
            NexaFiber Networks is a fictional portfolio project created for demonstration purposes.
          </div>
        </div>
        <div className="bg-navy/60 px-4 py-4 text-center text-xs opacity-70">
          © 2026 NexaFiber Networks. Built as an AI-powered customer support portal demo.
        </div>
      </footer>

      <ChatWidget open={chatOpen} onOpen={openChat} onClose={() => setChatOpen(false)} />
    </div>
  );
}

function Section({ id, title, subtitle, muted, children }: { id?: string; title: string; subtitle?: string; muted?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={muted ? "bg-muted" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 flex flex-col items-start gap-2">{children}</div>
    </div>
  );
}

function FLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="text-left text-sm opacity-75 transition hover:text-cyan hover:opacity-100 focus-visible:text-cyan focus-visible:outline-none">
      {children}
    </button>
  );
}
