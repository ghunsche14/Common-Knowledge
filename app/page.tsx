"use client";

import { useEffect, useMemo, useState } from "react";

type Topic = {
  id: string; slug: string; title: string; prompt: string; identity_mode: "anonymous" | "named";
  results_visibility: string; created_at: string; response_count: number; analysis: any;
};
type Response = { id: string; display_name: string | null; content: string; created_at: string };

export default function Home() {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [identity, setIdentity] = useState<"anonymous" | "named">("anonymous");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [response, setResponse] = useState("");
  const [name, setName] = useState("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"respond" | "results">("respond");
  const [shareCopied, setShareCopied] = useState(false);

  const slug = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("topic") || "";
  }, []);

  async function loadTopic(s: string) {
    const res = await fetch(`/api/topics/${encodeURIComponent(s)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load topic.");
    setTopic(data.topic);
    setResponses(data.responses || []);
  }

  useEffect(() => {
    if (slug) loadTopic(slug).catch(e => setMessage(e.message));
  }, [slug]);

  async function createTopic(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/topics", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt, identity_mode: identity }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create topic.");
      window.location.href = `/?topic=${data.topic.slug}`;
    } catch (e: any) { setMessage(e.message); setLoading(false); }
  }

  async function submitResponse(e: React.FormEvent) {
    e.preventDefault(); if (!topic) return;
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`/api/topics/${topic.slug}/responses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: response, display_name: topic.identity_mode === "named" ? name : null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit response.");
      setResponse(""); setName(""); setMessage("Your response was submitted. The shared analysis is updating.");
      await loadTopic(topic.slug); setTab("results");
    } catch (e: any) { setMessage(e.message); }
    finally { setLoading(false); }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/?topic=${topic?.slug}`);
    setShareCopied(true); setTimeout(() => setShareCopied(false), 1800);
  }

  async function refresh() {
    if (!topic) return;
    setLoading(true);
    try { await fetch(`/api/topics/${topic.slug}/analyze`, { method: "POST" }); await loadTopic(topic.slug); setMessage("Analysis refreshed."); }
    catch (e: any) { setMessage(e.message); }
    finally { setLoading(false); }
  }

  if (slug && !topic) return <main className="shell"><header className="brand"><span className="logo">✳</span><span>DecideWise</span></header><section className="panel"><p>{message || "Loading shared topic…"}</p><a href="/">Create a topic</a></section></main>;

  return <main className="shell">
    <header className="brand">
      <span className="logo">✳</span><span className="brand-name">DecideWise</span>
      <span className="tagline">Think together. See the bigger picture.</span>
      {topic && <button className="secondary small share-top" onClick={copyLink}>{shareCopied ? "Link copied ✓" : "↗ Share topic"}</button>}
    </header>

    {!topic ? <div className="hero-grid">
      <section className="hero">
        <div className="eyebrow">COLLECTIVE INTELLIGENCE, MADE CLEAR</div>
        <h1>Better decisions start with <em>different perspectives.</em></h1>
        <p className="intro">Create one shared question, invite people with a link, and let AI map the common ground, disagreements, and ideas that deserve a closer look.</p>
        <div className="feature-row"><div className="feature-icon">↔</div><div><b>Find common ground</b><p>Spot ideas that multiple people express in different words.</p></div></div>
        <div className="feature-row"><div className="feature-icon purple">◈</div><div><b>Understand differences</b><p>Separate real disagreements from complementary viewpoints.</p></div></div>
        <div className="feature-row"><div className="feature-icon gold">✦</div><div><b>Surface what's missing</b><p>Find unique points and useful follow-up questions.</p></div></div>
      </section>
      <section className="panel create-panel">
        <div className="panel-kicker">GET STARTED</div><h2>Create a shared topic</h2>
        <p className="muted">Make a space for people to respond independently.</p>
        <form onSubmit={createTopic} className="form">
          <label>Topic title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Priorities for next semester" required maxLength={120}/></label>
          <label>Question for participants<textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="What should we consider, and why? Share your perspective, concerns, and supporting information." required maxLength={1200} rows={4}/></label>
          <label>Participant identity<select value={identity} onChange={e => setIdentity(e.target.value as any)}><option value="anonymous">Anonymous responses</option><option value="named">Ask for names</option></select><span className="hint">You can choose whether names appear in the shared results.</span></label>
          <div className="privacy-note"><span>🔒</span><span>Anyone with the topic link can submit and view the shared results. Don't collect sensitive or confidential information.</span></div>
          <button className="primary full" disabled={loading}>{loading ? "Creating…" : "Create topic and get link →"}</button>
        </form>
        <p className="tiny muted">By creating a topic, you agree to use responses responsibly. Participants should know their responses are shared with link holders.</p>
      </section>
    </div> : <div className="workspace">
      <section className="topic-head">
        <a href="/" className="back">← New topic</a>
        <div className="eyebrow">SHARED DECISION SPACE</div><h1>{topic.title}</h1><p className="question">{topic.prompt}</p>
        <div className="topic-actions"><button className="primary" onClick={copyLink}>{shareCopied ? "Link copied ✓" : "↗ Copy invitation link"}</button><span className="muted small-text">{topic.response_count} {topic.response_count === 1 ? "response" : "responses"}</span></div>
      </section>
      <nav className="tabs"><button className={tab === "respond" ? "active" : ""} onClick={() => setTab("respond")}>Add your perspective</button><button className={tab === "results" ? "active" : ""} onClick={() => setTab("results")}>Group insights <span className="tab-count">{topic.response_count}</span></button></nav>
      {message && <div className="notice">{message}</div>}
      {tab === "respond" ? <section className="panel response-panel"><h2>What do you think?</h2><p className="muted">Share your own perspective. Responses are compared with others to identify themes and differences.</p>
        <form onSubmit={submitResponse} className="form">
          {topic.identity_mode === "named" && <label>Your name<input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required maxLength={80}/></label>}
          <label>Your response<textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="What do you think? What facts, reasons, concerns, or alternatives matter to you?" required minLength={3} maxLength={8000} rows={7}/></label>
          <div className="form-footer"><span className="hint">Your response is shared with anyone who has this link.</span><button className="primary" disabled={loading}>{loading ? "Submitting…" : "Submit response →"}</button></div>
        </form>
      </section> : <section className="results-layout">
        <div className="results-main">
          <div className="section-title"><div><div className="eyebrow">AI-SYNTHESIZED REPORT</div><h2>What the group is saying</h2></div><button className="secondary small" onClick={refresh} disabled={loading}>{loading ? "Analyzing…" : "↻ Refresh analysis"}</button></div>
          {!topic.analysis ? <div className="empty"><div className="empty-icon">✳</div><h3>Analysis is taking shape</h3><p>Once people submit responses, AI will identify shared themes, points of disagreement, unique insights, and questions worth discussing.</p><button className="secondary" onClick={() => setTab("respond")}>Add the first response</button></div> :
          <div className="analysis-stack">
            {topic.analysis.summary && <div className="summary-card"><div className="card-label">THE BIG PICTURE</div><p>{topic.analysis.summary}</p></div>}
            <AnalysisSection icon="↔" title="Similarities & common ground" color="green" items={topic.analysis.similarities}/>
            <AnalysisSection icon="⇄" title="Differences & disagreements" color="orange" items={topic.analysis.differences}/>
            <AnalysisSection icon="✦" title="Unique perspectives" color="purple" items={topic.analysis.unique_perspectives}/>
            <AnalysisSection icon="?" title="Questions to explore" color="blue" items={topic.analysis.follow_up_questions}/>
            {topic.analysis.caveats && <div className="caveat"><b>Interpret with care</b><p>{topic.analysis.caveats}</p></div>}
          </div>}
          <div className="responses-list"><h3>Submitted perspectives <span className="muted">({responses.length})</span></h3>
            {responses.length === 0 ? <p className="muted">No responses yet. Share the topic link to invite people.</p> : responses.map((r, i) => <article className="response-card" key={r.id}><div className="response-meta"><b>{topic.identity_mode === "named" ? (r.display_name || "Participant") : `Participant ${i + 1}`}</b><span>{new Date(r.created_at).toLocaleDateString()}</span></div><p>{r.content}</p></article>)}
          </div>
        </div>
        <aside className="side-card"><div className="side-icon">↗</div><h3>Bring everyone in</h3><p>Invite people to share their perspective. The report updates as new responses arrive.</p><button className="primary full" onClick={copyLink}>{shareCopied ? "Copied ✓" : "Copy shareable link"}</button><div className="side-stat"><b>{topic.response_count}</b><span>perspectives collected</span></div><button className="text-button" onClick={() => setTab("respond")}>Add my perspective →</button></aside>
      </section>}
    </div>}
    <footer><span>✳ DecideWise</span><span>Different perspectives. Clearer decisions.</span><span>AI insights support discussion, not replace judgment.</span></footer>
  </main>;
}

function AnalysisSection({ icon, title, color, items }: { icon: string; title: string; color: string; items: any[] }) {
  return <section className={`analysis-card ${color}`}><div className="analysis-title"><span className="analysis-icon">{icon}</span><h3>{title}</h3><span className="count">{Array.isArray(items) ? items.length : 0}</span></div>
    {!Array.isArray(items) || items.length === 0 ? <p className="muted compact">No clear findings yet.</p> : <ul>{items.map((item: any, i: number) => <li key={i}><b>{typeof item === "string" ? "" : item.theme || item.point || item.question || ""}</b><p>{typeof item === "string" ? item : item.description || item.explanation || item.question || ""}</p>{item.evidence && <div className="evidence">Evidence: {Array.isArray(item.evidence) ? item.evidence.join(" · ") : item.evidence}</div>}</li>)}</ul>}
  </section>;
}
