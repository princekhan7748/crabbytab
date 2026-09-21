"use client";

import React, { useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import {
  MessageSquareHeart,
  Plus,
  Star,
  CheckCircle2,
  Users2,
  Search,
} from "lucide-react";

export default function FeedbackPage() {
  const { tournament, adjudicators, feedback, addFeedback } = useTournament();
  const [showModal, setShowModal] = useState(false);
  const [targetAdjId, setTargetAdjId] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState<"team" | "adjudicator">("team");
  const [score, setScore] = useState(7);
  const [agree, setAgree] = useState(true);
  const [comments, setComments] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdjId || !sourceName.trim()) return;

    const targetAdj = adjudicators.find((a) => a.id === targetAdjId);

    await addFeedback({
      debateId: "direct-feedback",
      roundId: "r-all",
      targetAdjudicatorId: targetAdjId,
      targetAdjudicatorName: targetAdj?.name || "Adjudicator",
      sourceType,
      sourceId: `src-${Date.now()}`,
      sourceName: sourceName.trim(),
      score,
      agreeWithDecision: agree,
      comments: comments.trim(),
      confirmed: true,
    });

    setTargetAdjId("");
    setSourceName("");
    setComments("");
    setShowModal(false);
  };

  const adjFeedbackMap = new Map<string, { totalScore: number; count: number; agrees: number }>();
  feedback.forEach((f) => {
    if (!adjFeedbackMap.has(f.targetAdjudicatorId)) {
      adjFeedbackMap.set(f.targetAdjudicatorId, { totalScore: 0, count: 0, agrees: 0 });
    }
    const stat = adjFeedbackMap.get(f.targetAdjudicatorId)!;
    stat.totalScore += f.score;
    stat.count++;
    if (f.agreeWithDecision) stat.agrees++;
  });

  const filteredAdjs = adjudicators.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#d0d7de] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <MessageSquareHeart className="w-6 h-6 text-pink-600" />
            <span>Adjudicator Feedback & Ratings</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track real-time judge feedback submitted by debaters, chairs, and panellists.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit Feedback</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d0d7de] p-4 rounded-lg">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Feedback Forms</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{feedback.length}</div>
        </div>
        <div className="bg-white border border-[#d0d7de] p-4 rounded-lg">
          <span className="text-xs font-semibold text-gray-500 uppercase">Judges Evaluated</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{adjFeedbackMap.size}</div>
        </div>
        <div className="bg-white border border-[#d0d7de] p-4 rounded-lg">
          <span className="text-xs font-semibold text-gray-500 uppercase">Average Score</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {feedback.length > 0
              ? (
                  feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length
                ).toFixed(2)
              : "—"}
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white border border-[#d0d7de] rounded-lg shadow-xs overflow-hidden">
        <div className="p-3 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 uppercase">Judge Ratings Summary</h3>
          <input
            type="text"
            placeholder="Search judge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left tabby-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Judge Name</th>
                <th>Institution</th>
                <th className="text-center">Base Score</th>
                <th className="text-center">Feedback Submissions</th>
                <th className="text-right">Average Feedback</th>
                <th className="text-center">Decision Agreement</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdjs.map((adj, idx) => {
                const stat = adjFeedbackMap.get(adj.id);
                const avg = stat && stat.count > 0 ? (stat.totalScore / stat.count).toFixed(2) : "—";
                const agreePct = stat && stat.count > 0 ? Math.round((stat.agrees / stat.count) * 100) : null;

                return (
                  <tr key={adj.id} className="hover:bg-gray-50">
                    <td className="text-center font-mono text-xs text-gray-500">{idx + 1}</td>
                    <td className="font-bold text-gray-900 text-xs">{adj.name}</td>
                    <td className="text-xs text-gray-600">{adj.institutionName || "Independent"}</td>
                    <td className="text-center font-mono text-xs text-gray-700">
                      {adj.baseScore?.toFixed(1) || "5.0"}
                    </td>
                    <td className="text-center font-mono text-xs text-gray-700">
                      {stat?.count || 0}
                    </td>
                    <td className="text-right font-mono font-bold text-xs text-pink-700">
                      {avg}
                    </td>
                    <td className="text-center font-mono text-xs">
                      {agreePct !== null ? `${agreePct}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <MessageSquareHeart className="w-5 h-5 text-pink-600" />
              <span>Submit Adjudicator Feedback</span>
            </h3>
            <form onSubmit={handleCreateFeedback} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Judge</label>
                <select
                  required
                  value={targetAdjId}
                  onChange={(e) => setTargetAdjId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-semibold"
                >
                  <option value="">-- Select Judge --</option>
                  {adjudicators.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.institutionName || "Independent"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Submitted By (Team or Chair)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oxford A or Chair Judge"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value, 10) || 7)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="rounded border-gray-300 text-pink-600"
                    />
                    <span>Agreed with Decision</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Comments (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Constructive feedback comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded shadow-xs"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
