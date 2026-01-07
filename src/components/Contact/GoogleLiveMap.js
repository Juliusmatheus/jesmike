import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';

const WINDHOEK_CENTER = { lat: -22.5609, lng: 17.0658 };

function OpenStreetMapEmbed({ center = WINDHOEK_CENTER }) {
  const { lat, lng } = center;
  const dLat = 0.03;
  const dLng = 0.03;
  const left = lng - dLng;
  const right = lng + dLng;
  const top = lat + dLat;
  const bottom = lat - dLat;
  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <iframe
        title="Map"
        src={src}
        style={{ width: '100%', height: '100%', border: 0, borderRadius: 12 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          background: 'rgba(255,255,255,0.9)',
          padding: '6px 10px',
          borderRadius: 10,
          fontSize: 12,
          color: '#003580',
          textDecoration: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        }}
      >
        View larger map
      </a>
    </div>
  );
}

export default function GoogleLiveMap() {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [userPos, setUserPos] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy ?? null);
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message || 'Unable to get your location.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const mapCenter = useMemo(() => userPos || WINDHOEK_CENTER, [userPos]);

  if (!apiKey) {
    // No API key? Show a real map without keys (OpenStreetMap embed)
    return <OpenStreetMapEmbed center={WINDHOEK_CENTER} />;
  }

  if (loadError) {
    // If Google fails, fall back to OpenStreetMap instead of showing an error banner
    return <OpenStreetMapEmbed center={WINDHOEK_CENTER} />;
  }

  if (!isLoaded) {
    return (
      <div className="map-placeholder">
        <div className="map-icon">🗺️</div>
        <p>Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={mapCenter}
      zoom={userPos ? 14 : 12}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {/* Office marker (static) */}
      <Marker position={WINDHOEK_CENTER} title="Windhoek, Namibia" />

      {/* Live user location (updates as the device moves) */}
      {userPos && (
        <>
          <Marker position={userPos} title="Your location" />
          {typeof accuracy === 'number' && accuracy > 0 && (
            <Circle
              center={userPos}
              radius={accuracy}
              options={{
                fillColor: '#003580',
                fillOpacity: 0.15,
                strokeColor: '#003580',
                strokeOpacity: 0.6,
                strokeWeight: 1,
              }}
            />
          )}
        </>
      )}

      {geoError && (
        <div className="map-note" style={{ position: 'absolute', left: 12, bottom: 12 }}>
          Location: {geoError}
        </div>
      )}
    </GoogleMap>
  );
}





