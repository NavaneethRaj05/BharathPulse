import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    const heatPoints = points
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => [p.lat, p.lng, p.weight || 0.5]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 18,
      gradient: {
        0.2: '#10b981', // green
        0.5: '#f59e0b', // amber
        0.8: '#ef4444', // red
        1.0: '#b91c1c', // deep red
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
