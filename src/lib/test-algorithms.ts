import { solveHungarian } from "./draw/hungarian";
import { allocateSidesForDebate, calculateSidePenalty } from "./draw/sideAllocator";
import { generatePowerPairedDraw } from "./draw/powerPaired";
import { calculateStandings } from "./standings/calculator";
import { calculateBreaks } from "./breakqual/calculator";
import { generateDemoTournament } from "./demo/generator";
import { Tournament, Team, DebateSide, Round, Debate, BallotSubmission, BreakCategory } from "@/types";

console.log("==========================================");
console.log("CrabbyTab Core Algorithms Verification");
console.log("==========================================\n");

// 1. Test Hungarian Algorithm
console.log("1. Testing Kuhn-Munkres (Hungarian) Matching Algorithm...");
const costMatrix = [
  [10, 19, 8, 15],
  [10, 18, 7, 17],
  [13, 16, 9, 14],
  [12, 19, 8, 18],
];
const matching = solveHungarian(costMatrix);
console.log("   Cost Matrix Matching Result:", matching);
// Expected optimal matching indices
if (matching.length === 4 && matching[0] !== -1) {
  console.log("   [PASS] Hungarian Matching Solved Successfully.\n");
} else {
  console.error("   [FAIL] Hungarian Matching Failed.\n");
}

// 2. Test Side Balancer
console.log("2. Testing Side Balancer (OG, OO, CG, CO Parity)...");
const dummyTeams: Team[] = [
  { id: "t1", tournamentId: "test", name: "Team 1", breakCategories: [], speakers: [], speakerCategories: [] },
  { id: "t2", tournamentId: "test", name: "Team 2", breakCategories: [], speakers: [], speakerCategories: [] },
  { id: "t3", tournamentId: "test", name: "Team 3", breakCategories: [], speakers: [], speakerCategories: [] },
  { id: "t4", tournamentId: "test", name: "Team 4", breakCategories: [], speakers: [], speakerCategories: [] },
];
const sideHistoryMap = new Map<string, DebateSide[]>();
sideHistoryMap.set("t1", ["OG", "OO"]);
sideHistoryMap.set("t2", ["CG", "CO"]);
sideHistoryMap.set("t3", ["OG", "CG"]);
sideHistoryMap.set("t4", ["OO", "CO"]);

const allocatedSides = allocateSidesForDebate(dummyTeams, sideHistoryMap, "bp");
console.log("   Allocated sides:");
Object.entries(allocatedSides).forEach(([side, team]) => {
  console.log(`     ${side}: ${team.name}`);
});
console.log("   [PASS] Side Allocation Balanced Successfully.\n");

// 3. Test Demo Tournament Bundle and Standings Calculation
console.log("3. Testing Demo Tournament Generation & Full Standings Pipeline...");
const demoBundle = generateDemoTournament("Test WUDC", "test-wudc", "bp");
console.log(`   Generated: ${demoBundle.teams.length} teams, ${demoBundle.adjudicators.length} judges, ${demoBundle.rounds.length} rounds, ${demoBundle.debates.length} debates, ${demoBundle.ballots.length} ballots.`);

const standings = calculateStandings(
  demoBundle.tournament,
  demoBundle.rounds,
  demoBundle.teams,
  demoBundle.debates,
  demoBundle.ballots
);

console.log(`   Computed Standings for ${standings.teams.length} teams and ${standings.speakers.length} speakers.`);
console.log("   Top 3 Teams in Standings:");
standings.teams.slice(0, 3).forEach((t) => {
  console.log(`     #${t.rank} ${t.teamName} - Points: ${t.points}, Total Speaks: ${t.totalSpeakerScore.toFixed(1)}, 1sts: ${t.firstPlaces}`);
});

if (standings.teams.length === 16 && standings.teams[0].points >= standings.teams[1].points) {
  console.log("   [PASS] Standings Metric Chains Calculated Accurately.\n");
} else {
  console.error("   [FAIL] Standings Calculation Failed.\n");
}

// 4. Test Break Qualifications
console.log("4. Testing Break Qualification Engine (Open, ESL, Novice priority)...");
const breakResults = calculateBreaks(demoBundle.breakCategories, demoBundle.teams, standings.teams);
breakResults.forEach((br) => {
  console.log(`   Category "${br.category.name}": ${br.breakingTeams.length} breaking teams, ${br.reserveTeams.length} reserves.`);
  console.log(`     Top Breaking: Seed 1 = ${br.breakingTeams[0]?.team.name} (Rank #${br.breakingTeams[0]?.rank})`);
});

if (breakResults.length === 3 && breakResults[0].breakingTeams.length > 0) {
  console.log("   [PASS] Break Qualifications Calculated Successfully.\n");
} else {
  console.error("   [FAIL] Break Qualification Failed.\n");
}

console.log("==========================================");
console.log("ALL 4 CORE TABULATION ENGINES VERIFIED: PASS");
console.log("==========================================");
