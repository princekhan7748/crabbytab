import Papa from "papaparse";
import { Team, Adjudicator, Institution, Venue, TeamStandingRow, SpeakerStandingRow } from "@/types";

export interface TeamCsvRow {
  name: string;
  code?: string;
  institution?: string;
  speaker1: string;
  speaker1_email?: string;
  speaker2: string;
  speaker2_email?: string;
  speaker3?: string;
  speaker3_email?: string;
  category?: string;
}

export interface AdjudicatorCsvRow {
  name: string;
  institution?: string;
  score?: string | number;
  email?: string;
  trainee?: string | boolean;
  independent?: string | boolean;
}

export interface VenueCsvRow {
  name: string;
  priority?: string | number;
  category?: string;
}

/**
 * Parses CSV text to Teams and Speakers array.
 */
export function parseTeamsCsv(csvContent: string, tournamentId: string): Team[] {
  const parsed = Papa.parse<Record<string, string>>(csvContent, { header: true, skipEmptyLines: true });
  const teams: Team[] = [];

  parsed.data.forEach((row, idx) => {
    const name = row.name || row.team || row.Team || `Team ${idx + 1}`;
    const instName = row.institution || row.Institution || row.inst || "";
    const speakers = [];

    // Extract speaker 1, 2, 3, etc.
    const spk1 = row.speaker1 || row.Speaker1 || row.speaker_1 || row["Speaker 1"];
    if (spk1) speakers.push({ id: `spk-${Date.now()}-${idx}-1`, name: spk1.trim(), email: row.speaker1_email });

    const spk2 = row.speaker2 || row.Speaker2 || row.speaker_2 || row["Speaker 2"];
    if (spk2) speakers.push({ id: `spk-${Date.now()}-${idx}-2`, name: spk2.trim(), email: row.speaker2_email });

    const spk3 = row.speaker3 || row.Speaker3 || row.speaker_3 || row["Speaker 3"];
    if (spk3) speakers.push({ id: `spk-${Date.now()}-${idx}-3`, name: spk3.trim(), email: row.speaker3_email });

    // If no numbered speakers, check single speakers column or default
    if (speakers.length === 0) {
      speakers.push({ id: `spk-${Date.now()}-${idx}-1`, name: `${name} Speaker 1` });
      speakers.push({ id: `spk-${Date.now()}-${idx}-2`, name: `${name} Speaker 2` });
    }

    teams.push({
      id: `team-${Date.now()}-${idx}`,
      tournamentId,
      name: name.trim(),
      codeName: row.code || row.Code,
      institutionName: instName.trim(),
      speakers,
      breakCategories: [],
      speakerCategories: row.category ? [row.category.toLowerCase().trim()] : [],
      checkedIn: true,
    });
  });

  return teams;
}

/**
 * Parses CSV text to Adjudicators array.
 */
export function parseAdjudicatorsCsv(csvContent: string, tournamentId: string): Adjudicator[] {
  const parsed = Papa.parse<Record<string, string>>(csvContent, { header: true, skipEmptyLines: true });
  const adjs: Adjudicator[] = [];

  parsed.data.forEach((row, idx) => {
    const name = row.name || row.Name || row.adjudicator || row.Adjudicator || `Judge ${idx + 1}`;
    const scoreVal = parseFloat(row.score || row.Score || row.rating || "5.0") || 5.0;
    const isTrainee = String(row.trainee || row.Trainee || "").toLowerCase() === "true" || String(row.trainee || "").toLowerCase() === "yes";
    const isIndep = String(row.independent || row.Independent || "").toLowerCase() === "true" || String(row.independent || "").toLowerCase() === "yes";

    adjs.push({
      id: `adj-${Date.now()}-${idx}`,
      tournamentId,
      name: name.trim(),
      email: row.email || row.Email,
      institutionName: (row.institution || row.Institution || "").trim(),
      baseScore: scoreVal,
      trainee: isTrainee,
      independent: isIndep,
      checkedIn: true,
      conflicts: [],
    });
  });

  return adjs;
}

/**
 * Parses CSV text to Venues array.
 */
export function parseVenuesCsv(csvContent: string, tournamentId: string): Venue[] {
  const parsed = Papa.parse<Record<string, string>>(csvContent, { header: true, skipEmptyLines: true });
  const venues: Venue[] = [];

  parsed.data.forEach((row, idx) => {
    const name = row.name || row.Name || row.room || row.Room || `Room ${idx + 1}`;
    const priority = parseInt(row.priority || row.Priority || "10", 10) || 10;

    venues.push({
      id: `venue-${Date.now()}-${idx}`,
      tournamentId,
      name: name.trim(),
      priority,
      category: row.category || row.Category,
      available: true,
    });
  });

  return venues;
}

/**
 * Exports standings to downloadable CSV file.
 */
export function exportStandingsToCsv(standings: TeamStandingRow[], tournamentName: string) {
  const csvData = standings.map((s) => ({
    Rank: s.rank,
    Team: s.teamName,
    Institution: s.institutionCode || "",
    Points: s.points,
    "Total Speaker Score": s.totalSpeakerScore,
    "Average Speaker Score": s.averageSpeakerScore,
    "1st Places": s.firstPlaces || 0,
    "2nd Places": s.secondPlaces || 0,
    "3rd Places": s.thirdPlaces || 0,
    "4th Places": s.fourthPlaces || 0,
    Wins: s.wins || 0,
    Margin: s.margins || 0,
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${tournamentName}_Standings.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
