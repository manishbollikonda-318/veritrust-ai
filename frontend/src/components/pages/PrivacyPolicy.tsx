import NeuCard from '../ui/NeuCard';
import { Shield, Lock, Eye, Database, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/chat" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Live Chat
        </Link>
      </div>

      <NeuCard className="p-8 bg-[#E8ECF1]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-300 border-opacity-40">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">VeriTrust AI — Privacy Policy</h1>
            <p className="text-xs text-gray-500">Effective Date: September 2026 | Enterprise Compliance Standard</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              1. Real-Time Guardrail Data Architecture
            </h2>
            <p>
              VeriTrust AI operates as an in-line, real-time compliance filter intercepting customer queries and generative AI draft responses. Customer prompts and generated drafts are evaluated in volatile memory during the verification cycle and are never sold, rented, or utilized for unauthorized third-party model retraining.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" />
              2. Ephemeral Processing & PII Protection
            </h2>
            <p>
              All claim decomposition and entailment scoring are executed against the enterprise's verified knowledge base. Personal Identifiable Information (PII) detected within customer inquiries can be masked before vector retrieval, ensuring compliance with GDPR Article 25 (Data Protection by Design and Default).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Database size={16} className="text-blue-600" />
              3. Telemetry & Audit Logs
            </h2>
            <p>
              Telemetry metrics (such as verification pass rates, auto-correction frequencies, and detected contradiction categories) are aggregated anonymously for compliance drift analysis and system health monitoring.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2">4. Contact & Compliance Officer</h2>
            <p>
              For security questionnaires, data processing agreements (DPA), or compliance audits, contact our compliance engineering team at <span className="font-semibold text-blue-700">compliance@veritrust.ai</span>.
            </p>
          </section>
        </div>
      </NeuCard>
    </div>
  );
}
