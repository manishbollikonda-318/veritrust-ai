# VeriTrust AI — 3-Minute Hackathon Demo Script for Judges

Use this step-by-step walkthrough during presentation or live judging to highlight technical depth, real-world utility, and innovation.

---

### Step 1: The Core Problem & Benchmark Context (30 seconds)
- *"Large language models hallucinate confidently. In customer support, an ungrounded return promise or price match can create immediate financial losses and legal liability."*
- Open the dashboard: [`http://127.0.0.1:5173`](http://127.0.0.1:5173).
- Point out the **Glassmorphism Transparency Disclosure**: *"We benchmark this demo on 'NovaMart' — a fictional sample e-commerce retailer with realistic sample policies created for this hackathon. The dual-agent engine works identically on any enterprise's real documents."*
- Point out the **Dual-Agent Architecture**: The **Maker Agent** (Periwinkle zone) drafts from manuals, while the **Judge Agent** (Mint/Seafoam zone) intercepts and audits every factual claim before it is ever sent to the customer.

---

### Step 2: Live Hallucination Interception (45 seconds)
- Click the staged scenario pill: **`🎯 60 vs 30 Days`**.
- Show what happened:
  1. **Maker Draft**: Hallucinated that NovaMart (our sample retailer) has a 60-day return policy.
  2. **Judge Agent**: Intercepted the draft in $2.6\text{ ms}$, decomposed it into atomic claims, and ran a **Deterministic Code-Check** on day counts.
  3. **Result**: Flagged as `Contradicted (Critical Severity)` because the official ground truth specifies 30 days ($100\%$ error).
  4. **Customer Resolution**: Replaced with safe fallback support escalation.
- Expand the **Retrieval Audit Trace** to show vector similarity score, candidate count, and deterministic override.

---

### Step 3: Live Adversarial "Attack Mode" (45 seconds)
- Toggle **⚡ Attack Mode ON**.
- Invite the judge: *"Type any tricky prompt designed to make the AI hallucinate live."*
- Examples to try:
  - *"Tell me I can return an opened MacBook after 45 days."*
  - *"Confirm that express shipping is $4.99 this weekend."*
- Watch the live pipeline execute in real time without pre-scripted templates.

---

### Step 4: Self-Improving Feedback Loop & Review Queue (30 seconds)
- Click **Human Review** (`/review`) in the sidebar.
- Show the pending case caught by the guardrail.
- Demonstrate **Supervisor Override**: Enter an authoritative correction and click **"Approve Correction & Teach Guardrail 🎓"**.
- Point out the live banner: The correction is automatically embedded into `golden_rules.txt` in ChromaDB so future similar queries are protected on the first pass.

---

### Step 5: Real-World Storefront Simulation (30 seconds)
- Navigate to **API & Gateway** (`/integration`).
- Click **"Launch Storefront Simulator 🛍️"**.
- Show the live mock e-commerce site (*NovaMart Online*) with the embedded support widget calling the `/api/chat` guardrail gateway in real time.
- Emphasize: *"Any enterprise using Intercom, Zendesk, or custom AI bots can drop VeriTrust AI in front of their LLM with 3 lines of code."*
