"use client";

import React, { useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import {
  Lightbulb,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { Motion } from "@/types";

export default function MotionsPage() {
  const { tournament, motions, rounds, addMotion, updateMotion } = useTournament();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newInfoSlide, setNewInfoSlide] = useState("");
  const [newRef, setNewRef] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const handleCreateMotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    await addMotion({
      text: newText.trim(),
      infoSlide: newInfoSlide.trim(),
      reference: newRef.trim() || `Motion ${motions.length + 1}`,
      rounds: selectedRoundId ? [selectedRoundId] : [],
      released: true,
      seq: motions.length + 1,
    });

    setNewText("");
    setNewInfoSlide("");
    setNewRef("");
    setSelectedRoundId("");
    setShowAddModal(false);
  };

  const toggleMotionRelease = async (motion: Motion) => {
    await updateMotion({ ...motion, released: !motion.released });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#d0d7de] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span>Tournament Motions</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage debate motions, information slides, and release status per round.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Motion</span>
        </button>
      </div>

      {/* Motions List */}
      <div className="space-y-4">
        {motions.map((motion, idx) => {
          const assignedRound = rounds.find((r) => motion.rounds && motion.rounds.includes(r.id));

          return (
            <div
              key={motion.id}
              className="bg-white border border-[#d0d7de] rounded-lg p-5 shadow-2xs hover:border-blue-400 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    {motion.reference || `Motion ${idx + 1}`}
                  </span>
                  {assignedRound && (
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      Allocated to: {assignedRound.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleMotionRelease(motion)}
                    className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded border transition ${
                      motion.released
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {motion.released ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Released to Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                        <span>Private</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Motion Text */}
              <blockquote className="text-base font-bold text-gray-900 my-3 pl-3 border-l-4 border-amber-500">
                &ldquo;{motion.text}&rdquo;
              </blockquote>

              {/* Info Slide if present */}
              {motion.infoSlide && (
                <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded text-xs text-amber-900">
                  <strong className="block font-bold mb-0.5 uppercase tracking-wide text-[10px] text-amber-800">
                    Infoslide / Context
                  </strong>
                  <p>{motion.infoSlide}</p>
                </div>
              )}
            </div>
          );
        })}

        {motions.length === 0 && (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-10 text-center">
            <Lightbulb className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">No Motions Added</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
              Add debate motions and allocate them to preliminary or break rounds.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Motion</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Motion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-lg w-full p-6 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>Create Debate Motion</span>
            </h3>
            <form onSubmit={handleCreateMotion} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Motion Reference / Topic Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Round 1: International Relations"
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Motion Text</label>
                <textarea
                  rows={3}
                  required
                  placeholder="This House would..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Infoslide (Optional context notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Infoslide details..."
                  value={newInfoSlide}
                  onChange={(e) => setNewInfoSlide(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign to Round</label>
                <select
                  value={selectedRoundId}
                  onChange={(e) => setSelectedRoundId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
                >
                  <option value="">-- No specific round --</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Save Motion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
