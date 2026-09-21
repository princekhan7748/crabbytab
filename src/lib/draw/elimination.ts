import { Team, DebateSide, TournamentFormat } from "@/types";

export interface EliminationRoomDraft {
  roomNumber: number;
  bracketName: string;
  teams: { team: Team; seed: number; side: DebateSide }[];
}

/**
 * Standard seeded elimination brackets for British Parliamentary and 2-Team tournaments.
 */
export function generateEliminationDraw(
  breakingTeams: { team: Team; seed: number }[],
  format: TournamentFormat,
  bracketSize: number // 16, 8, 4, 2
): EliminationRoomDraft[] {
  const isBP = format === "bp";
  const bpSides: DebateSide[] = ["OG", "OO", "CG", "CO"];
  const twoTeamSides: DebateSide[] = ["AFF", "NEG"];

  if (isBP) {
    if (bracketSize === 16) {
      // 4 Quarter-final rooms of 4 teams each
      const roomSeedings = [
        [1, 8, 9, 16],
        [4, 5, 12, 13],
        [2, 7, 10, 15],
        [3, 6, 11, 14],
      ];

      return roomSeedings.map((seeds, rIdx) => {
        const roomTeams = seeds.map((s, sIdx) => {
          const entry = breakingTeams.find((b) => b.seed === s);
          return {
            team: entry?.team || ({ id: `t-placeholder-${s}`, name: `Seed ${s}`, breakCategories: [], speakers: [] } as any),
            seed: s,
            side: bpSides[sIdx % 4],
          };
        });

        return {
          roomNumber: rIdx + 1,
          bracketName: `Quarter-Final Room ${rIdx + 1}`,
          teams: roomTeams,
        };
      });
    } else if (bracketSize === 8) {
      // 2 Semi-final rooms of 4 teams each
      const roomSeedings = [
        [1, 4, 5, 8],
        [2, 3, 6, 7],
      ];

      return roomSeedings.map((seeds, rIdx) => {
        const roomTeams = seeds.map((s, sIdx) => {
          const entry = breakingTeams.find((b) => b.seed === s);
          return {
            team: entry?.team || ({ id: `t-placeholder-${s}`, name: `Seed ${s}`, breakCategories: [], speakers: [] } as any),
            seed: s,
            side: bpSides[sIdx % 4],
          };
        });

        return {
          roomNumber: rIdx + 1,
          bracketName: `Semi-Final Room ${rIdx + 1}`,
          teams: roomTeams,
        };
      });
    } else if (bracketSize === 4) {
      // Grand Final
      const roomTeams = [1, 2, 3, 4].map((s, sIdx) => {
        const entry = breakingTeams.find((b) => b.seed === s);
        return {
          team: entry?.team || ({ id: `t-placeholder-${s}`, name: `Seed ${s}`, breakCategories: [], speakers: [] } as any),
          seed: s,
          side: bpSides[sIdx % 4],
        };
      });

      return [
        {
          roomNumber: 1,
          bracketName: "Grand Final",
          teams: roomTeams,
        },
      ];
    }
  } else {
    // 2-Team Format (UADC / Australs / WSDC)
    const pairs: [number, number][] = [];
    if (bracketSize === 16) {
      pairs.push([1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11]);
    } else if (bracketSize === 8) {
      pairs.push([1, 8], [4, 5], [2, 7], [3, 6]);
    } else if (bracketSize === 4) {
      pairs.push([1, 4], [2, 3]);
    } else if (bracketSize === 2) {
      pairs.push([1, 2]);
    }

    return pairs.map(([s1, s2], idx) => {
      const e1 = breakingTeams.find((b) => b.seed === s1);
      const e2 = breakingTeams.find((b) => b.seed === s2);
      return {
        roomNumber: idx + 1,
        bracketName: `Elimination Match ${idx + 1}`,
        teams: [
          {
            team: e1?.team || ({ id: `t-${s1}`, name: `Seed ${s1}`, breakCategories: [], speakers: [] } as any),
            seed: s1,
            side: "AFF",
          },
          {
            team: e2?.team || ({ id: `t-${s2}`, name: `Seed ${s2}`, breakCategories: [], speakers: [] } as any),
            seed: s2,
            side: "NEG",
          },
        ],
      };
    });
  }

  return [];
}
