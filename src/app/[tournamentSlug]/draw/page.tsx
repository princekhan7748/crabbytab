"use client";

import React, { useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import { SideBadge } from "@/components/ui/SideBadge";
import {
  Shuffle,
  Users2,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
  Unlock,
  Settings2,
  Sparkles,
  MapPin,
  Search,
} from "lucide-react";
import { DebateSide } from "@/types";

export default function DrawPage() {
  const {
    tournament,
    activeRound,
    rounds,
    setActiveRound,
    debates,
    generateDraw,
    autoAllocate,
    updateRound,
    updateDebate,
  } = useTournament();

  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);

  const isBP = tournament?.format === "bp";
  const roundDebates = activeRound ? debates.filter((d) => d.roundId === activeRound.id) : [];

  const filteredDebates = roundDebates.filter((d) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const venueMatch = (d.venueName || "").toLowerCase().includes(query);
    const chairMatch = (d.adjudicators?.chairName || "").toLowerCase().includes(query);
    const teamMatch = Object.values(d.teams).some((t) => (t?.teamName || "").toLowerCase().includes(query));
    return venueMatch || chairMatch || teamMatch;
  });

  const handleGenerate = async () => {
    if (!activeRound) return;
    if (roundDebates.length > 0) {
      if (!confirm("A draw already exists for this round. Regenerating will overwrite all current matchups and room assignments. Proceed?")) {
        return;
      }
    }
    setIsGenerating(true);
    try {
      await generateDraw(activeRound.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoAllocate = async () => {
    if (!activeRound || roundDebates.length === 0) return;
    setIsAllocating(true);
    try {
      await autoAllocate(activeRound.id, 1);
    } finally {
      setIsAllocating(false);
    }
  };

  const toggleReleaseDraw = async () => {
    if (!activeRound) return;
    const updated = {
      ...activeRound,
      drawStatus: (activeRound.drawStatus === "confirmed" ? "draft" : "confirmed") as any,
    };
    await updateRound(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="border-b border-[#d0d7de] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Shuffle className="w-6 h-6 text-blue-600" />
            <span>Draw & Matchups</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate Swiss / power-paired debate pairings and manage room allocations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !activeRound}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Generating..." : "Generate Draw"}</span>
          </button>

          <button
            onClick={handleAutoAllocate}
            disabled={isAllocating || roundDebates.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>{isAllocating ? "Allocating..." : "Auto-Allocate Judges"}</span>
          </button>

          <button
            onClick={toggleReleaseDraw}
            disabled={roundDebates.length === 0}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold border transition disabled:opacity-50 ${
              activeRound?.drawStatus === "confirmed"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }`}
          >
            {activeRound?.drawStatus === "confirmed" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Draw Released to Public</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Release Draw to Public</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded text-xs transition"
            title="Print Draw Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Round Selector Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
          Select Round:
        </span>
        {rounds.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRound(r)}
            className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
              activeRound?.id === r.id
                ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Search Filter */}
      {roundDebates.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search team, venue, or judge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-gray-500">
            Showing {filteredDebates.length} of {roundDebates.length} debates
          </span>
        </div>
      )}

      {/* Debates List */}
      {roundDebates.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-10 text-center">
          <Shuffle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 mb-1">No Draw Generated for {activeRound?.name}</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
            Generate pairings based on Swiss Swiss / power-paired brackets and minimal institutional clash rules.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition"
          >
            <Shuffle className="w-4 h-4" />
            <span>Generate {activeRound?.name} Draw</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDebates.map((debate, dIdx) => (
            <div
              key={debate.id}
              className="bg-white border border-[#d0d7de] rounded-lg shadow-2xs hover:border-blue-400 transition overflow-hidden"
            >
              {/* Room Header */}
              <div className="bg-[#f6f8fa] px-4 py-2.5 border-b border-[#d0d7de] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{debate.venueName || `Room ${dIdx + 1}`}</span>
                  </div>
                  {debate.bracket !== undefined && debate.bracket > 0 && (
                    <span className="text-[10px] font-semibold bg-gray-200 text-gray-700 px-2 py-0.2 rounded">
                      Bracket: {debate.bracket} pts
                    </span>
                  )}
                </div>

                {/* Chair Info */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500 font-medium">Chair:</span>
                  {debate.adjudicators?.chairName ? (
                    <span className="font-bold text-gray-900 bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                      {debate.adjudicators.chairName}
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold text-[11px] italic">No Chair Allocated</span>
                  )}
                </div>
              </div>

              {/* Matchup Grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {isBP ? (
                  <>
                    <div className="p-2.5 rounded bg-rose-50/50 border border-rose-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <SideBadge side="OG" />
                      </div>
                      <div className="font-bold text-gray-900 text-sm">
                        {debate.teams?.OG?.teamName || "—"}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-sky-50/50 border border-sky-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <SideBadge side="OO" />
                      </div>
                      <div className="font-bold text-gray-900 text-sm">
                        {debate.teams?.OO?.teamName || "—"}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-amber-50/50 border border-amber-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <SideBadge side="CG" />
                      </div>
                      <div className="font-bold text-gray-900 text-sm">
                        {debate.teams?.CG?.teamName || "—"}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-purple-50/50 border border-purple-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <SideBadge side="CO" />
                      </div>
                      <div className="font-bold text-gray-900 text-sm">
                        {debate.teams?.CO?.teamName || "—"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded bg-emerald-50/50 border border-emerald-200 md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <SideBadge side="AFF" />
                      </div>
                      <div className="font-bold text-gray-900 text-base">
                        {debate.teams?.AFF?.teamName || "—"}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-slate-50 border border-slate-200 md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <SideBadge side="NEG" />
                      </div>
                      <div className="font-bold text-gray-900 text-base">
                        {debate.teams?.NEG?.teamName || "—"}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Panellists and Trainees if present */}
              {((debate.adjudicators?.panellistNames?.length || 0) > 0 ||
                (debate.adjudicators?.traineeNames?.length || 0) > 0) && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  {debate.adjudicators?.panellistNames?.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-700 mr-1">Panellists:</span>
                      <span>{debate.adjudicators.panellistNames.join(", ")}</span>
                    </div>
                  )}
                  {debate.adjudicators?.traineeNames?.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-700 mr-1">Trainees:</span>
                      <span className="italic">{debate.adjudicators.traineeNames.join(", ")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
