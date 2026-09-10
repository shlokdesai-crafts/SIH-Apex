import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useTranslation } from '../i18n/useTranslation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
}

function LocationMarker({ onLocationSelect, initialLocation }: LocationPickerMapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLocation ? new L.LatLng(initialLocation.lat, initialLocation.lng) : null
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (initialLocation) {
      const latlng = new L.LatLng(initialLocation.lat, initialLocation.lng);
      // Only fly if position is null or significantly different to avoid loop
      if (!position || position.distanceTo(latlng) > 10) {
        setPosition(latlng);
        map.flyTo(latlng, 14);
      }
    }
  }, [initialLocation, map, position]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function LocationPickerMap({ onLocationSelect, initialLocation }: LocationPickerMapProps) {
  const { t } = useTranslation();
  // Center of Maharashtra
  const defaultCenter = { lat: 19.7515, lng: 75.7139 };
  const center = initialLocation || defaultCenter;
  const LOCATION_TOKEN = import.meta.env.VITE_LOCATION_TOKEN as string;

  // Maharashtra boundaries (South-West to North-East)
  const maharashtraBounds = L.latLngBounds(
    [15.6, 72.6], // SW
    [22.0, 80.9]  // NE
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="map-container-wrapper" style={{ marginTop: '10px' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={initialLocation ? 13 : 6}
        scrollWheelZoom={true}
        maxBounds={maharashtraBounds}
        maxBoundsViscosity={1.0}
        minZoom={6}
        style={{ height: '200px', width: '100%', borderRadius: '8px', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://locationiq.com/?ref=maps">LocationIQ</a>'
          url={`https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATION_TOKEN}`}
          subdomains={['a', 'b', 'c', 'd']}
        />
        <LocationMarker onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
      </MapContainer>
      <p className="map-hint" style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px', textAlign: 'center' }}>
        {t('auth.clickMapPin') || 'Click on the map to drop a pin'}
      </p>
    </div>
  );
}
