"use client";

import React from "react";
import { Home, LineChart, Gift, User } from "lucide-react";

export type NavSection = "HOME" | "TRADES" | "REFERRAL" | "PROFILE";

interface BottomNavProps {
  active: NavSection;
  onSelect: (section: NavSection) => void;
  /** Small count badge, used for open positions on the Trades tab. */
  tradesBadge?: number;
  referralBadge?: number;
}

const ITEMS: { id: NavSection; Icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "HOME", Icon: Home, label: "Home" },
  { id: "TRADES", Icon: LineChart, label: "Trades" },
  { id: "REFERRAL", Icon: Gift, label: "Referral" },
  { id: "PROFILE", Icon: User, label: "Profile" },
];

/**
 * Icon-only bottom navigation.
 *
 * The accessible name still comes from `label`: the label is not rendered as
 * visible text, but it is announced to screen readers and shown on long press
 * via the title attribute.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  active,
  onSelect,
  tradesBadge = 0,
  referralBadge = 0,
}) => {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-800 bg-[#0d121c]/95 backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ id, Icon, label }) => {
          const isActive = active === id;
          const badge = id === "TRADES" ? tradesBadge : id === "REFERRAL" ? referralBadge : 0;

          return (
            <li key={id}>
              <button
                onClick={() => onSelect(id)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                title={label}
                className={`relative w-full py-2.5 flex flex-col items-center justify-center transition-colors active:scale-95 ${
                  isActive ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 inset-x-5 h-0.5 rounded-full bg-cyan-400" />
                )}
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute top-1.5 right-[22%] min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {/* Clearance so the last row of content is never hidden behind the bar */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};