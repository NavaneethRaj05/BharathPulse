import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CONFIG } from '../../constants/mapConfig';
import WardBoundaryLayer from './WardBoundaryLayer';
import ComplaintMarkers from './ComplaintMarkers';
import HeatmapLayer from './HeatmapLayer';
import WardLabels from './WardLabels';
import LocationPicker from './LocationPicker';
import MapControls from './MapControls';
import { Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Component to dynamically update map views based on bounds/center
const MapViewUpdater = ({ center, zoom, bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [map, center, zoom, bounds]);

  return null;
};

// Component to watch map zoom and transition to Globe when zooming out past threshold
const ZoomWatcher = ({ onZoomOutToGlobe }) => {
  const map = useMap();

  useEffect(() => {
    const handleZoomEnd = () => {
      if (map.getZoom() <= 2.5 && onZoomOutToGlobe) {
        onZoomOutToGlobe();
      }
    };
    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomOutToGlobe]);

  return null;
};

// Floating Apple Maps style Search Box sitting inside the Leaflet context
const FloatingSearchBar = () => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Prevent Leaflet from hijacking click, double click, scroll, and mouse down events
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const toastId = toast.loading(`Searching for "${query}"...`);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const targetCoords = [parseFloat(lat), parseFloat(lon)];
        
        // Center and fly to search target smoothly
        map.flyTo(targetCoords, 14, { duration: 1.8 });
        
        toast.success(`Centered on ${display_name.split(',')[0]}`, { id: toastId });
        setQuery('');
      } else {
        toast.error("Location not resolved on national map", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Address geocoding service offline", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="absolute top-4 left-4 z-[1000] w-72 select-none pointer-events-auto"
      onKeyDown={(e) => e.stopPropagation()} // Stop Leaflet from intercepting keyboard events
    >
      <form 
        onSubmit={handleSearch}
        className="flex items-center bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl px-3.5 py-2.5 focus-within:border-[#5B8CFF] focus-within:ring-1 focus-within:ring-[#5B8CFF]/50 transition-all gap-2"
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search villages, cities, wards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full font-bold"
        />
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 text-[#5B8CFF] animate-spin shrink-0" />
        ) : (
          <button type="submit" className="text-[10px] font-black text-[#5B8CFF] hover:text-white uppercase transition-colors cursor-pointer shrink-0">
            Go
          </button>
        )}
      </form>
    </div>
  );
};

export const LeafletMap = ({
  wards = [],
  complaints = [],
  activeLayers,
  isPickingLocation,
  onLocationPicked,
  pickedLocation,
  center,
  zoom,
  bounds,
  onWardClick,
  onComplaintClick,
  selectedWardId,
  selectedComplaintId,
  onResetView,
  isDarkMode = true,
  onZoomOutToGlobe,
}) => {
  const [is3D, setIs3D] = useState(false);
  const tileUrl = isDarkMode ? MAP_CONFIG.tileUrl : MAP_CONFIG.lightTileUrl;

  return (
    <div className={`w-full h-full relative transition-all duration-700 ${is3D ? 'map-tilted' : ''}`}>
      {/* Sci-Fi Hologram Grid Overlay */}
      <div className="hologram-grid"></div>

      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url={tileUrl}
          attribution={MAP_CONFIG.attribution}
        />

        <MapViewUpdater center={center} zoom={zoom} bounds={bounds} />
        <ZoomWatcher onZoomOutToGlobe={onZoomOutToGlobe} />

        {/* geocoder address search bar */}
        <FloatingSearchBar />

        {activeLayers.wards && (
          <WardBoundaryLayer
            wards={wards}
            onWardClick={onWardClick}
            selectedWardId={selectedWardId}
          />
        )}

        {activeLayers.labels && activeLayers.wards && (
          <WardLabels wards={wards} />
        )}

        {activeLayers.markers && (
          <ComplaintMarkers
            complaints={complaints}
            onComplaintClick={onComplaintClick}
            selectedId={selectedComplaintId}
          />
        )}

        {activeLayers.heatmap && (
          <HeatmapLayer
            points={complaints.map((c) => ({
              lat: c.lat,
              lng: c.lng,
              weight: c.isEscalated ? 1.0 : c.status === 'Pending' ? 0.7 : 0.4,
            }))}
          />
        )}

        <LocationPicker
          isPicking={isPickingLocation}
          onLocationPicked={onLocationPicked}
          pickedLocation={pickedLocation}
        />

        <MapControls 
          onResetView={onResetView} 
          is3D={is3D}
          onToggle3D={() => setIs3D(!is3D)}
        />
      </MapContainer>

      {/* Floating Apple-style Weather / Info overlay chip */}
      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col items-start bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 shadow-xl select-none text-[9px] font-black text-slate-400 gap-0.5 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🌤️</span>
          <span className="text-slate-200">NDLS: 28°C</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] animate-pulse"></span>
          <span>AQI: 72 (Good)</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;
