import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import {
  Compass,
  Layers,
  Eye,
  Cpu,
  FlaskConical,
  Download,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'workspace', label: 'Workspace', icon: Layers, badge: 'Core' },
  { id: 'bands', label: 'Band Studio', icon: Eye, badge: 'Multi-Band' },
  { id: 'reconstruction', label: 'Model Pipeline', icon: Cpu, badge: 'Pipeline' },
  { id: 'experiments', label: 'Experiments', icon: FlaskConical },
  { id: 'exports', label: 'Export Center', icon: Download }
];

export const LeftRail: React.FC = () => {
  const { activeTab, setActiveTab, isDark, toggleTheme, activeScene } = useApp();

  return (
    <aside className="w-60 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col justify-between select-none shrink-0 h-full">
      {/* Top Brand & Navigation */}
      <div className="flex flex-col min-h-0">
        {/* Project Branding */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-mono font-bold text-xs flex items-center justify-center shadow-sm">
              OG
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
                <span>OGTSR</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono truncate max-w-[130px]">
                Thermal Super-Res
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Research System
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-medium transition-all duration-150 interactive-hover ${
                  isActive
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[var(--bg-primary)]' : 'text-[var(--text-muted)]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] font-semibold'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls & Theme Toggle */}
      <div className="p-3 space-y-2 border-t border-[var(--border-subtle)]">
        {/* Research Context Snapshot */}
        <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>ACTIVE SCENE</span>
            <span className="text-[var(--text-primary)] font-medium">{activeScene.sensor}</span>
          </div>
          <div className="font-mono text-[10px] text-[var(--text-secondary)] truncate" title={activeScene.id}>
            {activeScene.id}
          </div>
          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono border-t border-[var(--border-subtle)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>30m Optical · ~100m TIR</span>
          </div>
        </div>

        {/* Theme Toggle Button Alone */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
            Interface Theme
          </span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-mono transition-all interactive-hover"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-600" />
                <span className="text-[10px]">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
