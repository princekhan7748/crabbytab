import React from "react";
import { DebateSide } from "@/types";

export function SideBadge({ side }: { side: DebateSide }) {
  const getBadgeClass = () => {
    switch (side) {
      case "OG":
        return "side-badge-og";
      case "OO":
        return "side-badge-oo";
      case "CG":
        return "side-badge-cg";
      case "CO":
        return "side-badge-co";
      case "AFF":
        return "side-badge-aff";
      case "NEG":
        return "side-badge-neg";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getLabel = () => {
    switch (side) {
      case "OG":
        return "OG (Opening Gov)";
      case "OO":
        return "OO (Opening Opp)";
      case "CG":
        return "CG (Closing Gov)";
      case "CO":
        return "CO (Closing Opp)";
      case "AFF":
        return "Affirmative";
      case "NEG":
        return "Negative";
      default:
        return side;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${getBadgeClass()}`}
    >
      {side}
    </span>
  );
}
