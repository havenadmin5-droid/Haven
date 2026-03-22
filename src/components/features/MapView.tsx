"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getFuzzyCoordinates, getDefaultMapCenter, getDefaultZoom, getCityZoom, CITY_COORDINATES } from "@/lib/utils/location";
import type { City, Profession } from "@/lib/types";

// Fix for default marker icons in Leaflet with Next.js - run once
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
}

interface Professional {
  id: string;
  username: string;
  avatar_emoji: string;
  city: City;
  profession: Profession;
  is_verified: boolean;
  is_available: boolean;
}

interface MapViewProps {
  professionals: Professional[];
  selectedCity?: City | null;
  isDarkMode?: boolean;
  onMarkerClick?: (professional: Professional) => void;
}

// Create custom emoji marker icon
function createEmojiIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    html: `<div class="emoji-marker">${emoji}</div>`,
    className: "custom-emoji-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

// Generate unique ID for each mount
let mapIdCounter = 0;

export function MapView({
  professionals,
  selectedCity,
  isDarkMode = false,
  onMarkerClick,
}: MapViewProps) {
  const [containerId] = useState(() => `map-${++mapIdCounter}-${Date.now()}`);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Initialize map after DOM is ready
  useEffect(() => {
    // Wait for next tick to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container || mapRef.current) return;

      try {
        // Create map
        const map = L.map(container, {
          center: getDefaultMapCenter(),
          zoom: getDefaultZoom(),
        });

        mapRef.current = map;

        // Add tile layer
        const tileUrl = isDarkMode
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

        const attribution = isDarkMode
          ? '&copy; OpenStreetMap &copy; CARTO'
          : '&copy; OpenStreetMap';

        L.tileLayer(tileUrl, { attribution }).addTo(map);

        // Invalidate size after a short delay to handle container sizing
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        setIsReady(true);
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapRef.current = null;
      }
      markersRef.current = [];
      setIsReady(false);
    };
  }, [containerId, isDarkMode]);

  // Handle city changes
  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    const map = mapRef.current;

    if (selectedCity && selectedCity !== "Other" && CITY_COORDINATES[selectedCity]) {
      map.flyTo(CITY_COORDINATES[selectedCity], getCityZoom(), { duration: 1 });
    } else {
      map.flyTo(getDefaultMapCenter(), getDefaultZoom(), { duration: 1 });
    }
  }, [selectedCity, isReady]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !isReady) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => {
      try {
        m.remove();
      } catch (e) {
        // Ignore
      }
    });
    markersRef.current = [];

    // Add markers
    professionals.forEach((pro) => {
      const coords = getFuzzyCoordinates(pro.city, pro.id);
      const marker = L.marker(coords, {
        icon: createEmojiIcon(pro.avatar_emoji),
      });

      const popupContent = `
        <div style="text-align: center; min-width: 140px;">
          <div style="font-size: 28px; margin-bottom: 6px;">${pro.avatar_emoji}</div>
          <div style="font-weight: 600; font-size: 14px;">
            ${pro.username}
            ${pro.is_verified ? ' <span style="color: #4DA6FF;">✓</span>' : ''}
          </div>
          <p style="font-size: 12px; color: #6B6280; margin: 4px 0 0 0;">${pro.profession}</p>
          <p style="font-size: 11px; color: #A09AB2; margin: 2px 0 0 0;">${pro.city}</p>
          ${pro.is_available ? '<span style="display: inline-block; margin-top: 6px; font-size: 10px; padding: 2px 8px; background: rgba(0, 201, 167, 0.15); color: #00C9A7; border-radius: 12px;">Available</span>' : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'haven-popup'
      });

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(pro));
      }

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [professionals, onMarkerClick, isReady]);

  return (
    <>
      <style jsx global>{`
        .custom-emoji-marker {
          background: none !important;
          border: none !important;
        }
        .emoji-marker {
          width: 40px;
          height: 40px;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary, #fff);
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 2px solid var(--border-color, #E8E4F0);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .emoji-marker:hover {
          transform: scale(1.15);
        }
        .leaflet-popup-content-wrapper {
          background: var(--bg-primary, #fff);
          color: var(--text-primary, #2D2640);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          padding: 0;
        }
        .leaflet-popup-tip {
          background: var(--bg-primary, #fff);
        }
        .leaflet-popup-content {
          margin: 12px 14px;
        }
        .leaflet-container {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>

      <div
        id={containerId}
        className="w-full h-full rounded-xl"
        style={{ minHeight: "400px", background: "var(--bg-secondary)" }}
      />
    </>
  );
}
