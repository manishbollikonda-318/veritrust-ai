import { NavLink, Link } from 'react-router-dom';
import {
  MessageSquare, BarChart2, BookOpen, GitCompare, Shield,
  Lock, FileText, Code2, PanelLeftClose, PanelLeftOpen, X, UserCheck
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 shadow-[3px_3px_8px_rgba(79,70,229,0.35),-2px_-2px_6px_rgba(255,255,255,0.8)] flex items-center justify-center text-white font-extrabold text-xl group-hover:scale-105 transition-transform shrink-0">
              <Shield size={22} className="text-white" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 overflow-hidden">
                <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none truncate">
                  VeriTrust AI
                </h1>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1 truncate">
                  Dual-Agent Guardrail
                </p>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={closeMobile}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/60 md:hidden shrink-0"
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

          {/* Desktop/Tablet Collapse Toggle button */}
          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white/80 transition-colors shadow-sm"
              title="Collapse sidebar (reclaim workspace)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        {/* Desktop Collapsed Rail Expand Button */}
        {isCollapsed && !isMobileOpen && (
          <div className="hidden md:flex justify-center mb-6">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white/90 transition-colors shadow-[3px_3px_7px_rgba(165,180,205,0.4),-3px_-3px_7px_rgba(255,255,255,0.9)]"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

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
                      ? 'shadow-[inset_3px_3px_6px_rgba(165,180,205,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] text-indigo-700 bg-[#E2E9F4] border-l-4 border-indigo-600'
                      : 'text-slate-700 hover:text-indigo-700 hover:shadow-[4px_4px_10px_rgba(165,180,205,0.4),-4px_-4px_10px_rgba(255,255,255,0.8)]'
                  }`
                }
              >
                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {(!isCollapsed || isMobileOpen) && (item as any).badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                    {(item as any).badge}
                  </span>
                )}

                {/* Floating tooltip on hover when collapsed */}
                {isRail && (
                  <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer & Compliance Status */}
        <div className={`mt-auto pt-4 border-t border-slate-300/60 text-[11px] ${
          isCollapsed && !isMobileOpen ? 'text-center' : 'space-y-3'
        }`}>
          {/* Status indicator */}
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                Guardrail Engine
              </span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 border border-emerald-300/60 px-2 py-0.5 rounded-full shadow-xs">
                Active
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="Guardrail Engine: Active">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
            </div>
          )}

          {/* Links */}
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center justify-between text-slate-500 pt-1 text-[10px] font-semibold">
              <Link to="/privacy" onClick={closeMobile} className="hover:text-indigo-600 flex items-center gap-1">
                <Lock size={10} /> Privacy
              </Link>
              <span className="text-slate-400">|</span>
              <Link to="/terms" onClick={closeMobile} className="hover:text-indigo-600 flex items-center gap-1">
                <FileText size={10} /> Terms
              </Link>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-bold">v1.0.0</span>
            </div>
          ) : (
            <div className="pt-2 text-[9px] font-bold text-slate-500">
              v1.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
