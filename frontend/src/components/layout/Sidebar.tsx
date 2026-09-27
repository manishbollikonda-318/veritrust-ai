import { NavLink, Link } from 'react-router-dom';
import {
  MessageSquare, BarChart2, BookOpen, GitCompare, Shield,
  Lock, FileText, Code2, X, UserCheck
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const navItems = [
  { path: '/chat', label: 'Live Guardrail', icon: MessageSquare },
  { path: '/comparison', label: 'Maker vs Judge', icon: GitCompare },
  { path: '/review', label: 'Human Review', icon: UserCheck, badge: '3' },
  { path: '/metrics', label: 'Telemetry & Drift', icon: BarChart2 },
  { path: '/knowledge', label: 'Ground Truth KB', icon: BookOpen },
  { path: '/integration', label: 'API & Gateway', icon: Code2 },
];

export default function Sidebar() {
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="app-sidebar"
        aria-label="Primary"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-gradient-to-b from-[#E6ECF5] via-[#DFE6F1] to-[#D8E1ED] transition-all duration-300 ease-in-out flex flex-col border-r border-slate-300/60 shadow-[6px_0_18px_rgba(165,180,205,0.45)]
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${!isMobileOpen ? (isCollapsed ? 'md:w-20' : 'md:w-64') : ''}
          ${isCollapsed && !isMobileOpen ? 'px-3 py-5' : 'p-6'}
        `}
      >
        {/* Top Header / Branding & Toggle Button */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/chat"
            onClick={closeMobile}
            className={`flex items-center gap-3 group min-w-0 ${
              isCollapsed && !isMobileOpen ? 'justify-center w-full' : ''
            }`}
            title="VeriTrust AI Dashboard"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 shadow-[3px_3px_8px_rgba(79,70,229,0.35),-2px_-2px_6px_rgba(255,255,255,0.8)] flex items-center justify-center text-onaccent font-extrabold text-xl group-hover:scale-105 transition-transform shrink-0">
              <Shield size={22} className="text-onaccent" aria-hidden="true" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 overflow-hidden">
                <h1 className="text-lg font-black text-ink tracking-tight leading-none truncate">
                  VeriTrust AI
                </h1>
                {/* 10px was unreadable: raised to the 12px floor used app-wide. */}
                <p className="text-xs font-bold text-accent uppercase tracking-wide mt-1 truncate">
                  Dual-Agent Guardrail
                </p>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={closeMobile}
            className="p-2 rounded-xl text-ink-subtle hover:text-ink hover:bg-white/60 md:hidden shrink-0"
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop/Tablet: the collapse toggle lives in the sticky header only
            (aria-controls="app-sidebar"), so it is intentionally not repeated here. */}

        {/* No rail expand button: the sticky header control (aria-controls="app-sidebar")
            is the single collapse/expand affordance at every width, so it is not
            duplicated here when the rail is collapsed. */}

        {/* Navigation items */}
        <nav className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-0.5">
          {navItems.map((item) => {
            const isRail = isCollapsed && !isMobileOpen;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                title={isRail ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-2xl font-bold text-xs transition-all duration-200 group relative ${
                    isRail ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'shadow-[inset_3px_3px_6px_rgba(165,180,205,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] text-accent-strong bg-[#E2E9F4] border-l-4 border-accent'
                      : 'text-ink-muted hover:text-accent hover:shadow-[4px_4px_10px_rgba(165,180,205,0.4),-4px_-4px_10px_rgba(255,255,255,0.8)]'
                  }`
                }
              >
                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {(!isCollapsed || isMobileOpen) && (item as any).badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-onaccent shadow-xs">
                    {(item as any).badge}
                  </span>
                )}

                {/* Floating tooltip on hover when collapsed */}
                {isRail && (
                  <span role="tooltip" className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-onaccent text-xs font-bold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer & Compliance Status */}
        <div className={`mt-auto pt-4 border-t border-slate-300/60 text-xs ${
          isCollapsed && !isMobileOpen ? 'text-center' : 'space-y-3'
        }`}>
          {/* Status indicator */}
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center justify-between text-ink-muted font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" aria-hidden="true" />
                Guardrail Engine
              </span>
              <span className="text-xs font-extrabold text-positive-deep bg-emerald-100/80 border border-emerald-300/60 px-2 py-0.5 rounded-full shadow-xs">
                Active
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="Guardrail Engine: Active">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" aria-hidden="true" />
            </div>
          )}

          {/* Links */}
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center justify-between text-ink-subtle pt-1 text-xs font-semibold">
              <Link to="/privacy" onClick={closeMobile} className="hover:text-accent flex items-center gap-1">
                <Lock size={12} aria-hidden="true" /> Privacy
              </Link>
              <span className="text-ink-subtle" aria-hidden="true">|</span>
              <Link to="/terms" onClick={closeMobile} className="hover:text-accent flex items-center gap-1">
                <FileText size={12} aria-hidden="true" /> Terms
              </Link>
              <span className="text-ink-subtle" aria-hidden="true">|</span>
              <span className="text-ink-subtle font-bold">v1.0.0</span>
            </div>
          ) : (
            <div className="pt-2 text-xs font-bold text-ink-subtle">
              v1.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
