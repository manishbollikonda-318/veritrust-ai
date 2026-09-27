import { Link } from 'react-router-dom';
import NeuCard from '../ui/NeuCard';
import NeuButton from '../ui/NeuButton';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <NeuCard className="max-w-md w-full p-8 text-center bg-[#E8ECF1] space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert size={32} />
        </div>
        
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800">404</h1>
          <h2 className="text-lg font-bold text-gray-700 mt-1">Page Not Found</h2>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            The guardrail route you are attempting to access does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/chat">
            <NeuButton className="w-full flex items-center justify-center gap-2 !p-3.5 text-sm font-bold text-blue-600">
              <ArrowLeft size={16} /> Return to Live Chat
            </NeuButton>
          </Link>
        </div>
      </NeuCard>
    </div>
  );
}
