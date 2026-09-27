import { Message, Claim } from '../../types';
import StatusChip from './StatusChip';
import NeuCard from '../ui/NeuCard';
import { Bot, User, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isSelected?: boolean;
  onClaimClick?: (claim: Claim) => void;
  onMessageClick?: () => void;
}

export default function MessageBubble({
  message,
  isSelected,
  onClaimClick,
  onMessageClick
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[2px_2px_6px_rgba(79,70,229,0.35),-2px_-2px_6px_rgba(255,255,255,0.8)]'
              : 'bg-gradient-to-br from-[#F5F8FE] to-[#E5EDFA] shadow-[3px_3px_6px_rgba(165,183,212,0.4),-3px_-3px_6px_rgba(255,255,255,0.9)] text-accent border border-indigo-100/70'
          }`}
        >
          {isUser ? <User size={18} /> : <Bot size={18} className="text-accent" />}
        </div>

        {/* Content Box */}
        <div className="flex-1">
          {/* Header row for assistant */}
          {!isUser && (
            <div className="mb-2 flex items-center gap-3">
              {message.status && (
                <StatusChip status={message.status} onClick={onMessageClick} />
              )}
              {message.latencyMs && (
                <span className="text-xs text-ink-subtle font-bold flex items-center gap-1">
                  <Clock size={11} className="text-ink-subtle" />
                  {message.latencyMs}ms
                  {message.judgeLatencyMs ? (
                    <span className="text-accent font-extrabold">(Judge: +{message.judgeLatencyMs}ms)</span>
                  ) : ''}
                </span>
              )}
            </div>
          )}

          <NeuCard
            variant="maker"
            className={`p-5 !rounded-2xl transition-all w-full overflow-hidden ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 !shadow-[3px_3px_12px_rgba(79,70,229,0.35)] text-white border-0'
                : isSelected
                ? 'border-2 border-indigo-500/80 shadow-neu-maker-pressed bg-gradient-to-br from-[#EEF4FD] to-[#DFECFB]'
                : 'shadow-neu-maker bg-gradient-to-br from-[#F6F9FE] via-[#EDF3FC] to-[#E3EDFA] hover:border-indigo-200'
            }`}
          >
            <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${isUser ? 'text-white font-medium' : 'text-ink font-medium'}`}>
              {message.content}
            </p>

            {/* Claims tags with clear color-coded indicators */}
            {!isUser && message.claims && message.claims.length > 0 && (
              <div className="mt-4 pt-3 border-t border-indigo-200/50">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-black text-ink-subtle uppercase tracking-wider">
                    Extracted Claims Verified by Judge ({message.claims.length})
                  </p>
                  <button
                    type="button"
                    className="text-xs text-accent font-black cursor-pointer hover:underline"
                    onClick={onMessageClick}
                  >
                    View deep reasoning &rarr;
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.claims.map((claim) => (
                    <button
                      key={claim.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClaimClick?.(claim);
                      }}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer max-w-full font-bold ${
                        claim.verdict === 'Verified'
                          ? 'bg-emerald-50/90 text-positive-deep border border-emerald-300/60 hover:bg-emerald-100/90 shadow-[2px_2px_5px_rgba(16,185,129,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)]'
                          : claim.verdict === 'Unsupported'
                          ? 'bg-amber-50/90 text-caution-deep border border-amber-300/60 hover:bg-amber-100/90 shadow-[2px_2px_5px_rgba(245,158,11,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)]'
                          : 'bg-rose-50/90 text-critical-deep border border-rose-300/60 hover:bg-rose-100/90 shadow-[2px_2px_5px_rgba(244,63,94,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)]'
                      }`}
                    >
                      {claim.verdict === 'Verified' && <CheckCircle size={12} className="text-positive shrink-0" />}
                      {claim.verdict === 'Unsupported' && <AlertCircle size={12} className="text-caution shrink-0" />}
                      {claim.verdict === 'Contradicted' && <XCircle size={12} className="text-critical shrink-0" />}
                      <span className="truncate max-w-[280px] sm:max-w-[340px]">{claim.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </NeuCard>
        </div>
      </div>
    </div>
  );
}
