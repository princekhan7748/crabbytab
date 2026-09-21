"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTournament } from "@/contexts/TournamentContext";
import {
  LayoutDashboard,
  Shuffle,
  Users2,
  FileCheck2,
  Trophy,
  Award,
  Lightbulb,
  UserCheck,
  Building2,
  MapPin,
  MessageSquareHeart,
  BarChart3,
  Sliders,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

export function Sidebar({ tournamentSlug }: { tournamentSlug: string }) {
  const pathname = usePathname();
  const { activeRound, rounds, debates, ballots, teams, adjudicators } = useTournament();

  const roundDebates = activeRound ? debates.filter((d) => d.roundId === activeRound.id) : [];
  const confirmedBallots = activeRound
    ? ballots.filter((b) => b.roundId === activeRound.id && b.confirmed)
    : [];

  const navItems = [
    {
      label: "Dashboard",
      href: `/${tournamentSlug}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Draw & Matchups",
      href: `/${tournamentSlug}/draw`,
      icon: Shuffle,
      badge: roundDebates.length > 0 ? `${roundDebates.length}` : undefined,
    },
    {
      label: "Adjudicator Allocation",
      href: `/${tournamentSlug}/allocation`,
      icon: Users2,
    },
    {
      label: "Results & Ballots",
      href: `/${tournamentSlug}/results`,
      icon: FileCheck2,
      badge: roundDebates.length > 0 ? `${confirmedBallots.length}/${roundDebates.length}` : undefined,
      badgeColor:
        confirmedBallots.length === roundDebates.length && roundDebates.length > 0
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800",
    },
    {
      label: "Standings & Tab",
      href: `/${tournamentSlug}/standings`,
      icon: Trophy,
    },
    {
      label: "Break & Out-Rounds",
      href: `/${tournamentSlug}/break`,
      icon: Award,
    },
    {
      label: "Motions",
      href: `/${tournamentSlug}/motions`,
      icon: Lightbulb,
    },
    {
      label: "Participants",
      href: `/${tournamentSlug}/participants`,
      icon: UserCheck,
      badge: `${teams.length} teams`,
    },
    {
      label: "Check-ins",
      href: `/${tournamentSlug}/checkins`,
      icon: Clock,
    },
    {
      label: "Venues",
      href: `/${tournamentSlug}/venues`,
      icon: MapPin,
    },
    {
      label: "Judge Feedback",
      href: `/${tournamentSlug}/feedback`,
      icon: MessageSquareHeart,
    },
    {
      label: "Analytics",
      href: `/${tournamentSlug}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Configuration",
      href: `/${tournamentSlug}/config`,
      icon: Sliders,
    },
  ];

  return (
    <aside className="w-64 bg-[#f6f8fa] border-r border-[#d0d7de] flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      {/* Current Round Indicator Box */}
      <div className="p-3 border-b border-[#d0d7de] bg-white">
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Active Round Context
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 text-sm">
            {activeRound ? activeRound.name : "No round active"}
          </span>
          {activeRound && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                activeRound.drawStatus === "confirmed"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : activeRound.drawStatus === "draft"
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300"
              }`}
            >
              {activeRound.drawStatus === "confirmed"
                ? "Confirmed"
                : activeRound.drawStatus === "draft"
                ? "Draft Draw"
                : "No Draw"}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600 pl-[9px]"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    item.badgeColor || "bg-gray-200 text-gray-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#d0d7de] bg-white text-[11px] text-gray-500 flex items-center justify-between">
        <span>CrabbyTab v1.0 (Serverless)</span>
        <span className="flex items-center space-x-1 text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Online</span>
        </span>
      </div>
    </aside>
  );
}
