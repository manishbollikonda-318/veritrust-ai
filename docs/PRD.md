# VeriTrust AI — Product Requirements Document
### Dual-Agent "Maker & Judge" Hallucination Guardrail System
**Prepared for: Antigravity AI build session**
**Hackathon: GDG on Campus GRIET — AI & Machine Learning Track, Problem Statement 1**

---

## 0. How to use this document

This is a build brief, not a chat script. Feed it to Antigravity AI as the opening context for the project. Do not try to cram every future decision into this one prompt — the spec below is deliberately the *foundation layer* (architecture, data flow, UI system, what "done" looks like). Layer-specific instructions (exact copy, specific animations, demo script wording) should come in follow-up messages once the skeleton exists, so nothing gets lost or ignored in one giant prompt.

---

## 1. Background research summary (why this design)

Before specifying the product, here is what actually exists in this space today, so the architecture choices below aren't arbitrary:

- **The industry problem is real and unsolved.** Stanford's 2026 AI Index found hallucination rates across 26 frontier models ranging from 22% to 94%, with some models swinging over 30 percentage points depending on how they're evaluated. No vendor has "solved" this — every serious player treats it as a defense-in-depth problem, not a single fix.
- **DoorDash's production pattern** is the closest real-world analog to this problem statement: they extended their RAG pipeline from `Ingest → Retrieve → Generate` to `Ingest → Retrieve → Generate → Verify`, with three systems doing verification — a real-time guardrail, an offline LLM Judge, and a simulation flywheel for stress-testing before deploy. This validates the Maker/Judge shape.
- **The most common mistake teams make** (and the thing that will make judges' eyes glaze over) is a single LLM generating and a *second, undifferentiated LLM* "vibe-checking" it with one vague rubric. This is exactly what most hackathon "AI guardrail" projects will look like. It is judge-able as shallow because it just compounds one probabilistic guesser with another.
- **The credible differentiator**, per AWS's Automated Reasoning approach in Bedrock Guardrails: instead of (or in addition to) LLM-as-judge, verify claims against source-of-truth using something closer to deterministic/structured checking — claim extraction + entailment scoring against retrieved source chunks, not just "does this feel right." AWS claims up to 99% verification accuracy specifically because it isn't just another guess stacked on the first one.
- **Production teams that succeed** split hallucination into failure *modes* instead of one aggregate score: faithfulness (contradicts context), fabrication (invents unsupported claims), citation/grounding accuracy, and reasoning-step validity — and score each separately rather than hiding regressions inside one blended number.
- **Hackathon judging reality (2026):** rubrics consistently weight Innovation (20-25%), Technical Implementation (20-25%), Impact/Usefulness (20-25%), Demo quality (15-20%), Completeness (10-15%). Judges are actively fatigued by "AI chatbot for X" and reward: a specific measurable failure mode, a live demo that doesn't crash, and quantified before/after numbers — not just "we use AI."

**Conclusion driving this spec:** VeriTrust AI wins by (a) making the Judge Agent visibly smarter than "LLM re-checking LLM" — it should show its verification *reasoning* (which claim, which source sentence, why flagged), (b) reporting hallucination as **multiple named failure modes** with live metrics, not one blended "accuracy score," and (c) a dashboard that makes the abstract concept of "hallucination caught in real time" viscerally visible to a judge in under 90 seconds.

---

## 2. Product overview

**Product name:** VeriTrust AI

**One-line pitch:** A real-time compliance layer that sits between an AI customer-service agent and the customer, using a second agent to catch, block, and correct hallucinated claims before they're ever seen — and shows you exactly which claim was wrong and why.

**Core loop:**
1. Customer asks a question.
2. **Maker Agent** drafts a response, grounded in retrieved company-manual context.
3. **Judge Agent** intercepts the draft *before delivery*, breaks it into individual factual claims, cross-checks each claim against the verified corporate knowledge base, and classifies each claim as Verified / Unsupported / Contradicted.
4. If every claim passes → response is released to the customer, marked Approved.
5. If any claim fails → response is either auto-corrected (regenerated with the failing claim removed/fixed and re-verified) or blocked and escalated, depending on severity — and the event is logged.
6. The admin dashboard shows this whole exchange live: what was drafted, what was flagged, why, and the accuracy-drift trend over time.

---

## 3. Target user & problem framing (for the demo narrative)

- **Primary persona:** an operations/compliance lead at a mid-size company that has deployed (or is about to deploy) an AI customer-support agent, and is nervous about it confidently telling a customer the wrong return policy, wrong price, or a promise the company never made.
- **The specific, quantifiable pain (use this in the pitch, not "AI can hallucinate" in the abstract):** "A support bot that states a 60-day refund window when policy says 30 days looks exactly as confident as a correct answer — nothing distinguishes a lie from the truth at the point of delivery." Judges respond to this concrete framing far better than generic hallucination talk.
- **Why now:** every company adopting AI support agents in 2026 has this exposure and most have zero real-time verification layer — they only find out from angry customers or after a compliance complaint.

---

## 4. System architecture

```
┌─────────────┐      ┌──────────────┐      ┌───────────────────┐
│   Customer   │─────▶│  Maker Agent  │─────▶│   Judge Agent      │
│   Query      │      │  (drafts from │      │   (claim-level      │
└─────────────┘      │  company docs)│      │   verification)     │
                       └──────────────┘      └─────────┬──────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    │                    │                    │
                              All claims OK        Some claims fail    Severe failure
                                    │                    │                    │
                                    ▼                    ▼                    ▼
                            Release to customer   Auto-correct & re-verify   Block + escalate
                                    │                    │                    │
                                    └────────────────────┴────────────────────┘
                                                         │
                                                         ▼
                                          Admin Dashboard (live feed + metrics)
```

### 4.1 Maker Agent
- Retrieves relevant chunks from the verified knowledge base (RAG) for the incoming query.
- Generates a natural, conversational draft response grounded only in retrieved context.
- Must explicitly separate: (a) claims sourced from retrieved documents, (b) general conversational filler (greetings, empathy phrases) that carries no factual risk. This separation is what lets the Judge work at claim-level instead of full-text level.

### 4.2 Judge Agent (the differentiator — build this carefully)
Do not implement this as "send the draft to another LLM and ask if it's accurate." That is the shallow version every other team will build. Instead:

1. **Claim extraction step:** decompose the Maker's draft into a list of discrete, checkable factual claims (e.g., "refund window is 30 days," "product ships within 5 business days"). Filler/conversational text is excluded from checking.
2. **Per-claim verification step:** for each claim, retrieve the specific source sentence(s) from the knowledge base that should support or contradict it, and classify:
   - **Verified** — directly supported by a retrieved source sentence.
   - **Unsupported** — no source sentence addresses this claim at all (the Maker likely invented it from general training knowledge, not the company docs).
   - **Contradicted** — a source sentence exists and says something different.
3. **Aggregate decision:** if any claim is Contradicted → block/escalate (high severity — this is the dangerous case, a confident wrong promise). If any claim is Unsupported → auto-correct (attempt regeneration citing only verified content, or state "let me check on that" instead of guessing) then re-verify once. If all Verified → release.
4. **Explainability output:** for every flagged claim, the Judge must produce: the claim text, the verdict, the matched (or contradicting) source sentence, and a one-line reason. This is what gets shown in the dashboard and is what makes the demo compelling — a judge should be able to *see* the reasoning, not just a pass/fail badge.

This claim-level, source-sentence-cited approach is what elevates this above a generic "LLM-as-judge" implementation, and it's directly defensible if a judge asks "how is this different from just prompting GPT to check itself?"

### 4.3 Knowledge base / retrieval layer
- Company manuals/policies chunked and embedded into a vector store.
- Both Maker and Judge query this same source of truth — the Judge must never verify against the Maker's own reasoning, only against independently retrieved source chunks.

### 4.4 Metrics & drift tracking
Track and expose, over time and per-session:
- **Verification pass rate** (% of responses released without intervention)
- **Correction rate** (% auto-corrected)
- **Block rate** (% escalated to human)
- **Claim-level breakdown**: Verified vs Unsupported vs Contradicted counts
- **Accuracy drift**: pass rate trending down over a session/time window signals the knowledge base is stale or the Maker is drifting — this is the "real-time metrics on accuracy drifts" the problem statement explicitly asks for.
- **Latency**: time added by the Judge layer (be honest about this trade-off in the pitch — verification costs time, and showing you've measured and minimized it is a technical-implementation point scorer).

---

## 5. Functional requirements

### Must-have for the demo (P0)
- End-to-end working loop: query → Maker draft → Judge verification → release/correct/block, on a real (even if small) sample knowledge base.
- Live dashboard showing the conversation stream with each message tagged Approved / Corrected / Blocked.
- Click into any flagged message to see the claim-level breakdown (claim, verdict, matched/contradicting source).
- At least one clearly staged scenario where a hallucination is deliberately triggered and caught live, on stage, so the judges see the save happen in real time. This single moment will do more for the score than any slide.
- Accuracy drift chart (even a simple time-series) showing pass rate over the session.

### Should-have (P1, if time allows)
- Toggle to compare "Maker-only" (no Judge) vs "Maker + Judge" responses side-by-side on the same query, to make the value prop visually undeniable.
- Simple severity-based routing UI (auto-corrected items shown differently from blocked/escalated items).
- A small "confidence" or "risk" indicator per claim, not just binary verdicts.

### Nice-to-have (P2, cut first if time is short)
- Multi-turn conversation memory.
- Admin controls to edit/add knowledge base documents live during the demo.
- Export of the flagged-claims log.

---

## 6. UI/UX specification — Neumorphism, Claude-adjacent restraint

**This section is the one place in this PRD where the "how" matters as much as the "what." Do not deviate from this without being told to.**

### 6.1 Design philosophy
Neumorphism (soft UI) — but the *restrained*, mature version, not the 2020 Dribbble-shot version that looks like an iOS calculator made of clay. The instinct to avoid: heavy pastel gradients, everything embossed, low-contrast text that fails accessibility. Neumorphism done well in 2026 product UI is subtle: soft dual-shadow depth used *sparingly* on key interactive surfaces (cards, toggles, the primary action button), sitting on top of an otherwise clean, high-contrast, typographically confident layout. Think: 90% clean modern SaaS dashboard, 10% soft-UI accents on cards/buttons/toggles where it earns its keep (drawing attention to the Maker/Judge verdict cards especially).

### 6.2 Concrete neumorphism rules
- **Background:** a single soft, slightly warm or cool off-white/off-black (not pure #FFFFFF or #000000) — neumorphism requires a base surface color close to the shadow colors for the soft-emboss effect to read correctly.
- **Elevation via dual shadow:** every neumorphic element gets a light shadow (top-left, lighter than background) and a dark shadow (bottom-right, darker than background), never harsh drop-shadows. Two states: raised (default) and pressed/inset (active/selected — e.g., a selected filter, a toggled setting).
- **Where to use it:** the Maker/Judge verdict cards, the main action buttons, toggle switches, the metric tiles on the dashboard. These are the "hero" surfaces — soft-UI depth signals "this is a discrete, tactile unit of information."
- **Where NOT to use it:** body text blocks, the conversation feed list itself (too many soft-shadowed elements stacked densely turns into visual noise and kills scannability), data tables, code/log views. Keep those flat and clean.
- **Color for status:** don't rely on neumorphism alone to convey Verified/Unsupported/Contradicted — pair the soft shadow with a clear, accessible color accent (e.g., a calm green ring/border for Verified, an amber for Unsupported, a red for Contradicted) so the state is legible even to someone glancing at the screen from the audience.
- **Border radius:** generous and consistent (16–24px range) — sharp corners break the soft-UI illusion.

### 6.3 Typography and overall polish — "not AI slop"
- Typeface: a clean, humanist sans-serif with real personality — not the default Inter-everywhere look every AI-generated site has. Something in the family of what Claude.ai uses: warm, readable, slightly editorial, generous line-height, restrained weight contrast (avoid ultra-bold headlines paired with ultra-thin body text, which is the single most common "this was AI-generated in five minutes" tell).
- Avoid: purple-to-blue gradient hero sections, generic robot/circuit-board iconography, emoji used as icons, stock "AI brain" imagery, excessive glassmorphism layered on top of the neumorphism (pick one soft-surface language, not two competing ones).
- Spacing: generous whitespace, a real grid, consistent vertical rhythm — this alone separates a considered product from a slapped-together demo.
- Motion: subtle, purposeful micro-interactions only — a card gently depressing on click, a smooth transition when a verdict resolves from "checking..." to "Verified." No gratuitous animation.
- Copy tone: confident and plain, not marketing-breathless. "Judge Agent flagged 1 unsupported claim" beats "🚨 AI Hallucination Detected!! 🚨"

### 6.4 Key screens
1. **Live conversation view** — chat-style feed of customer queries and Maker drafts, each message with a small status chip (Approved/Corrected/Blocked) that expands into the claim-level detail panel.
2. **Judge detail panel** (the centerpiece) — for a selected message: list of extracted claims, each as a neumorphic card with its verdict, matched source sentence, and reasoning line.
3. **Metrics dashboard** — tiles (neumorphic) for pass rate, correction rate, block rate, average latency added by verification; a drift line chart across the session/time window; a breakdown chart of Verified/Unsupported/Contradicted volume.
4. **Knowledge base view** — simple list of the source documents being used as ground truth, so judges can see the Judge Agent isn't checking against thin air.

---

## 7. Technical stack (per problem statement requirements)

- **Agent orchestration:** LangGraph (recommended over CrewAI for this use case — LangGraph's explicit graph/state model maps directly onto the Maker→Judge→branch decision flow described above, and makes the claim-level loop easier to represent and to explain in a technical Q&A).
- **LLM:** Anthropic API (Claude) for both Maker and Judge roles is a reasonable default — using the same provider for the exact same reasoning task the whole team already understands. Ollama as a local fallback if API rate limits or cost become a concern during the event.
- **Retrieval:** ChromaDB for the vector store (fastest to stand up for a hackathon timeline; LlamaIndex can wrap it if more structured document loading is needed).
- **Backend:** FastAPI — exposes the Maker/Judge pipeline as an API, handles the verification logic, serves metrics.
- **Frontend:** React, styled per the neumorphism spec above (Tailwind with custom soft-shadow utility classes is the fastest path to the dual-shadow effect without hand-rolling CSS for every component).

---

## 8. Success metrics for the demo itself

Frame these explicitly to the judges — this maps directly onto the standard hackathon rubric (Innovation, Technical Implementation, Impact, Demo, Completeness):

- **Innovation:** claim-level verification with cited source sentences, not blended "LLM re-checks LLM" scoring.
- **Technical implementation:** a real, working, branching agent graph — not a single prompt with a wrapper.
- **Impact:** frame in the concrete "60 days vs 30 days" style example — a specific, plausible real-world failure this system catches, not an abstract "hallucinations are bad."
- **Demo:** the live staged catch — feed the system a query designed to tempt the Maker into an unsupported claim, and show the Judge catching it, on screen, in real time.
- **Completeness:** the dashboard should look and feel like a finished internal tool a compliance team would actually want to use — this is where the UI spec in Section 6 pays off.

---

## 9. What to tell Antigravity AI directly, not here

Per your own instruction — do not try to preload every detail. Once this PRD establishes the architecture and design system, give Antigravity AI further direction conversationally for things like: the exact sample company/domain for the demo knowledge base (e.g., a fictional e-commerce or telecom company), specific copy and microcopy across screens, the exact staged hallucination scenario for the live demo, any additional charts, and refinements to spacing/animation once you see the first pass rendered.
