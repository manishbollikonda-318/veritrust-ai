import NeuCard from '../ui/NeuCard';
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
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
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">VeriTrust AI — Terms & Conditions</h1>
            <p className="text-xs text-gray-500">Service Level & Guardrail SLA Guidelines (2026)</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              1. Acceptance of Guardrail Service
            </h2>
            <p>
              By accessing the VeriTrust AI compliance platform and APIs, enterprise administrators agree to deploy the dual-agent Maker & Judge guardrail in accordance with applicable consumer protection and AI safety regulations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" />
              2. Ground Truth Knowledge Base Responsibility
            </h2>
            <p>
              The verification accuracy of the Judge Agent relies on the ground-truth corporate policy documentation provided to the system. Enterprises are responsible for ensuring uploaded manuals, warranties, and pricing policies reflect current operational rules.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              3. Service Limitations & Defense-in-Depth
            </h2>
            <p>
              VeriTrust AI is designed as a defense-in-depth safety layer to dramatically reduce hallucination risk. For critical high-severity escalations flagged by the Judge Agent, human-in-the-loop review workflows should be maintained.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-2">4. Governing Law</h2>
            <p>
              These terms are governed by standard enterprise SaaS standards and AI accountability frameworks.
            </p>
          </section>
        </div>
      </NeuCard>
    </div>
  );
}
