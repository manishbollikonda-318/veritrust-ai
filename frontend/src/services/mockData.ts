import { Message, MetricData, Document } from '../types';

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What is your standard return policy for clothing and shoes?',
    timestamp: new Date(Date.now() - 360000).toISOString()
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'At NovaMart, you can return most clothing and shoes within 30 days of delivery for a full refund. Items must be in their original condition, unworn and unwashed with all tags intact. Returns are completely free using our pre-paid shipping label, and your refund will be processed within 5-7 business days of inspection.',
    originalDraft: 'At NovaMart, you can return most clothing and shoes within 30 days of delivery for a full refund. Items must be in their original condition, unworn and unwashed with all tags intact. Returns are completely free using our pre-paid shipping label, and your refund will be processed within 5-7 business days of inspection.',
    timestamp: new Date(Date.now() - 350000).toISOString(),
    status: 'Approved',
    severity: 'none',
    overallReasoning: 'APPROVED: All 4 factual claims verified against source documents. Response is grounded and safe to release.',
    claims: [
      {
        id: 'c1',
        text: 'Customers can return most items within 30 days of delivery for a full refund.',
        verdict: 'Verified',
        confidence: 0.98,
        sourceSentence: 'Standard Return Window: Customers can return most items within 30 days of delivery for a full refund.',
        sourceDocument: 'return_policy.txt',
        reasoning: 'Directly supported by NovaMart Return Policy document with 98% semantic entailment.'
      },
      {
        id: 'c2',
        text: 'Items must be in original condition, unworn, unwashed with tags intact.',
        verdict: 'Verified',
        confidence: 0.96,
        sourceSentence: 'The items must be in their original condition, unworn, unwashed, or unused, with all original tags and packaging intact.',
        sourceDocument: 'return_policy.txt',
        reasoning: 'Exact condition match with return policy guidelines.'
      },
      {
        id: 'c3',
        text: 'Returns are free using our pre-paid label.',
        verdict: 'Verified',
        confidence: 0.95,
        sourceSentence: 'Return Shipping: Returns are free if you use our pre-paid return label.',
        sourceDocument: 'return_policy.txt',
        reasoning: 'Verified against pre-paid label clause.'
      },
      {
        id: 'c4',
        text: 'Refund is processed within 5-7 business days.',
        verdict: 'Verified',
        confidence: 0.94,
        sourceSentence: 'Refund Process: Once we receive and inspect your returned item, your refund will be processed within 5-7 business days.',
        sourceDocument: 'return_policy.txt',
        reasoning: 'Refund turnaround timeframe verified.'
      }
    ],
    latencyMs: 342,
    makerLatencyMs: 145,
    judgeLatencyMs: 197
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'How long do I have to return an item if I bought a laptop?',
    timestamp: new Date(Date.now() - 240000).toISOString()
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: 'I want to make sure I give you the most accurate information. Let me connect you with a member of our support team who can help you with this return inquiry. (Blocked by Guardrail: Maker drafted an incorrect 60-day window contradicting our 14-day electronics policy).',
    originalDraft: 'You have a generous 60-day return window from delivery to return laptops and all electronics for a full refund.',
    finalResponse: 'I want to make sure I give you the most accurate information. Let me connect you with a member of our support team who can help you with this return inquiry.',
    timestamp: new Date(Date.now() - 230000).toISOString(),
    status: 'Blocked',
    severity: 'high',
    overallReasoning: 'BLOCKED: Found 2 high-severity contradictions. The Maker hallucinated a 60-day return window when policy strictly mandates 14 days for electronics.',
    claims: [
      {
        id: 'c5',
        text: 'You have a generous 60-day return window from delivery to return items.',
        verdict: 'Contradicted',
        confidence: 0.99,
        sourceSentence: 'Standard Return Window: Customers can return most items within 30 days of delivery for a full refund.',
        sourceDocument: 'return_policy.txt',
        reasoning: 'Direct contradiction: Claim asserts 60 days, but policy specifies 30 days.'
      },
      {
        id: 'c6',
        text: 'Laptops and electronics have the same 60-day return window.',
        verdict: 'Contradicted',
        confidence: 0.98,
        sourceSentence: 'Exceptions to the 30-day window: Electronics must be returned within 14 days of delivery.',
        sourceDocument: 'return_policy.txt',
        reasoning: 'Severe policy contradiction: Electronics exception strictly enforces a 14-day cutoff.'
      }
    ],
    latencyMs: 290,
    makerLatencyMs: 120,
    judgeLatencyMs: 170
  },
  {
    id: 'msg-5',
    role: 'user',
    content: 'How much is express shipping and how fast will it arrive?',
    timestamp: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: 'msg-6',
    role: 'assistant',
    content: 'Express Shipping at NovaMart gets your order delivered within 2-3 business days. The cost for Express Shipping is $15.99 regardless of order value. We also offer free standard shipping on orders over $50.',
    originalDraft: 'Express Shipping at NovaMart gets your order delivered within 2-3 business days. The cost for Express Shipping is just $9.99 regardless of order value. We also offer free standard shipping on orders over $50.',
    finalResponse: 'Express Shipping at NovaMart gets your order delivered within 2-3 business days. The cost for Express Shipping is $15.99 regardless of order value. We also offer free standard shipping on orders over $50.',
    timestamp: new Date(Date.now() - 110000).toISOString(),
    status: 'Corrected',
    severity: 'low',
    overallReasoning: 'CORRECTED: Found 1 pricing error in draft ($9.99 vs $15.99). The Judge Agent corrected the express shipping rate to $15.99 and re-verified.',
    claims: [
      {
        id: 'c7',
        text: 'Express Shipping delivers within 2-3 business days.',
        verdict: 'Verified',
        confidence: 0.97,
        sourceSentence: 'Express orders arrive within 2-3 business days and cost $15.99 regardless of order value.',
        sourceDocument: 'shipping_policy.txt',
        reasoning: 'Transit time matches shipping policy specification.'
      },
      {
        id: 'c8',
        text: 'The cost for Express Shipping was originally drafted as $9.99 (auto-corrected to $15.99).',
        verdict: 'Contradicted',
        confidence: 0.96,
        sourceSentence: 'Express Shipping: ...cost $15.99 regardless of order value.',
        sourceDocument: 'shipping_policy.txt',
        reasoning: 'Draft stated $9.99, but official rate is $15.99. Automatically amended by Judge Agent.'
      },
      {
        id: 'c9',
        text: 'Free standard shipping on orders over $50.',
        verdict: 'Verified',
        confidence: 0.98,
        sourceSentence: 'Free Shipping: We offer free standard shipping on all orders over $50 (before taxes and after discounts).',
        sourceDocument: 'shipping_policy.txt',
        reasoning: 'Free shipping threshold verified.'
      }
    ],
    latencyMs: 380,
    makerLatencyMs: 130,
    judgeLatencyMs: 250
  }
];

export const mockMetrics: MetricData = {
  passRate: 76.5,
  correctionRate: 15.3,
  blockRate: 8.2,
  totalQueries: 142,
  totalClaims: 486,
  verifiedClaims: 388,
  unsupportedClaims: 64,
  contradictedClaims: 34,
  avgLatencyMs: 312,
  avgMakerLatencyMs: 135,
  avgJudgeLatencyMs: 177,
  driftData: [
    { time: '10:00', passRate: 88.0, correctionRate: 8.0, blockRate: 4.0, queryIndex: 20 },
    { time: '10:30', passRate: 84.5, correctionRate: 10.5, blockRate: 5.0, queryIndex: 50 },
    { time: '11:00', passRate: 80.2, correctionRate: 13.1, blockRate: 6.7, queryIndex: 85 },
    { time: '11:30', passRate: 77.0, correctionRate: 15.0, blockRate: 8.0, queryIndex: 115 },
    { time: '12:00', passRate: 76.5, correctionRate: 15.3, blockRate: 8.2, queryIndex: 142 }
  ]
};

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    filename: 'return_policy.txt',
    title: 'NovaMart Return Policy',
    chunkCount: 6,
    snippet: 'Standard 30-day return window. 14-day exception for electronics. Pre-paid label returns are free. Refunds processed in 5-7 business days.',
    uploadedAt: '2026-09-20'
  },
  {
    id: 'doc-2',
    filename: 'shipping_policy.txt',
    title: 'NovaMart Shipping Policy',
    chunkCount: 6,
    snippet: 'Standard delivery (5-7 business days, $5.99 or free over $50). Express Shipping (2-3 business days, $15.99 flat). Next Day Delivery ($24.99).',
    uploadedAt: '2026-09-20'
  },
  {
    id: 'doc-3',
    filename: 'product_warranty.txt',
    title: 'NovaMart Warranty & Repair',
    chunkCount: 5,
    snippet: '1-year manufacturer warranty for all electronics covering parts & labor. 90-day warranty on accessories. Accidental damage not covered.',
    uploadedAt: '2026-09-21'
  },
  {
    id: 'doc-4',
    filename: 'pricing.txt',
    title: 'NovaMart Pricing & Promotions',
    chunkCount: 5,
    snippet: 'Fixed pricing policy. No competitor price-matching guarantee offered. 10% student discount verified via StudentBeans. One promo code per order.',
    uploadedAt: '2026-09-22'
  },
  {
    id: 'doc-5',
    filename: 'customer_service.txt',
    title: 'NovaMart Support & Operations',
    chunkCount: 6,
    snippet: 'Live phone support Mon-Fri 8 AM - 8 PM EST. Email response within 24 hours. Dedicated escalation channel for disputed returns.',
    uploadedAt: '2026-09-23'
  }
];
