import React, { useRef, useEffect } from 'react';
import { GeoJSON } from 'react-leaflet';
import { WARD_COLORS } from '../../constants/mapConfig';

export const WardBoundaryLayer = ({ wards = [], onWardClick, selectedWardId }) => {
  const geoJsonRef = useRef(null);

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer) => {
        const isSelected = selectedWardId === layer.feature.properties.id;
        const wardId = layer.feature.properties.id;
        const wardData = wards.find((w) => w.id === wardId);
        const openCount = wardData?.stats?.open ?? 0;

        let color = '#00D084'; // Success (Healthy)
        let animateClass = '';

        if (openCount > 25) {
          color = '#FF5C7A'; // Danger (Critical)
          animateClass = 'pulse-danger-ward';
        } else if (openCount > 10) {
          color = '#FFB020'; // Warning (Moderate)
        } else if (openCount > 0) {
          color = '#5B8CFF'; // Primary (Mild)
        }

        layer.setStyle({
          weight: isSelected ? 3 : 1.2,
          color: isSelected ? '#ffffff' : color,
          fillColor: color,
          fillOpacity: isSelected ? 0.35 : 0.12,
          dashArray: isSelected ? '0' : '4 4',
          className: animateClass
        });
        
        if (isSelected) {
          layer.bringToFront();
        }
      });
    }
  }, [selectedWardId, wards]);

  const onEachFeature = (feature, layer) => {
    const wardId = feature.properties.id;
    const wardData = wards.find((w) => w.id === wardId);
    
    const openCount = wardData?.stats?.open ?? 0;
    const resolvedCount = wardData?.stats?.resolved ?? 0;
    const sla = wardData?.stats?.slaCompliance ?? 100;
    const avgHrs = wardData?.stats?.avgResolutionHours ?? 0;

    layer.bindTooltip(
      `<div class="text-[10px] font-mono leading-relaxed text-left p-1 select-none">
        <div class="font-black text-xs text-white uppercase">${feature.properties.name} (${feature.properties.number})</div>
        <div class="h-px bg-white/10 my-1"></div>
        <div>Open Tickets: <span class="font-black text-[#FFB020]">${openCount}</span></div>
        <div>Resolved: <span class="font-black text-[#00D084]">${resolvedCount}</span></div>
        <div>SLA Met: <span class="font-black text-[#5B8CFF]">${sla}%</span></div>
      </div>`,
      { sticky: true, opacity: 0.95, className: 'ward-label-tooltip' }
    );

    layer.on({
      mouseover: (e) => {
        const isSelected = selectedWardId === wardId;
        const openCountVal = wardData?.stats?.open ?? 0;
        let hoverColor = '#00D084';
        if (openCountVal > 25) hoverColor = '#FF5C7A';
        else if (openCountVal > 10) hoverColor = '#FFB020';
        else if (openCountVal > 0) hoverColor = '#5B8CFF';

        e.target.setStyle({
          fillOpacity: isSelected ? 0.45 : 0.28,
          weight: isSelected ? 3 : 2,
          color: isSelected ? '#ffffff' : hoverColor,
        });
      },
      mouseout: (e) => {
        const isSelected = selectedWardId === wardId;
        const openCountVal = wardData?.stats?.open ?? 0;
        let baseColor = '#00D084';
        if (openCountVal > 25) baseColor = '#FF5C7A';
        else if (openCountVal > 10) baseColor = '#FFB020';
        else if (openCountVal > 0) baseColor = '#5B8CFF';

        e.target.setStyle({
          fillOpacity: isSelected ? 0.35 : 0.12,
          weight: isSelected ? 3 : 1.2,
          color: isSelected ? '#ffffff' : baseColor,
        });
      },
      click: (e) => {
        if (onWardClick && wardData) {
          onWardClick(wardData);
        }
        const map = e.target._map;
        if (map) {
          map.fitBounds(e.target.getBounds(), { padding: [40, 40] });
        }
      },
    });
  };

  const getStyle = (feature) => {
    const wardId = feature.properties.id;
    const wardData = wards.find((w) => w.id === wardId);
    const openCount = wardData?.stats?.open ?? 0;

    let color = '#00D084';
    let animateClass = '';

    if (openCount > 25) {
      color = '#FF5C7A';
      animateClass = 'pulse-danger-ward';
    } else if (openCount > 10) {
      color = '#FFB020';
    } else if (openCount > 0) {
      color = '#5B8CFF';
    }

    const isSelected = selectedWardId === wardId;

    return {
      fillColor: color,
      fillOpacity: isSelected ? 0.35 : 0.12,
      color: isSelected ? '#ffffff' : color,
      weight: isSelected ? 3 : 1.2,
      dashArray: isSelected ? '0' : '4 4',
      className: animateClass,
    };
  };

  const geoJsonData = {
    type: 'FeatureCollection',
    features: wards.map((w) => ({
      type: 'Feature',
      properties: {
        id: w.id,
        name: w.name,
        number: w.number,
        zone: w.zone,
        district: w.district,
      },
      geometry: w.boundary,
    })),
  };

  if (wards.length === 0) return null;

  return (
    <GeoJSON
      key={JSON.stringify(wards.map((w) => w.id + '-' + (w.stats?.open ?? 0)))}
      ref={geoJsonRef}
      data={geoJsonData}
      style={getStyle}
      onEachFeature={onEachFeature}
    />
  );
};

export default WardBoundaryLayer;
