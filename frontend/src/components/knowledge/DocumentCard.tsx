import { useState } from 'react';
import { Document } from '../../types';
import NeuCard from '../ui/NeuCard';
import { FileText, Layers, ChevronDown, ChevronUp, Database, Edit3, Trash2 } from 'lucide-react';

interface DocumentCardProps {
  document: Document;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  isReadOnly?: boolean;
  isDemoDoc?: boolean;
}

export default function DocumentCard({ document, onEdit, onDelete, isReadOnly = false, isDemoDoc = false }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <NeuCard
      className="p-6 sm:p-7 flex flex-col justify-between transition-all bg-gradient-to-br from-[#F7F9FD] via-[#EFF3FA] to-[#E5EDF7] shadow-neu-maker min-h-[360px] h-full relative border border-indigo-100/70 hover:shadow-xl duration-200"
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-sm shrink-0 mt-0.5">
              <FileText size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-snug break-words hyphens-none">
                  {document.title}
                </h3>
                {isDemoDoc && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 shrink-0 mt-0.5">
                    Sample Data
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-indigo-900 font-extrabold flex-wrap">
                <span className="flex items-center gap-1.5" title={document.filename}>
                  <Database size={13} className="text-indigo-600 shrink-0" />
                  <span className="break-all">{document.filename || 'Source Doc'}</span>
                </span>
                {document.chunkCount !== undefined && (
                  <span className="flex items-center gap-1 text-indigo-800 shrink-0 bg-indigo-100/70 px-2 py-0.5 rounded-md border border-indigo-200/60">
                    <Layers size={12} />
                    {document.chunkCount} indexed chunks
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  title="Edit document"
                  aria-label="Edit document"
                  onClick={() => onEdit(document)}
                  className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  title="Delete document"
                  aria-label="Delete document"
                  onClick={() => onDelete(document)}
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dynamic, auto-adjusting policy content box */}
        <div className="bg-gradient-to-br from-[#F0F4FC] to-[#E3EBF7] shadow-neu-maker-pressed p-4 sm:p-5 rounded-2xl text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans min-h-[130px] max-h-[340px] overflow-y-auto border border-indigo-200/70 my-2 flex-1 transition-all duration-200">
          {expanded ? (
            <div className="whitespace-pre-line space-y-2.5 font-bold text-slate-900 leading-relaxed text-xs sm:text-[13px]">
              {document.content || document.snippet}
            </div>
          ) : (
            <div className="italic text-slate-950 font-bold leading-relaxed line-clamp-6 text-xs sm:text-[13px]">
              "{document.snippet || (document.content && document.content.length > 380 ? `${document.content.slice(0, 380)}...` : document.content)}"
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-indigo-200/60 flex items-center justify-between mt-3 gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-black text-indigo-700 hover:text-indigo-950 flex items-center gap-1.5 cursor-pointer py-1"
        >
          {expanded ? (
            <>
              <ChevronUp size={15} /> Collapse View
            </>
          ) : (
            <>
              <ChevronDown size={15} /> View Full Policy ({document.content?.length || document.snippet?.length || 0} chars)
            </>
          )}
        </button>

        <span className="text-xs text-slate-800 font-extrabold">
          {document.uploadedAt ? `Indexed ${document.uploadedAt}` : 'Ground Truth Active'}
        </span>
      </div>
    </NeuCard>
  );
}
