"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapListing = {
  id: string;
  title: string;
  suburb: string;
  status: string;
  price: number;
  latitude: number;
  longitude: number;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#2a78d6",
  UNDER_OFFER: "#d97706",
  SOLD: "#1baf7a",
};

// Free Carto basemaps — no API key needed (unlike Google Maps).
const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function formatRand(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ListingsMap({ listings }: { listings: MapListing[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tilesRef = useRef<TileLayer | null>(null);
  const [ready, setReady] = useState(false);

  const isDark = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );

  // Leaflet touches `window` on import, so it can only load in the browser.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: false });
      mapRef.current = map;

      const points = listings.map((l) => [l.latitude, l.longitude] as [number, number]);
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points).pad(0.2));
      } else {
        map.setView([-25.87, 28.17], 12); // Centurion, Gauteng
      }

      for (const l of listings) {
        L.circleMarker([l.latitude, l.longitude], {
          radius: 8,
          color: STATUS_COLORS[l.status] ?? "#78716c",
          weight: 2,
          fillColor: STATUS_COLORS[l.status] ?? "#78716c",
          fillOpacity: 0.35,
        })
          .addTo(map)
          .bindPopup(
            `<a href="/listings/${l.id}" style="font-weight:600">${l.title}</a><br/>` +
              `${l.suburb} · ${formatRand(l.price)}<br/>` +
              `<span style="text-transform:capitalize">${l.status.toLowerCase().replace("_", " ")}</span>`
          );
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      tilesRef.current = null;
    };
    // The map is initialized once; listings are static per server render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tiles when the theme changes (and add the initial layer once ready).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (mapRef.current !== map) return;
      tilesRef.current?.remove();
      tilesRef.current = L.tileLayer(isDark ? TILES.dark : TILES.light, {
        attribution: ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
    })();
  }, [isDark, ready]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div ref={containerRef} className="h-72 sm:h-105 rounded-xl z-0 bg-stone-100 dark:bg-stone-800" />
      <div className="absolute bottom-3 left-3 z-[500] bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 flex gap-4 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {status === "UNDER_OFFER" ? "Under offer" : status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
