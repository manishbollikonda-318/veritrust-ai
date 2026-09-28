import { useState } from 'react';
import { Send, ShieldCheck, AlertCircle } from 'lucide-react';
import NeuInput from '../ui/NeuInput';
import NeuButton from '../ui/NeuButton';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  workspaceName?: string;
}

const MAX_CHAR_COUNT = 500;

export default function ChatInput({ onSend, disabled, workspaceName }: ChatInputProps) {
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
    /* Issue 10: the composer is centred and width-capped so the submit button
       stays visually attached to the field instead of drifting to the far edge
       of a very wide feed. */
    <div className="mt-auto w-full max-w-3xl mx-auto space-y-1.5">
      {error && (
        <div role="alert" className="flex items-center gap-1.5 text-xs text-critical font-semibold px-2 animate-fade-in">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3 relative">
        <div className="flex-1 min-w-0 relative">
          <NeuInput
            value={input}
            onChange={handleChange}
            placeholder={workspaceName
              ? `Ask anything about ${workspaceName} policies, returns, or procedures...`
              : "Ask anything about company policies, returns, or procedures..."
            }
            disabled={disabled}
            className="w-full pr-20"
            aria-label="Customer query input"
            aria-describedby="chat-input-counter"
          />
          <span
            id="chat-input-counter"
            aria-live="polite"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-subtle"
          >
            {input.length}/{MAX_CHAR_COUNT}
          </span>
        </div>

        <NeuButton
          type="submit"
          disabled={isActionDisabled}
          variant="accent"
          size="md"
          className="shrink-0 disabled:opacity-40"
        >
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Verify &amp; Send</span>
          <Send size={14} aria-hidden="true" className={input.trim() ? '' : 'opacity-50'} />
        </NeuButton>
      </form>
    </div>
  );
}
