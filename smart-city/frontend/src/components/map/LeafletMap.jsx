import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { MAP_CONFIG } from '../../constants/mapConfig';
import WardBoundaryLayer from './WardBoundaryLayer';
import ComplaintMarkers from './ComplaintMarkers';
import HeatmapLayer from './HeatmapLayer';
import WardLabels from './WardLabels';
import LocationPicker from './LocationPicker';
import MapControls from './MapControls';

// Component to dynamically update map views
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

export const LeafletMap = ({
  wards,
  complaints,
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
}) => {
  const tileUrl = isDarkMode ? MAP_CONFIG.tileUrl : MAP_CONFIG.lightTileUrl;

  return (
    <div className="w-full h-full relative">
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

        <MapControls onResetView={onResetView} />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
