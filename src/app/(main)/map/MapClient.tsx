"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Map, Filter, CheckCircle, MapPin, Briefcase, X } from "lucide-react";
import Link from "next/link";
import type { City, Profession } from "@/lib/types";

// Dynamic import of MapView to prevent SSR issues with Leaflet
const MapView = dynamic(
  () => import("@/components/features/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[50vh] md:h-[60vh] bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-muted)]">Loading map...</div>
      </div>
    ),
  }
);

interface Professional {
  id: string;
  username: string;
  avatar_emoji: string;
  avatar_url: string | null;
  show_photo: boolean;
  city: City;
  profession: Profession;
  bio: string | null;
  is_verified: boolean;
  is_available: boolean;
}

interface MapClientProps {
  professionals: Professional[];
  initialTheme: string;
}

const CITIES: City[] = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Kochi",
  "Goa",
  "Indore",
  "Coimbatore",
  "Nagpur",
  "Vadodara",
  "Surat",
  "Thiruvananthapuram",
  "Bhopal",
  "Visakhapatnam",
  "Mysore",
];

const PROFESSIONS: Profession[] = [
  "Software Engineer",
  "Designer",
  "Product Manager",
  "Data Scientist",
  "Doctor",
  "Lawyer",
  "Therapist",
  "Counselor",
  "Teacher",
  "Professor",
  "Writer",
  "Artist",
  "Musician",
  "Photographer",
  "Filmmaker",
  "Marketing",
  "Finance",
  "HR",
  "Entrepreneur",
  "Consultant",
  "Social Worker",
  "NGO Worker",
  "Activist",
  "Healthcare Worker",
  "Student",
  "Researcher",
  "Journalist",
  "Content Creator",
];

export function MapClient({ professionals, initialTheme }: MapClientProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  // Check if dark mode based on theme preference or system
  const isDarkMode = initialTheme === "dark" ||
    (initialTheme === "system" && typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Filter professionals
  const filteredProfessionals = useMemo(() => {
    return professionals.filter((p) => {
      if (selectedCity && p.city !== selectedCity) return false;
      if (selectedProfession && p.profession !== selectedProfession) return false;
      return true;
    });
  }, [professionals, selectedCity, selectedProfession]);

  const clearFilters = () => {
    setSelectedCity(null);
    setSelectedProfession(null);
  };

  const hasFilters = selectedCity || selectedProfession;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="text-[var(--mint)]" />
          Discover Professionals
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {filteredProfessionals.length} professionals
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[var(--text-muted)]" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* City Filter */}
        <select
          value={selectedCity || ""}
          onChange={(e) => setSelectedCity(e.target.value as City || null)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
        >
          <option value="">All Cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {/* Profession Filter */}
        <select
          value={selectedProfession || ""}
          onChange={(e) => setSelectedProfession(e.target.value as Profession || null)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
        >
          <option value="">All Professions</option>
          {PROFESSIONS.map((profession) => (
            <option key={profession} value={profession}>
              {profession}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--rose)] hover:bg-[var(--rose)]/10 rounded-lg transition-colors"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Map */}
      <div className="h-[50vh] md:h-[60vh] rounded-xl overflow-hidden shadow-lg">
        <MapView
          professionals={filteredProfessionals}
          selectedCity={selectedCity}
          isDarkMode={isDarkMode}
          onMarkerClick={(pro) => setSelectedProfessional(pro as Professional)}
        />
      </div>

      {/* Privacy Notice */}
      <p className="text-xs text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
        <MapPin size={12} />
        Locations are approximate for privacy. Pins are offset by 1-3km from actual locations.
      </p>

      {/* Professional Cards Grid */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Briefcase className="text-[var(--violet)]" size={20} />
          Available Professionals
        </h2>

        {filteredProfessionals.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-[var(--text-muted)]">
              No professionals found matching your filters.
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-secondary mt-4">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProfessionals.map((pro, index) => (
              <motion.div
                key={pro.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/profile/${pro.username}`}>
                  <div
                    className={`card hover:shadow-lg transition-all cursor-pointer ${
                      selectedProfessional?.id === pro.id
                        ? "ring-2 ring-[var(--violet)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {pro.show_photo && pro.avatar_url ? (
                        <img
                          src={pro.avatar_url}
                          alt={pro.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-2xl">
                          {pro.avatar_emoji}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold truncate">{pro.username}</span>
                          {pro.is_verified && (
                            <CheckCircle className="text-[var(--sky)] flex-shrink-0" size={14} />
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-muted)] truncate">
                          {pro.profession}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <MapPin size={12} />
                        {pro.city}
                      </span>
                      {pro.is_available && (
                        <span className="px-2 py-0.5 bg-[var(--teal)]/10 text-[var(--teal)] rounded-full">
                          Available
                        </span>
                      )}
                    </div>

                    {pro.bio && (
                      <p className="text-sm text-[var(--text-muted)] mt-3 line-clamp-2">
                        {pro.bio}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
