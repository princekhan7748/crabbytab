"use client";

import React, { useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import {
  Sliders,
  Save,
  CheckCircle2,
  Shield,
  Eye,
  Shuffle,
  FileCheck2,
} from "lucide-react";
import { TournamentPreferences, TournamentFormat } from "@/types";

export default function ConfigPage() {
  const { tournament, saveTournament } = useTournament();

  const [format, setFormat] = useState<TournamentFormat>(tournament?.format || "bp");
  const [prefs, setPrefs] = useState<TournamentPreferences>(
    tournament?.preferences || {
      teamsInDebate: 4,
      substantiveSpeakers: 2,
      replyScoresEnabled: false,
      minSpeakerScore: 68,
      maxSpeakerScore: 84,
      stepSpeakerScore: 1,
      minReplyScore: 34,
      maxReplyScore: 42,
      drawRule: "power_paired",
      sideAllocationRule: "balanced",
      ballotDoubleEntry: false,
      publicDraw: true,
      publicResults: true,
      publicStandings: true,
      publicMotions: true,
      feedbackEnabled: true,
      feedbackMinScore: 1,
      feedbackMaxScore: 10,
    }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;

    await saveTournament({
      ...tournament,
      format,
      preferences: prefs,
      updatedAt: new Date().toISOString(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#d0d7de] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>Tournament Configuration</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure debate format rules, speaker score ranges, draw constraints, and public tab settings.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Format & Speakers */}
        <div className="bg-white border border-[#d0d7de] rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Debate Format & Team Structure</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Parliamentary Format
              </label>
              <select
                value={format}
                onChange={(e) => {
                  const newFmt = e.target.value as TournamentFormat;
                  setFormat(newFmt);
                  if (newFmt === "bp") {
                    setPrefs((p) => ({
                      ...p,
                      teamsInDebate: 4,
                      substantiveSpeakers: 2,
                      replyScoresEnabled: false,
                    }));
                  } else {
                    setPrefs((p) => ({
                      ...p,
                      teamsInDebate: 2,
                      substantiveSpeakers: 3,
                      replyScoresEnabled: true,
                    }));
                  }
                }}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold"
              >
                <option value="bp">British Parliamentary (BP) — 4 Teams, 2 Speakers/Team</option>
                <option value="uadc">Asian Parliamentary (UADC) — 2 Teams, 3 Speakers + Reply</option>
                <option value="australs">Australs — 2 Teams, 3 Speakers + Reply</option>
                <option value="wsdc">World Schools (WSDC) — 2 Teams, 3 Speakers + Reply</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Substantive Speakers per Team
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={prefs.substantiveSpeakers}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    substantiveSpeakers: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 2. Speaker Score Bounds */}
        <div className="bg-white border border-[#d0d7de] rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>Speaker Scoring Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Minimum Speaker Score
              </label>
              <input
                type="number"
                value={prefs.minSpeakerScore}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, minSpeakerScore: parseFloat(e.target.value) || 68 }))
                }
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Maximum Speaker Score
              </label>
              <input
                type="number"
                value={prefs.maxSpeakerScore}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, maxSpeakerScore: parseFloat(e.target.value) || 84 }))
                }
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Score Step Increment
              </label>
              <select
                value={prefs.stepSpeakerScore}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, stepSpeakerScore: parseFloat(e.target.value) || 1 }))
                }
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono"
              >
                <option value={1}>1.0 (Integers only: 74, 75, 76...)</option>
                <option value={0.5}>0.5 (Half points: 74.5, 75.0...)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Public Visibility Controls */}
        <div className="bg-white border border-[#d0d7de] rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Public Website Visibility Controls</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center space-x-2.5 p-2 rounded bg-gray-50 border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.publicDraw}
                onChange={(e) => setPrefs((p) => ({ ...p, publicDraw: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="font-semibold text-gray-800">Public Draw Display</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded bg-gray-50 border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.publicResults}
                onChange={(e) => setPrefs((p) => ({ ...p, publicResults: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="font-semibold text-gray-800">Public Results & Scores</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded bg-gray-50 border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.publicStandings}
                onChange={(e) => setPrefs((p) => ({ ...p, publicStandings: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="font-semibold text-gray-800">Public Standings Tab</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded bg-gray-50 border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.publicMotions}
                onChange={(e) => setPrefs((p) => ({ ...p, publicMotions: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="font-semibold text-gray-800">Public Motions Page</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Tournament Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
