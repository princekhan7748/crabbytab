import React from "react";
import { TournamentProvider } from "@/contexts/TournamentContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tournamentSlug: string }>;
}) {
  const resolvedParams = await params;
  const tournamentSlug = resolvedParams.tournamentSlug;

  return (
    <TournamentProvider tournamentSlug={tournamentSlug}>
      <div className="min-h-screen bg-[#f6f8fa] flex flex-col">
        <Navbar tournamentSlug={tournamentSlug} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar tournamentSlug={tournamentSlug} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </TournamentProvider>
  );
}
