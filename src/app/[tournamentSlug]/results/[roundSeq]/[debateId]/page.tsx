"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTournament } from "@/contexts/TournamentContext";
import { SideBadge } from "@/components/ui/SideBadge";
import {
  FileCheck2,
  CheckCircle2,
  ArrowLeft,
  Save,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Users,
} from "lucide-react";
import { BallotSubmission, DebateSide, Team } from "@/types";

export default function BallotEntryPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentSlug = params.tournamentSlug as string;
  const roundSeq = parseInt(params.roundSeq as string, 10);
  const debateId = params.debateId as string;

  const {
    tournament,
    debates,
    rounds,
    teams,
    motions,
    ballots,
    submitBallot,
  } = useTournament();

  const debate = debates.find((d) => d.id === debateId);
  const round = rounds.find((r) => r.seq === roundSeq);
  const isBP = tournament?.format === "bp";

  const existingBallot = ballots.find((b) => b.debateId === debateId);

  // Form State
  const [selectedMotionId, setSelectedMotionId] = useState<string>(
    existingBallot?.motionId || debate?.motionId || ""
  );

  const [scores, setScores] = useState<Record<string, { speakerId: string; speakerName: string; score: number }[]>>({});
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [isConfirmed, setIsConfirmed] = useState<boolean>(existingBallot?.confirmed || false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const sides: DebateSide[] = isBP ? ["OG", "OO", "CG", "CO"] : ["AFF", "NEG"];
  const teamsMap = new Map<string, Team>();
  teams.forEach((t) => teamsMap.set(t.id, t));

  // Initialize scores and ranks from existing ballot or defaults
  useEffect(() => {
    if (!debate) return;

    const initialScores: Record<string, any[]> = {};
    const initialRanks: Record<string, number> = {};

    sides.forEach((side, idx) => {
      const teamSlot = debate.teams[side];
      const team = teamSlot ? teamsMap.get(teamSlot.teamId) : null;
      const existingTeamScore = existingBallot?.teamScores?.[side];
      const existingSpeakerScores = existingBallot?.speakerScores?.[side];

      if (existingTeamScore) {
        initialRanks[side] = existingTeamScore.rank || (isBP ? 4 - existingTeamScore.points : existingTeamScore.win ? 1 : 2);
      } else {
        initialRanks[side] = idx + 1;
      }

      if (existingSpeakerScores && existingSpeakerScores.length > 0) {
        initialScores[side] = existingSpeakerScores;
      } else {
        const numSpeakers = tournament?.preferences?.substantiveSpeakers || (isBP ? 2 : 3);
        const defaultScores = [];
        for (let pos = 1; pos <= numSpeakers; pos++) {
          const spk = team?.speakers?.[pos - 1];
          defaultScores.push({
            speakerId: spk?.id || `spk-${side}-${pos}`,
            speakerName: spk?.name || `${teamSlot?.teamName || side} Speaker ${pos}`,
            score: 75,
          });
        }
        initialScores[side] = defaultScores;
      }
    });

    setScores(initialScores);
    setRanks(initialRanks);
    if (existingBallot) {
      setIsConfirmed(existingBallot.confirmed);
    }
  }, [debate, existingBallot, isBP]);

  if (!debate) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Debate not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleScoreChange = (side: string, index: number, value: number) => {
    const updated = { ...scores };
    if (!updated[side]) updated[side] = [];
    updated[side][index] = {
      ...updated[side][index],
      score: value,
    };
    setScores(updated);
  };

  const handleRankChange = (side: string, rank: number) => {
    setRanks((prev) => ({ ...prev, [side]: rank }));
  };

  const calculateTeamTotal = (side: string) => {
    return (scores[side] || []).reduce((sum, spk) => sum + (spk?.score || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate distinct ranks for BP
    if (isBP) {
      const rankValues = Object.values(ranks);
      const uniqueRanks = new Set(rankValues);
      if (uniqueRanks.size !== 4) {
        setErrorMessage("Each team in a BP debate must be assigned a unique rank from 1st to 4th.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const speakerScoresRecord: Record<DebateSide, any[]> = {} as any;
      const teamScoresRecord: Record<DebateSide, any> = {} as any;

      sides.forEach((side) => {
        const teamSlot = debate.teams[side];
        const spkScores = scores[side] || [];
        const total = spkScores.reduce((sum, s) => sum + s.score, 0);
        const rank = ranks[side] || 1;

        speakerScoresRecord[side] = spkScores.map((s, pos) => ({
          speakerId: s.speakerId,
          speakerName: s.speakerName,
          position: pos + 1,
          score: s.score,
        }));

        const pts = isBP ? (rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0) : rank === 1 ? 1 : 0;

        teamScoresRecord[side] = {
          side,
          teamId: teamSlot.teamId,
          points: pts,
          totalSpeakerScore: total,
          rank,
          win: pts === 1 || pts === 3,
          margin: isBP ? 0 : rank === 1 ? 2 : -2,
        };
      });

      const motionObj = motions.find((m) => m.id === selectedMotionId);

      const ballotPayload: BallotSubmission = {
        id: existingBallot?.id || `ballot-${debate.id}-v1`,
        tournamentId: tournament?.id || tournamentSlug,
        roundId: debate.roundId,
        debateId: debate.id,
        version: (existingBallot?.version || 0) + 1,
        confirmed: isConfirmed,
        discarded: false,
        submitterType: "tabroom",
        submitterName: "Tab Room Official",
        motionId: selectedMotionId,
        motionText: motionObj?.text || debate.motionText,
        speakerScores: speakerScoresRecord,
        teamScores: teamScoresRecord,
        chairId: debate.adjudicators?.chairId,
        timestamp: new Date().toISOString(),
        confirmedBy: isConfirmed ? "Tab Director" : undefined,
        confirmedTimestamp: isConfirmed ? new Date().toISOString() : undefined,
      };

      await submitBallot(ballotPayload);
      router.push(`/${tournamentSlug}/results`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit ballot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-[#d0d7de] pb-3">
        <button
          onClick={() => router.push(`/${tournamentSlug}/results`)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Results Overview</span>
        </button>

        <span className="text-xs text-gray-500 font-semibold">
          {round?.name} &bull; {debate.venueName}
        </span>
      </div>

      {/* Main Ballot Card */}
      <div className="bg-white border border-[#d0d7de] rounded-lg shadow-xs overflow-hidden">
        {/* Header */}
        <div className="bg-[#f6f8fa] p-4 border-b border-[#d0d7de]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <span>Debate Ballot Entry</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Venue: <span className="font-bold text-gray-800">{debate.venueName}</span> &bull; Chair:{" "}
                <span className="font-bold text-gray-800">
                  {debate.adjudicators?.chairName || "Unassigned"}
                </span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isConfirmed
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {isConfirmed ? "Confirmed Ballot" : "Draft Ballot"}
              </span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Motion Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Motion Debated</span>
            </label>
            <select
              value={selectedMotionId}
              onChange={(e) => setSelectedMotionId(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Select Motion --</option>
              {motions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.reference ? `${m.reference}: ` : ""}&ldquo;{m.text}&rdquo;
                </option>
              ))}
            </select>
          </div>

          {/* Teams and Speaker Scores */}
          <div className="space-y-5">
            {sides.map((side) => {
              const teamSlot = debate.teams[side];
              const sideScores = scores[side] || [];
              const teamTotal = calculateTeamTotal(side);
              const rank = ranks[side] || 1;

              return (
                <div
                  key={side}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <SideBadge side={side} />
                      <span className="font-bold text-gray-900 text-sm">
                        {teamSlot?.teamName || "Unassigned Team"}
                      </span>
                    </div>

                    {/* Rank / Win Selector */}
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-semibold text-gray-600">
                        {isBP ? "Rank:" : "Result:"}
                      </label>
                      {isBP ? (
                        <select
                          value={rank}
                          onChange={(e) => handleRankChange(side, parseInt(e.target.value, 10))}
                          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-bold text-gray-900"
                        >
                          <option value={1}>1st Place (3 pts)</option>
                          <option value={2}>2nd Place (2 pts)</option>
                          <option value={3}>3rd Place (1 pt)</option>
                          <option value={4}>4th Place (0 pts)</option>
                        </select>
                      ) : (
                        <select
                          value={rank}
                          onChange={(e) => handleRankChange(side, parseInt(e.target.value, 10))}
                          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-bold text-gray-900"
                        >
                          <option value={1}>Win (1 pt)</option>
                          <option value={2}>Loss (0 pts)</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Speaker Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sideScores.map((spk, pos) => (
                      <div
                        key={pos}
                        className="bg-white border border-gray-200 rounded p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Speaker {pos + 1}
                          </span>
                          <span className="text-xs font-semibold text-gray-800">
                            {spk.speakerName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <label className="text-xs font-medium text-gray-500">Score:</label>
                          <input
                            type="number"
                            step="0.5"
                            min="50"
                            max="100"
                            value={spk.score}
                            onChange={(e) =>
                              handleScoreChange(side, pos, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-xs font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Team Total Calculation */}
                  <div className="flex justify-end text-xs font-semibold text-gray-700 pt-1">
                    <span>Total Team Speaker Score: </span>
                    <span className="font-bold text-gray-900 font-mono ml-1.5">{teamTotal}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Official Confirmation Checkbox */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-gray-800">
                Confirm this ballot as official tab room record
              </span>
            </label>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/${tournamentSlug}/results`)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Saving..." : "Save Ballot"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
