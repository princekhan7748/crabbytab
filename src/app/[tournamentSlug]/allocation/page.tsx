"use client";

import React, { useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import { Adjudicator, Debate, Team } from "@/types";
import { calculateAdjDebateConflict } from "@/lib/draw/allocator";
import {
  Users2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  UserPlus,
  ShieldAlert,
  Search,
  ArrowRightLeft,
} from "lucide-react";

export default function AllocationPage() {
  const {
    tournament,
    activeRound,
    rounds,
    setActiveRound,
    debates,
    adjudicators,
    teams,
    autoAllocate,
    updateDebate,
  } = useTournament();

  const [searchQuery, setSearchQuery] = useState("");
  const [panelSize, setPanelSize] = useState<number>(1);
  const [isAllocating, setIsAllocating] = useState(false);
  const [selectedAdjForManual, setSelectedAdjForManual] = useState<Adjudicator | null>(null);

  const roundDebates = activeRound ? debates.filter((d) => d.roundId === activeRound.id) : [];

  const teamsMap = new Map<string, Team>();
  teams.forEach((t) => teamsMap.set(t.id, t));

  // Determine which adjudicators are currently assigned in this round
  const assignedAdjIds = new Set<string>();
  roundDebates.forEach((d) => {
    if (d.adjudicators?.chairId) assignedAdjIds.add(d.adjudicators.chairId);
    (d.adjudicators?.panellistIds || []).forEach((id) => assignedAdjIds.add(id));
    (d.adjudicators?.traineeIds || []).forEach((id) => assignedAdjIds.add(id));
  });

  const availableAdjs = adjudicators.filter((a) => !assignedAdjIds.has(a.id));

  const filteredAdjs = availableAdjs.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.institutionName || "").toLowerCase().includes(q)
    );
  });

  // Assign Chair to Debate
  const assignChair = async (debateId: string, adj: Adjudicator) => {
    const debate = roundDebates.find((d) => d.id === debateId);
    if (!debate) return;

    // Remove adj if they were somewhere else
    const updatedDebate: Debate = {
      ...debate,
      adjudicators: {
        ...debate.adjudicators,
        chairId: adj.id,
        chairName: adj.name,
      },
    };
    await updateDebate(updatedDebate);
    setSelectedAdjForManual(null);
  };

  // Remove Chair from Debate
  const removeChair = async (debateId: string) => {
    const debate = roundDebates.find((d) => d.id === debateId);
    if (!debate) return;

    const updatedDebate: Debate = {
      ...debate,
      adjudicators: {
        ...debate.adjudicators,
        chairId: undefined,
        chairName: undefined,
      },
    };
    await updateDebate(updatedDebate);
  };

  // Add Panellist to Debate
  const addPanellist = async (debateId: string, adj: Adjudicator) => {
    const debate = roundDebates.find((d) => d.id === debateId);
    if (!debate) return;

    const updatedDebate: Debate = {
      ...debate,
      adjudicators: {
        ...debate.adjudicators,
        panellistIds: [...(debate.adjudicators.panellistIds || []), adj.id],
        panellistNames: [...(debate.adjudicators.panellistNames || []), adj.name],
      },
    };
    await updateDebate(updatedDebate);
    setSelectedAdjForManual(null);
  };

  // Remove Panellist from Debate
  const removePanellist = async (debateId: string, adjId: string) => {
    const debate = roundDebates.find((d) => d.id === debateId);
    if (!debate) return;

    const panellistIdx = (debate.adjudicators.panellistIds || []).indexOf(adjId);
    if (panellistIdx < 0) return;

    const newIds = [...debate.adjudicators.panellistIds];
    const newNames = [...debate.adjudicators.panellistNames];
    newIds.splice(panellistIdx, 1);
    newNames.splice(panellistIdx, 1);

    const updatedDebate: Debate = {
      ...debate,
      adjudicators: {
        ...debate.adjudicators,
        panellistIds: newIds,
        panellistNames: newNames,
      },
    };
    await updateDebate(updatedDebate);
  };

  const handleAutoAllocate = async () => {
    if (!activeRound) return;
    setIsAllocating(true);
    try {
      await autoAllocate(activeRound.id, panelSize);
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#d0d7de] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Users2 className="w-6 h-6 text-indigo-600" />
            <span>Adjudicator Allocation</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Allocate chairs and panellists to debates with real-time institutional and personal conflict detection.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-md border border-gray-300 text-xs">
            <span className="font-semibold text-gray-700 px-1">Panel Size:</span>
            <select
              value={panelSize}
              onChange={(e) => setPanelSize(parseInt(e.target.value, 10))}
              className="bg-white border border-gray-300 rounded px-2 py-0.5 font-semibold text-gray-900 text-xs"
            >
              <option value={1}>1 (Solo Chair)</option>
              <option value={3}>3 (Chair + 2 Panellists)</option>
              <option value={5}>5 (Chair + 4 Panellists)</option>
            </select>
          </div>

          <button
            onClick={handleAutoAllocate}
            disabled={isAllocating || roundDebates.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAllocating ? "Optimizing..." : "Auto-Allocate All"}</span>
          </button>
        </div>
      </div>

      {/* Main Allocation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Available Adjudicators Drawer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#d0d7de] rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <span>Available Adjudicators</span>
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.2 rounded-full font-bold">
                  {availableAdjs.length}
                </span>
              </h3>
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter judges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {selectedAdjForManual && (
              <div className="mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Selected: </span>
                  <span>{selectedAdjForManual.name}</span>
                  <span className="text-[10px] text-indigo-700 block">Click on a room to assign</span>
                </div>
                <button
                  onClick={() => setSelectedAdjForManual(null)}
                  className="p-1 hover:bg-indigo-100 rounded text-indigo-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filteredAdjs.map((adj) => {
                const isSelected = selectedAdjForManual?.id === adj.id;

                return (
                  <div
                    key={adj.id}
                    onClick={() => setSelectedAdjForManual(isSelected ? null : adj)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-500 shadow-xs"
                        : "bg-gray-50/70 border-gray-200 hover:border-indigo-300 hover:bg-white"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                        <span>{adj.name}</span>
                        {adj.trainee && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase">
                            Trainee
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {adj.institutionName || "Independent"}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                        {adj.baseScore?.toFixed(1) || "5.0"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredAdjs.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">
                  No available adjudicators matching query.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Debates Allocation Board */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Debates for {activeRound?.name} ({roundDebates.length} rooms)
            </h3>
            <span className="text-xs text-gray-500">
              {roundDebates.filter((d) => d.adjudicators?.chairId).length} of {roundDebates.length} Chairs Assigned
            </span>
          </div>

          <div className="space-y-4">
            {roundDebates.map((debate, dIdx) => {
              const debateTeams: Team[] = Object.values(debate.teams)
                .map((t) => teamsMap.get(t.teamId))
                .filter((t): t is Team => t !== undefined);

              // Conflict check for currently assigned chair
              let chairConflicts: string[] = [];
              if (debate.adjudicators?.chairId) {
                const chairAdj = adjudicators.find((a) => a.id === debate.adjudicators.chairId);
                if (chairAdj) {
                  chairConflicts = calculateAdjDebateConflict(
                    chairAdj,
                    debateTeams,
                    new Map()
                  ).reasons;
                }
              }

              return (
                <div
                  key={debate.id}
                  className="bg-white border border-[#d0d7de] rounded-lg shadow-2xs overflow-hidden"
                >
                  {/* Room & Teams Bar */}
                  <div className="p-3 bg-[#f6f8fa] border-b border-[#d0d7de] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-gray-900 text-xs mr-2">
                        {debate.venueName || `Room ${dIdx + 1}`}
                      </span>
                      <span className="text-xs text-gray-600">
                        {debateTeams.map((t) => t.name).join(" vs ")}
                      </span>
                    </div>

                    {chairConflicts.length > 0 && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Clash: {chairConflicts.join(", ")}</span>
                      </span>
                    )}
                  </div>

                  {/* Allocation Slots */}
                  <div className="p-4 space-y-3">
                    {/* Chair Slot */}
                    <div className="flex items-center justify-between p-2.5 rounded bg-blue-50/50 border border-blue-200 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wide bg-blue-200 px-1.5 py-0.5 rounded">
                          Chair
                        </span>
                        {debate.adjudicators?.chairName ? (
                          <span className="font-bold text-gray-900 text-sm">
                            {debate.adjudicators.chairName}
                          </span>
                        ) : (
                          <span className="text-red-500 italic text-xs">No chair assigned</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedAdjForManual && (
                          <button
                            onClick={() => assignChair(debate.id, selectedAdjForManual)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px] transition"
                          >
                            Assign Selected
                          </button>
                        )}
                        {debate.adjudicators?.chairId && (
                          <button
                            onClick={() => removeChair(debate.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Remove Chair"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Panellists Slots */}
                    {(debate.adjudicators?.panellistIds?.length || 0) > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          Panellists
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {debate.adjudicators.panellistIds.map((pId, pIdx) => {
                            const pName = debate.adjudicators.panellistNames[pIdx];
                            return (
                              <div
                                key={pId}
                                className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs"
                              >
                                <span className="font-medium text-gray-900">{pName}</span>
                                <button
                                  onClick={() => removePanellist(debate.id, pId)}
                                  className="p-0.5 text-gray-400 hover:text-red-600 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Panellist Add Button if manual judge selected */}
                    {selectedAdjForManual && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => addPanellist(debate.id, selectedAdjForManual)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Add {selectedAdjForManual.name} as Panellist</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
