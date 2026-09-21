"use client";

import React, { useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";
import { parseVenuesCsv } from "@/lib/csv/importer";
import {
  MapPin,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { Venue } from "@/types";

export default function VenuesPage() {
  const { tournament, venues, addVenue, updateVenue, deleteVenue } = useTournament();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPriority, setNewPriority] = useState(10);
  const [newCategory, setNewCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVenues = venues.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await addVenue({
      name: newName.trim(),
      priority: newPriority,
      category: newCategory.trim() || undefined,
      available: true,
    });

    setNewName("");
    setNewPriority(10);
    setNewCategory("");
    setShowAddModal(false);
  };

  const toggleAvailability = async (venue: Venue) => {
    await updateVenue({ ...venue, available: venue.available === false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#d0d7de] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span>Debate Venues & Rooms</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage physical and online debate rooms, priority weights, and availability status.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Venue</span>
        </button>
      </div>

      {/* Venues Table */}
      <div className="bg-white border border-[#d0d7de] rounded-lg shadow-xs overflow-hidden">
        <div className="p-3 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {venues.filter((v) => v.available !== false).length} Active of {venues.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left tabby-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Venue / Room Name</th>
                <th>Category</th>
                <th className="w-24 text-center">Priority</th>
                <th className="w-28 text-center">Availability</th>
                <th className="w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVenues.map((venue, idx) => (
                <tr key={venue.id} className="hover:bg-gray-50">
                  <td className="text-center font-mono text-xs text-gray-500">{idx + 1}</td>
                  <td className="font-bold text-gray-900 text-xs">{venue.name}</td>
                  <td className="text-xs text-gray-500">{venue.category || "General"}</td>
                  <td className="text-center font-mono font-bold text-xs text-blue-600">
                    {venue.priority || 10}
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => toggleAvailability(venue)}
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                        venue.available !== false
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {venue.available !== false ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete venue ${venue.name}?`)) deleteVenue(venue.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                      title="Delete Venue"
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

      {/* Add Venue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Add New Venue</span>
            </h3>
            <form onSubmit={handleCreateVenue} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture Theatre 1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Priority Rank (Higher = Better room used for top bracket debates)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newPriority}
                  onChange={(e) => setNewPriority(parseInt(e.target.value, 10))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category (e.g. Accessible, Online, Main Hall)
                </label>
                <input
                  type="text"
                  placeholder="General"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
