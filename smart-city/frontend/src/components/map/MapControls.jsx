import React from 'react';
import { useMap } from 'react-leaflet';
import { Navigation, Maximize } from 'lucide-react';

export const MapControls = ({ onResetView }) => {
  const map = useMap();

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 16 });
  };

  const handleReset = () => {
    if (onResetView) {
      onResetView();
    } else {
      map.setView([12.9716, 77.5946], 12);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 select-none">
      <button
        onClick={handleLocate}
        className="p-3 bg-slate-900/90 text-white rounded-xl border border-white/10 shadow-lg hover:bg-slate-800 transition-colors cursor-pointer"
        title="Locate Me"
      >
        <Navigation className="w-5 h-5 text-sky-400" />
      </button>
      <button
        onClick={handleReset}
        className="p-3 bg-slate-900/90 text-white rounded-xl border border-white/10 shadow-lg hover:bg-slate-800 transition-colors cursor-pointer"
        title="Reset View"
      >
        <Maximize className="w-5 h-5 text-slate-300" />
      </button>
    </div>
  );
};

export default MapControls;
