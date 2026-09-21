"use client";

import React, { useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import { parseTeamsCsv, parseAdjudicatorsCsv } from "@/lib/csv/importer";
import {
  Users,
  Users2,
  Plus,
  Upload,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";
import { Team, Adjudicator } from "@/types";

export default function ParticipantsPage() {
  const {
    tournament,
    teams,
    adjudicators,
    addTeam,
    updateTeam,
    deleteTeam,
    addAdjudicator,
    updateAdjudicator,
    deleteAdjudicator,
  } = useTournament();

  const [activeTab, setActiveTab] = useState<"teams" | "adjs">("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddAdjModal, setShowAddAdjModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamInst, setNewTeamInst] = useState("");
  const [newSpk1, setNewSpk1] = useState("");
  const [newSpk2, setNewSpk2] = useState("");
  const [newSpk3, setNewSpk3] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // New Adj Form State
  const [newAdjName, setNewAdjName] = useState("");
  const [newAdjInst, setNewAdjInst] = useState("");
  const [newAdjScore, setNewAdjScore] = useState(5.0);
  const [newAdjTrainee, setNewAdjTrainee] = useState(false);

  const isBP = tournament?.format === "bp";

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.institutionName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdjs = adjudicators.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.institutionName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const speakers = [
      { id: `spk-${Date.now()}-1`, name: newSpk1.trim() || `${newTeamName} Spk 1` },
      { id: `spk-${Date.now()}-2`, name: newSpk2.trim() || `${newTeamName} Spk 2` },
    ];

    if (!isBP && newSpk3.trim()) {
      speakers.push({ id: `spk-${Date.now()}-3`, name: newSpk3.trim() });
    }

    await addTeam({
      name: newTeamName.trim(),
      codeName: newTeamName.trim(),
      institutionName: newTeamInst.trim(),
      speakers,
      breakCategories: [],
      speakerCategories: newCategory ? [newCategory.trim().toLowerCase()] : [],
      checkedIn: true,
    });

    setNewTeamName("");
    setNewTeamInst("");
    setNewSpk1("");
    setNewSpk2("");
    setNewSpk3("");
    setShowAddTeamModal(false);
  };

  const handleCreateAdj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjName.trim()) return;

    await addAdjudicator({
      name: newAdjName.trim(),
      institutionName: newAdjInst.trim(),
      baseScore: newAdjScore,
      trainee: newAdjTrainee,
      independent: !newAdjInst.trim(),
      checkedIn: true,
      conflicts: [],
    });

    setNewAdjName("");
    setNewAdjInst("");
    setNewAdjScore(5.0);
    setNewAdjTrainee(false);
    setShowAddAdjModal(false);
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;
    if (activeTab === "teams") {
      const parsed = parseTeamsCsv(csvText, tournament?.id || "");
      for (const t of parsed) {
        await addTeam(t);
      }
    } else {
      const parsed = parseAdjudicatorsCsv(csvText, tournament?.id || "");
      for (const a of parsed) {
        await addAdjudicator(a);
      }
    }
    setCsvText("");
    setShowCsvModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#d0d7de] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Participants Directory</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage registered debating teams, speakers, adjudicators, and CSV batch rosters.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold border border-gray-300 rounded text-xs shadow-2xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span>Import CSV</span>
          </button>

          {activeTab === "teams" ? (
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Team</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddAdjModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Adjudicator</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d0d7de] pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition flex items-center space-x-1.5 ${
              activeTab === "teams"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teams ({teams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("adjs")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition flex items-center space-x-1.5 ${
              activeTab === "adjs"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Adjudicators ({adjudicators.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === "teams" ? "Search teams..." : "Search judges..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
      </div>

      {/* 1. Teams Table */}
      {activeTab === "teams" && (
        <div className="bg-white border border-[#d0d7de] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left tabby-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>Team Name</th>
                  <th>Institution</th>
                  <th>Speakers</th>
                  <th>Categories</th>
                  <th className="w-20 text-center">Status</th>
                  <th className="w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="text-center font-mono text-xs text-gray-500">{idx + 1}</td>
                    <td className="font-bold text-gray-900 text-xs">{team.name}</td>
                    <td className="text-xs text-gray-600">{team.institutionName || "—"}</td>
                    <td className="text-xs text-gray-700">
                      {team.speakers?.map((s) => s.name).join(", ") || "—"}
                    </td>
                    <td>
                      {team.speakerCategories?.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 uppercase mr-1"
                        >
                          {c}
                        </span>
                      ))}
                    </td>
                    <td className="text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        Checked In
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${team.name}?`)) deleteTeam(team.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Adjudicators Table */}
      {activeTab === "adjs" && (
        <div className="bg-white border border-[#d0d7de] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left tabby-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>Judge Name</th>
                  <th>Institution</th>
                  <th className="text-center">Rating</th>
                  <th className="text-center">Role</th>
                  <th className="w-20 text-center">Status</th>
                  <th className="w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjs.map((adj, idx) => (
                  <tr key={adj.id} className="hover:bg-gray-50">
                    <td className="text-center font-mono text-xs text-gray-500">{idx + 1}</td>
                    <td className="font-bold text-gray-900 text-xs">{adj.name}</td>
                    <td className="text-xs text-gray-600">{adj.institutionName || "Independent"}</td>
                    <td className="text-center font-mono font-bold text-xs bg-gray-50 text-indigo-700">
                      {adj.baseScore?.toFixed(1) || "5.0"}
                    </td>
                    <td className="text-center">
                      {adj.trainee ? (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded uppercase">
                          Trainee
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded uppercase">
                          Accredited
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        Active
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${adj.name}?`)) deleteAdjudicator(adj.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                        title="Delete Judge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Add New Team</span>
            </h3>
            <form onSubmit={handleCreateTeam} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oxford A"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Oxford Union"
                  value={newTeamInst}
                  onChange={(e) => setNewTeamInst(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Speaker 1</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newSpk1}
                    onChange={(e) => setNewSpk1(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Speaker 2</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newSpk2}
                    onChange={(e) => setNewSpk2(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              {!isBP && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Speaker 3</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newSpk3}
                    onChange={(e) => setNewSpk3(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Add Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Adj Modal */}
      {showAddAdjModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Add Adjudicator</span>
            </h3>
            <form onSubmit={handleCreateAdj} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Judge Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={newAdjName}
                  onChange={(e) => setNewAdjName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Oxford Union"
                  value={newAdjInst}
                  onChange={(e) => setNewAdjInst(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Base Rating (1-10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={newAdjScore}
                    onChange={(e) => setNewAdjScore(parseFloat(e.target.value) || 5.0)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={newAdjTrainee}
                      onChange={(e) => setNewAdjTrainee(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span>Trainee Judge</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddAdjModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs"
                >
                  Add Adjudicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-lg w-full p-6 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Import {activeTab === "teams" ? "Teams" : "Adjudicators"} from CSV</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Paste CSV text formatted with standard Tabbycat column headers (e.g. <code>name, institution, speaker1, speaker2</code>).
            </p>

            <textarea
              rows={8}
              placeholder={
                activeTab === "teams"
                  ? "name,institution,speaker1,speaker2\nOxford A,Oxford Union,Jane Doe,John Smith\nCambridge B,Cambridge Union,Alice,Bob"
                  : "name,institution,score,trainee\nEleanor Vance,Oxford Union,8.5,false\nDavid Kim,Independent,6.0,true"
              }
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full border border-gray-300 rounded p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCsvImport}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
              >
                Import CSV Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
