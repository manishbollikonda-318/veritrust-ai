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
      className="p-6 flex flex-col justify-between transition-all bg-gradient-to-br from-[#F7F9FD] via-[#EFF3FA] to-[#E5EDF7] shadow-neu-maker min-h-[380px] relative overflow-hidden border border-indigo-100/60 hover:shadow-xl duration-200"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-sm shrink-0 mt-0.5">
              <FileText size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug break-normal">
                  {document.title}
                </h3>
                {isDemoDoc && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100/90 text-blue-800 border border-blue-200/80 shrink-0 mt-0.5">
                    Sample Data
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-indigo-800 font-extrabold mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 truncate max-w-[220px]" title={document.filename}>
                  <Database size={12} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{document.filename || 'Source Doc'}</span>
                </span>
                {document.chunkCount !== undefined && (
                  <span className="flex items-center gap-1 text-indigo-700 shrink-0">
                    <Layers size={12} />
                    {document.chunkCount} chunks
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
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  title="Delete document"
                  aria-label="Delete document"
                  onClick={() => onDelete(document)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#F0F4FC] to-[#E3EBF7] shadow-neu-maker-pressed p-4 sm:p-5 rounded-2xl text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans min-h-[145px] max-h-64 overflow-y-auto border border-indigo-100/60 my-2">
          {expanded ? (
            <div className="whitespace-pre-line space-y-2 font-bold text-slate-900 leading-relaxed">
              {document.content || document.snippet}
            </div>
          ) : (
            <p className="line-clamp-6 italic text-slate-900 font-bold leading-relaxed">
              "{document.snippet || document.content?.slice(0, 320)}"
            </p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-indigo-200/50 flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-black text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} /> Collapse Document
            </>
          ) : (
            <>
              <ChevronDown size={14} /> View Full Policy Context
            </>
          )}
        </button>

        <span className="text-xs text-slate-700 font-bold">
          {document.uploadedAt || 'Ground Truth'}
        </span>
      </div>
    </NeuCard>
  );
}
