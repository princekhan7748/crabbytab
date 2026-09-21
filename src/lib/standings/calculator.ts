import {
  Tournament,
  Team,
  BallotSubmission,
  TeamStandingRow,
  SpeakerStandingRow,
  Debate,
  Round,
  DebateSide,
} from "@/types";

export interface StandingsCalculationResult {
  teams: TeamStandingRow[];
  speakers: SpeakerStandingRow[];
  replies: SpeakerStandingRow[];
}

/**
 * Computes official Tabbycat standings for teams, speakers, and reply speakers.
 */
export function calculateStandings(
  tournament: Tournament,
  rounds: Round[],
  teams: Team[],
  debates: Debate[],
  ballots: BallotSubmission[]
): StandingsCalculationResult {
  const isBP = tournament.format === "bp";

  // Filter only confirmed and non-discarded ballots
  const validBallots = ballots.filter((b) => b.confirmed && !b.discarded);
  const ballotMap = new Map<string, BallotSubmission>();
  validBallots.forEach((b) => ballotMap.set(b.debateId, b));

  // 1. Team Standings Calculation
  const teamRowsMap = new Map<string, TeamStandingRow>();

  for (const team of teams) {
    teamRowsMap.set(team.id, {
      rank: 0,
      teamId: team.id,
      teamName: team.name,
      institutionCode: team.institutionName || "",
      breakCategories: team.breakCategories || [],
      points: 0,
      totalSpeakerScore: 0,
      averageSpeakerScore: 0,
      margins: 0,
      firstPlaces: 0,
      secondPlaces: 0,
      thirdPlaces: 0,
      fourthPlaces: 0,
      wins: 0,
      losses: 0,
      roundResults: [],
    });
  }

  // Iterate debates and add ballot scores
  for (const debate of debates) {
    const ballot = ballotMap.get(debate.id);
    if (!ballot) continue;

    for (const [sideKey, teamSlot] of Object.entries(debate.teams)) {
      if (!teamSlot || !teamSlot.teamId) continue;
      const teamRow = teamRowsMap.get(teamSlot.teamId);
      if (!teamRow) continue;

      const side = sideKey as DebateSide;
      const teamScore = ballot.teamScores[side];
      const speakerScores = ballot.speakerScores[side] || [];
      const totalSpeakersScore = speakerScores.reduce((sum, spk) => sum + (spk.score || 0), 0);

      const pts = teamScore ? teamScore.points || 0 : 0;
      teamRow.points += pts;
      teamRow.totalSpeakerScore += totalSpeakersScore;

      if (isBP) {
        if (pts === 3) teamRow.firstPlaces!++;
        else if (pts === 2) teamRow.secondPlaces!++;
        else if (pts === 1) teamRow.thirdPlaces!++;
        else teamRow.fourthPlaces!++;
      } else {
        if (teamScore?.win || pts === 1) {
          teamRow.wins!++;
        } else {
          teamRow.losses!++;
        }
        teamRow.margins! += teamScore?.margin || 0;
      }

      // Record round results
      teamRow.roundResults.push({
        roundSeq: debate.roundSeq,
        side,
        points: pts,
        speakerScore: totalSpeakersScore,
        rank: teamScore?.rank,
        win: teamScore?.win,
      });
    }
  }

  // Finalize team averages and sort
  const teamList = Array.from(teamRowsMap.values());
  for (const row of teamList) {
    const roundsCount = row.roundResults.length;
    const speakersPerTeam = tournament.preferences?.substantiveSpeakers || (isBP ? 2 : 3);
    const totalSpeeches = roundsCount * speakersPerTeam;
    row.averageSpeakerScore = totalSpeeches > 0 ? Number((row.totalSpeakerScore / totalSpeeches).toFixed(2)) : 0;
  }

  // Multi-tier sorting according to metric chain
  teamList.sort((a, b) => {
    // Tier 1: Total Points
    if (b.points !== a.points) return b.points - a.points;

    // Tier 2: Total Speaker Score
    if (Math.abs(b.totalSpeakerScore - a.totalSpeakerScore) > 0.001) {
      return b.totalSpeakerScore - a.totalSpeakerScore;
    }

    // Tier 3: Rank counts for BP (1sts, then 2nds, then 3rds)
    if (isBP) {
      if ((b.firstPlaces || 0) !== (a.firstPlaces || 0)) return (b.firstPlaces || 0) - (a.firstPlaces || 0);
      if ((b.secondPlaces || 0) !== (a.secondPlaces || 0)) return (b.secondPlaces || 0) - (a.secondPlaces || 0);
      if ((b.thirdPlaces || 0) !== (a.thirdPlaces || 0)) return (b.thirdPlaces || 0) - (a.thirdPlaces || 0);
    } else {
      // Margins for 2-team
      if ((b.margins || 0) !== (a.margins || 0)) return (b.margins || 0) - (a.margins || 0);
    }

    return a.teamName.localeCompare(b.teamName);
  });

  // Assign ranks (handling ties)
  let currentRank = 1;
  for (let i = 0; i < teamList.length; i++) {
    if (i > 0) {
      const prev = teamList[i - 1];
      const cur = teamList[i];
      const isTied =
        cur.points === prev.points &&
        Math.abs(cur.totalSpeakerScore - prev.totalSpeakerScore) < 0.001 &&
        (isBP ? cur.firstPlaces === prev.firstPlaces : cur.margins === prev.margins);

      rowRank: if (!isTied) {
        currentRank = i + 1;
      }
    }
    teamList[i].rank = currentRank;
  }

  // 2. Speaker Standings Calculation
  const speakerRowsMap = new Map<string, SpeakerStandingRow>();
  const replyRowsMap = new Map<string, SpeakerStandingRow>();

  // Register all speakers from all teams
  for (const team of teams) {
    for (const spk of team.speakers || []) {
      speakerRowsMap.set(spk.id, {
        rank: 0,
        speakerId: spk.id,
        speakerName: spk.name,
        teamId: team.id,
        teamName: team.name,
        institutionCode: team.institutionName || "",
        categories: spk.categories || team.speakerCategories || [],
        totalScore: 0,
        averageScore: 0,
        speechesCount: 0,
        scoresByRound: [],
      });
    }
  }

  // Tally individual scores from confirmed ballots
  for (const debate of debates) {
    const ballot = ballotMap.get(debate.id);
    if (!ballot) continue;

    for (const [sideKey, scoresList] of Object.entries(ballot.speakerScores || {})) {
      const isReplyPosition = tournament.preferences?.replyScoresEnabled && !isBP;

      for (const entry of scoresList) {
        if (!entry.speakerId || !entry.score) continue;

        // Check if this is a reply speech position (position 4 in 3-speaker 2-team format)
        if (isReplyPosition && entry.position === 4) {
          if (!replyRowsMap.has(entry.speakerId)) {
            const team = teams.find((t) => t.speakers?.some((s) => s.id === entry.speakerId));
            replyRowsMap.set(entry.speakerId, {
              rank: 0,
              speakerId: entry.speakerId,
              speakerName: entry.speakerName,
              teamId: team?.id || "",
              teamName: team?.name || "",
              institutionCode: team?.institutionName || "",
              categories: [],
              totalScore: 0,
              averageScore: 0,
              speechesCount: 0,
              scoresByRound: [],
            });
          }
          const repRow = replyRowsMap.get(entry.speakerId)!;
          repRow.totalScore += entry.score;
          repRow.speechesCount++;
          repRow.scoresByRound.push({
            roundSeq: debate.roundSeq,
            score: entry.score,
            position: entry.position,
          });
        } else {
          // Standard substantive speaker
          let spkRow = speakerRowsMap.get(entry.speakerId);
          if (!spkRow) {
            const team = teams.find((t) => t.speakers?.some((s) => s.id === entry.speakerId));
            spkRow = {
              rank: 0,
              speakerId: entry.speakerId,
              speakerName: entry.speakerName,
              teamId: team?.id || "",
              teamName: team?.name || "",
              institutionCode: team?.institutionName || "",
              categories: [],
              totalScore: 0,
              averageScore: 0,
              speechesCount: 0,
              scoresByRound: [],
            };
            speakerRowsMap.set(entry.speakerId, spkRow);
          }
          spkRow.totalScore += entry.score;
          spkRow.speechesCount++;
          spkRow.scoresByRound.push({
            roundSeq: debate.roundSeq,
            score: entry.score,
            position: entry.position,
          });
        }
      }
    }
  }

  // Sort and rank substantive speakers
  const speakerList = Array.from(speakerRowsMap.values());
  for (const spk of speakerList) {
    spk.averageScore = spk.speechesCount > 0 ? Number((spk.totalScore / spk.speechesCount).toFixed(2)) : 0;
  }

  speakerList.sort((a, b) => {
    if (Math.abs(b.totalScore - a.totalScore) > 0.001) return b.totalScore - a.totalScore;
    if (Math.abs(b.averageScore - a.averageScore) > 0.001) return b.averageScore - a.averageScore;
    return a.speakerName.localeCompare(b.speakerName);
  });

  let spkRank = 1;
  for (let i = 0; i < speakerList.length; i++) {
    if (i > 0 && Math.abs(speakerList[i].totalScore - speakerList[i - 1].totalScore) > 0.001) {
      spkRank = i + 1;
    }
    speakerList[i].rank = spkRank;
  }

  // Sort and rank reply speakers
  const replyList = Array.from(replyRowsMap.values());
  for (const rep of replyList) {
    rep.averageScore = rep.speechesCount > 0 ? Number((rep.totalScore / rep.speechesCount).toFixed(2)) : 0;
  }
  replyList.sort((a, b) => b.totalScore - a.totalScore);
  let repRank = 1;
  for (let i = 0; i < replyList.length; i++) {
    if (i > 0 && Math.abs(replyList[i].totalScore - replyList[i - 1].totalScore) > 0.001) {
      repRank = i + 1;
    }
    replyList[i].rank = repRank;
  }

  return {
    teams: teamList,
    speakers: speakerList,
    replies: replyList,
  };
}
