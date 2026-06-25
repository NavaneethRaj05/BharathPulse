import { useEffect } from 'react';
import { useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';

export const LocationPicker = ({ isPicking, onLocationPicked, pickedLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (isPicking) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }, [map, isPicking]);

  useMapEvents({
    click(e) {
      if (!isPicking) return;
      const { lat, lng } = e.latlng;
      if (onLocationPicked) {
        onLocationPicked({ lat, lng });
      }
    },
  });

  if (!pickedLocation) return null;

  const pinHtml = `
    <div class="relative flex items-center justify-center">
      <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-70"></span>
      <div class="h-4 w-4 rounded-full bg-blue-500 border-2 border-slate-950 shadow-md"></div>
    </div>
  `;

  const pinIcon = L.divIcon({
    html: pinHtml,
    className: 'custom-picker-pin',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={pinIcon} />
  );
};

export default LocationPicker;
