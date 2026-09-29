import React, { useEffect, useRef } from 'react';
import { getDirectionsUrl } from '../lib/geo.ts';

interface LeafletMapProps {
  coordinates: [number, number]; // [lng, lat]
  title: string;
  landmark?: string;
  policePostNearby?: string;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  coordinates,
  title,
  landmark,
  policePostNearby = 'Police Post ~40m',
  height = 'h-64'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [lng, lat] = coordinates;

  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (!mapContainerRef.current) return;
      try {
        const L = (await import('leaflet')).default;
        // Avoid duplicate maps
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false
        });

        // OpenStreetMap Dark/Standard tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        // Custom Marigold / Rani pink marker
        const customIcon = L.divIcon({
          className: 'custom-garba-pin',
          html: `<div style="background-color: #FF9F1C; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #150E2E; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(255,159,28,0.7); color: #1A1033; font-weight: bold; font-size: 16px;">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`<b>${title}</b><br/>${landmark || 'Designated Gate Rendezvous'}`).openPopup();

        if (isMounted) {
          mapInstanceRef.current = map;
        }
      } catch (err) {
        console.warn('Leaflet load warning (falling back to vector graphic):', err);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, title, landmark]);

  const directionsUrl = getDirectionsUrl(lat, lng, landmark || title);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden bg-[#1D1637] border border-[#373051] shadow-inner`}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Info */}
      <div className="absolute top-3 left-3 z-10 bg-[#150E2E]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#373051] shadow-lg flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#FF9F1C] animate-ping"></span>
        <span className="text-xs font-bold text-[#FF9F1C]">{title}</span>
      </div>

      {policePostNearby && (
        <div className="absolute top-3 right-3 z-10 bg-[#E0218A]/20 backdrop-blur-md text-[#FFB0CD] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#E0218A]/40 flex items-center gap-1 shadow-md">
          <span className="material-symbols-outlined text-[14px]">local_police</span>
          <span>{policePostNearby}</span>
        </div>
      )}

      {/* Bottom Floating Directions Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 bg-[#211B3B]/95 backdrop-blur-md p-2.5 rounded-xl border border-[#373051] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="material-symbols-outlined text-[#17B6A7] text-[18px]">fmd_good</span>
          <span className="text-xs text-[#FFF7ED] truncate">{landmark || 'Gate 2 Safe Meetup Area'}</span>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-[#FF9F1C] hover:bg-[#FFB86B] text-[#1A1033] font-bold text-xs flex items-center gap-1 shrink-0 shadow-md transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[15px]">directions</span>
          <span>Google Maps</span>
        </a>
      </div>
    </div>
  );
};
