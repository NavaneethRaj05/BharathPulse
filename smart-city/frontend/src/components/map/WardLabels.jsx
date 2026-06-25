import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

const transparentIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: '<div style="width:0;height:0;"></div>',
  iconSize: [0, 0],
});

export const WardLabels = ({ wards }) => {
  const getCentroid = (coordinates) => {
    try {
      const ring = coordinates[0];
      let sumLat = 0;
      let sumLng = 0;
      ring.forEach((pt) => {
        sumLng += pt[0];
        sumLat += pt[1];
      });
      return [sumLat / ring.length, sumLng / ring.length];
    } catch (e) {
      return [12.9716, 77.5946];
    }
  };

  return (
    <>
      {wards.map((ward) => {
        if (!ward.boundary || ward.boundary.type !== 'Polygon') return null;
        const position = getCentroid(ward.boundary.coordinates);
        return (
          <Marker
            key={`label-${ward.id}`}
            position={position}
            icon={transparentIcon}
            interactive={false}
          >
            <Tooltip
              permanent
              direction="center"
              className="ward-label-tooltip"
              interactive={false}
            >
              <div className="flex flex-col items-center select-none pointer-events-none">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-200">{ward.name}</span>
                <span className="text-[8px] font-bold text-slate-400">{ward.number}</span>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};

export default WardLabels;
