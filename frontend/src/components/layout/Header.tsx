import React from 'react';
import { ShieldCheck, Cpu, Building2, Menu, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSidebar } from '../../context/SidebarContext';
import { openDataSourceDisclosure } from '../ui/DataSourceDisclosureModal';

export default function Header() {
  const { currentWorkspace, setCurrentWorkspace, workspaces } = useWorkspace();
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();

  return (
    <header className="h-16 sm:h-20 w-full flex items-center justify-between px-3 sm:px-6 lg:px-8 bg-[#EEF2F8]/80 sticky top-0 z-30 backdrop-blur-md border-b border-slate-200/70">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobile}
          className="p-2 -ml-1 text-slate-700 hover:text-indigo-600 hover:bg-white/70 rounded-xl transition-colors md:hidden shrink-0"
          title="Open Navigation"
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* Desktop Quick Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-2 text-slate-600 hover:text-indigo-600 hover:bg-white/70 rounded-xl transition-colors shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight truncate">
          VeriTrust Guardrail
        </h2>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-[2px_2px_6px_rgba(99,102,241,0.15),-2px_-2px_6px_rgba(255,255,255,0.9)] shrink-0">
          <Cpu size={12} className="text-indigo-600" />
          Maker &amp; Judge Engine
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Demo Disclosure Quick Button */}
        <button
          type="button"
          onClick={() => openDataSourceDisclosure()}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-br from-[#F5F8FD] to-[#E6EDF8] shadow-neu-maker hover:shadow-neu-maker-pressed border border-indigo-100/70 text-[11px] font-bold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
          title="Read Data Source & Synthetic Baseline Disclosure"
        >
          <Sparkles size={12} className="text-indigo-500" />
          <span>Demo Info</span>
        </button>

        {/* Workspace Quick Switcher */}
        <div className="bg-gradient-to-br from-[#F4F7FC] to-[#E6EDF7] shadow-[inset_2px_2px_5px_rgba(165,180,205,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/60 px-2.5 sm:px-3 py-1.5 rounded-2xl flex items-center gap-1.5 sm:gap-2">
          <Building2 size={13} className="text-indigo-500 shrink-0" />
          <select
            value={currentWorkspace}
            onChange={(e) => setCurrentWorkspace(e.target.value)}
            aria-label="Active Enterprise Workspace"
            className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[125px] sm:max-w-none truncate"
          >
            <option value="default">NovaMart Retail (Demo)</option>
            <option value="custom">Custom Company</option>
            {workspaces
              .filter(w => w !== 'default' && w !== 'custom')
              .map(w => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
          </select>
        </div>

        {/* System Health Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-br from-[#F4F9F6] to-[#E4F2EC] shadow-[3px_3px_8px_rgba(158,192,180,0.4),-3px_-3px_8px_rgba(255,255,255,0.9)] border border-emerald-200/60 text-xs font-extrabold text-emerald-900 shrink-0">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>Interception Active</span>
        </div>
      </div>
    </header>
  );
}
