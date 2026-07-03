"use client";

import { useState } from "react";
import type { Panel, Portfolio } from "@/app/page";

interface Props {
  activePanel: Panel;
  onPanelChange: (panel: Panel) => void;
  portfolios: Portfolio[];
  selectedPortfolioId: number | null;
  onSelectPortfolio: (id: number) => void;
}

const menuSections = [
  {
    label: "Markets",
    items: [
      { panel: "overview" as Panel, label: "Overview", icon: "◈" },
      { panel: "stocks" as Panel, label: "Equities", icon: "⬒" },
      { panel: "bonds" as Panel, label: "Bonds", icon: "⬗" },
      { panel: "crypto" as Panel, label: "Crypto", icon: "◉" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { panel: "indices" as Panel, label: "Indices", icon: "▤" },
      { panel: "tradinghours" as Panel, label: "Trading Hours", icon: "◷" },
      { panel: "watchlist" as Panel, label: "Watchlist", icon: "◉" },
    ],
  },
  {
    label: "Company",
    items: [
      { panel: "about" as Panel, label: "About", icon: "ℹ" },
      { panel: "mission" as Panel, label: "Mission", icon: "✦" },
    ],
  },
];

export function Sidebar({
  activePanel,
  onPanelChange,
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${
        collapsed ? "w-12" : "w-48"
      } bg-surface-1 border-r border-border-subtle flex flex-col overflow-hidden transition-all duration-200`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-8 flex items-center justify-center border-b border-border-subtle text-text-tertiary hover:text-text-secondary transition-colors text-[10px]"
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuSections.map((section) => (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[9px] text-text-tertiary uppercase tracking-[0.12em] font-semibold">
                {section.label}
              </div>
            )}
            {section.items.map((item) => (
              <button
                key={item.panel}
                onClick={() => onPanelChange(item.panel)}
                title={collapsed ? item.label : undefined}
                className={`w-full text-left flex items-center gap-2.5 transition-all duration-150 ${
                  collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-1.5"
                } ${
                  activePanel === item.panel
                    ? "bg-accent-green/10 text-accent-green border-r-2 border-accent-green"
                    : "text-text-tertiary hover:bg-surface-2 hover:text-text-secondary border-r-2 border-transparent"
                }`}
              >
                <span className="text-sm leading-none">{item.icon}</span>
                {!collapsed && (
                  <span className="text-[11px] font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        {/* Portfolio section */}
        {!collapsed && (
          <div className="px-3 py-1.5 mt-2 text-[9px] text-text-tertiary uppercase tracking-[0.12em] font-semibold">
            Portfolio
          </div>
        )}
        {!collapsed &&
          portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPortfolio(p.id)}
              className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2.5 transition-all duration-150 ${
                selectedPortfolioId === p.id && activePanel === "portfolio"
                  ? "bg-accent-green/10 text-accent-green border-r-2 border-accent-green"
                  : "text-text-tertiary hover:bg-surface-2 hover:text-text-secondary border-r-2 border-transparent"
              }`}
            >
              <span className="text-xs">●</span>
              <span className="truncate font-medium">{p.name}</span>
            </button>
          ))}
        {collapsed &&
          portfolios.length > 0 && (
            <button
              onClick={() => {
                if (portfolios[0]) onSelectPortfolio(portfolios[0].id);
              }}
              title="Portfolio"
              className="w-full flex justify-center py-2.5 text-text-tertiary hover:text-accent-green transition-colors"
            >
              <span className="text-sm">●</span>
            </button>
          )}

        {/* Portfolio quick action when collapsed */}
        {collapsed && (
          <div className="mt-auto">
            <button
              onClick={() => onPanelChange("portfolio")}
              className="w-full flex justify-center py-3 text-text-tertiary hover:text-accent-green transition-colors border-t border-border-subtle"
              title="Portfolio"
            >
              <span className="text-base">💼</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer hint */}
      {!collapsed && (
        <div className="p-2 border-t border-border-subtle text-[9px] text-text-tertiary leading-relaxed">
          <div>SOKO Terminal v2.0</div>
          <div>Nairobi, Kenya</div>
        </div>
      )}
    </div>
  );
}
