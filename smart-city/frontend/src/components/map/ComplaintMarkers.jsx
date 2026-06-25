import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

export const ComplaintMarkers = ({ complaints = [], onComplaintClick, selectedId }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !complaints) return;

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let sizeClass = 'small';
        if (count > 10) sizeClass = 'medium';
        if (count > 50) sizeClass = 'large';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `custom-cluster-icon ${sizeClass}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    const categoryColors = {
      Sanitation: '#00D084',       // Success
      Roads: '#FF5C7A',            // Danger
      'Water Department': '#5B8CFF', // Primary
      Electrical: '#FFB020',       // Warning
      General: '#7C3AED',          // Accent
    };

    complaints.forEach((c) => {
      if (c.lat == null || c.lng == null) return;

      const markerColor = categoryColors[c.category] || '#94a3b8';
      const isSelected = selectedId === c.id;

      // Custom marker icon with premium pulsing rings
      const markerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="pulse-ring" style="background-color: ${markerColor}; border: 1.5px solid ${markerColor};"></div>
          <div class="h-3 w-3 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(0,0,0,0.6)] transition-all duration-300 ${
            isSelected 
              ? 'scale-150 ring-2 ring-white shadow-[0_0_15px_rgba(91,140,255,0.7)]' 
              : 'hover:scale-125'
          }" style="background-color: ${markerColor}"></div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-complaint-icon',
        iconSize: L.point(16, 16),
        iconAnchor: L.point(8, 8),
      });

      const marker = L.marker([c.lat, c.lng], { icon: markerIcon });
      
      marker.on('click', () => {
        if (onComplaintClick) onComplaintClick(c);
      });

      marker.bindTooltip(
        `<div class="text-[10px] font-mono leading-relaxed text-left p-1 select-none">
          <div class="text-slate-500 font-extrabold">${c.code || 'TICKET'}</div>
          <div class="text-white font-bold mt-0.5">${c.title}</div>
          <div class="h-px bg-white/10 my-1"></div>
          <div class="flex gap-1.5 items-center">
            <span class="inline-block w-1.5 h-1.5 rounded-full" style="background-color: ${markerColor}"></span>
            <span class="text-slate-400 font-bold uppercase tracking-wider">${c.category}</span>
          </div>
         </div>`,
        { direction: 'top', offset: [0, -6], opacity: 0.98, className: 'ward-label-tooltip' }
      );

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, complaints, onComplaintClick, selectedId]);

  return null;
};

export default ComplaintMarkers;
