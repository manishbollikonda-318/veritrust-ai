import { useState } from 'react';
import { Send, ShieldCheck, AlertCircle } from 'lucide-react';
import NeuInput from '../ui/NeuInput';
import NeuButton from '../ui/NeuButton';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const MAX_CHAR_COUNT = 500;

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isCooldown, setIsCooldown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError('Please enter a query or select a staged scenario.');
      return;
    }

    if (trimmed.length > MAX_CHAR_COUNT) {
      setError(`Query exceeds ${MAX_CHAR_COUNT} characters.`);
      return;
    }

    if (!disabled && !isCooldown) {
      setError(null);
      setIsCooldown(true);
      onSend(trimmed);
      setInput('');

      // 600ms cooldown to prevent accidental rapid double submission spam
      setTimeout(() => {
        setIsCooldown(false);
      }, 600);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHAR_COUNT) {
      setInput(val);
      if (error) setError(null);
    }
  };

  const isActionDisabled = disabled || isCooldown || !input.trim();

  return (
    <div className="mt-auto space-y-1.5">
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold px-2 animate-fade-in">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3 relative">
        <div className="flex-1 relative">
          <NeuInput
            value={input}
            onChange={handleChange}
            placeholder="Ask anything about NovaMart returns, shipping, or warranty..."
            disabled={disabled}
            className="w-full pr-16"
            aria-label="Customer query input"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">
            {input.length}/{MAX_CHAR_COUNT}
          </span>
        </div>

        <NeuButton
          type="submit"
          disabled={isActionDisabled}
          className="!px-5 !py-3.5 !rounded-2xl flex items-center gap-2 text-xs font-bold text-blue-600 disabled:opacity-40 shrink-0"
        >
          <ShieldCheck size={16} />
          <span>Verify &amp; Send</span>
          <Send size={14} className={input.trim() ? 'text-blue-600' : 'text-gray-400'} />
        </NeuButton>
      </form>
    </div>
  );
}
