import React from 'react';
import { useMap } from 'react-leaflet';
import { Maximize, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

export const MapControls = ({ onResetView, is3D, onToggle3D }) => {
  const map = useMap();

  const handleLocate = () => {
    if (navigator.geolocation) {
      toast.loading("Locating current position...", { id: 'locate-toast' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 15, { duration: 1.5 });
          toast.success("Centered on GPS coordinates", { id: 'locate-toast' });
        },
        (error) => {
          console.error(error);
          // Fallback to leaflet's native locate
          toast.dismiss('locate-toast');
          map.locate({ setView: true, maxZoom: 15 });
        }
      );
    } else {
      map.locate({ setView: true, maxZoom: 15 });
    }
  };

  const handleReset = () => {
    if (onResetView) {
      onResetView();
    } else {
      map.flyTo([20.5937, 78.9629], 4, { duration: 1.5 });
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2.5 select-none items-center">
      {/* Apple style Zoom +/- stack */}
      <div className="flex flex-col rounded-xl border border-white/10 shadow-xl overflow-hidden bg-slate-900/90 backdrop-blur-md">
        <button
          onClick={() => map.zoomIn()}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-b border-white/5 text-sm font-black flex items-center justify-center w-9 h-9"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-sm font-black flex items-center justify-center w-9 h-9"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Geolocation compass button */}
      <button
        onClick={handleLocate}
        className="p-2.5 bg-slate-900/90 text-white rounded-xl border border-white/10 shadow-xl hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center w-9 h-9 glow-primary"
        title="Locate Me (GPS)"
      >
        <Compass className="w-4.5 h-4.5 text-[#5B8CFF]" />
      </button>

      {/* 3D view toggle button */}
      <button
        onClick={onToggle3D}
        className={`bg-slate-900/90 text-slate-300 rounded-xl border border-white/10 shadow-xl hover:bg-slate-800 hover:text-white transition-all cursor-pointer flex items-center justify-center w-9 h-9 text-[10px] font-mono font-black ${
          is3D ? 'border-[#5B8CFF] text-[#5B8CFF] shadow-[0_0_8px_rgba(91,140,255,0.3)] bg-slate-800' : ''
        }`}
        title="Toggle 3D View perspective"
      >
        3D
      </button>

      {/* Reset view maximize button */}
      <button
        onClick={handleReset}
        className="p-2.5 bg-slate-900/90 text-slate-300 rounded-xl border border-white/10 shadow-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer flex items-center justify-center w-9 h-9"
        title="Reset National View"
      >
        <Maximize className="w-4.5 h-4.5" />
      </button>
    </div>
  );
};

export default MapControls;
