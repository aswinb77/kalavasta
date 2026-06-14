import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './KeralaMap.css';
import { keralaDistricts } from './keralaDistricts';
import rainImg from './assets/rain_cloud.gif';
import thunderImg from './assets/thunderstorm.gif';
import cloudy from './assets/cloudy.gif';
import heavyRain from './assets/heavy_rain.gif';
import sunny from './assets/sunny.gif';
import drizzle from './assets/drizzle.gif';
import logo from './assets/logo.png';

const PALETTE = {
  navy: '#03110d',
  green: '#163d2c',
  green2: '#1f7a4f',
  accent: '#a8ffb8',
  ice: '#d4f3da',
  moss: '#1f6a48',
};

const districtWeather: { name: string; icon: string; condition: 'rain' | 'thunder' | 'cloudy' | 'heavyRain' | 'sunny' | 'drizzle' }[] = [
  { name: 'Alappuzha', icon: rainImg, condition: 'rain' },
  { name: 'Ernakulam', icon: thunderImg, condition: 'thunder' },
  { name: 'Idukki', icon: cloudy, condition: 'cloudy' },
  { name: 'Kannur', icon: heavyRain, condition: 'heavyRain' },
  { name: 'Kasaragod', icon: sunny, condition: 'sunny' },
  { name: 'Kollam', icon: drizzle, condition: 'drizzle' },
  { name: 'Kottayam', icon: rainImg, condition: 'rain' },
  { name: 'Kozhikode', icon: thunderImg, condition: 'thunder' },
  { name: 'Malappuram', icon: cloudy, condition: 'cloudy' },
  { name: 'Palakkad', icon: sunny, condition: 'sunny' },
  { name: 'Pathanamthitta', icon: heavyRain, condition: 'heavyRain' },
  { name: 'Thiruvananthapuram', icon: drizzle, condition: 'drizzle' },
  { name: 'Thrissur', icon: rainImg, condition: 'rain' },
  { name: 'Wayanad', icon: cloudy, condition: 'cloudy' },
];

const weatherMap: Record<string, string> = {};
const districtCondition: Record<string, string> = {};
const currentVariable = 'Current Variable';

const fillColorByCondition: Record<string, string> = {
  rain: 'rgba(54, 114, 166, 0.45)',
  thunder: 'rgba(89, 96, 123, 0.45)',
  cloudy: 'rgba(107, 121, 137, 0.35)',
  heavyRain: 'rgba(23, 80, 112, 0.5)',
  sunny: 'rgba(233, 188, 112, 0.35)',
  drizzle: 'rgba(76, 109, 95, 0.4)',
};

districtWeather.forEach((item) => {
  weatherMap[item.name] = item.icon;
  districtCondition[item.name] = item.condition;
});

function getWeatherIcon(districtName: string) {
  return L.icon({
    iconUrl: weatherMap[districtName] || sunny,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function getDistrictFillColor(districtName: string) {
  return fillColorByCondition[districtCondition[districtName]] || 'rgba(31, 122, 79, 0.22)';
}

// outline of kerala
function style(feature: GeoJSON.Feature): L.PathOptions {
  const districtName = feature.properties?.name as string;
  return {
    fillColor: getDistrictFillColor(districtName),
    weight: 1.5,
    opacity: 1,
    color: '#d4f3da',
    dashArray: '',
    fillOpacity: 0.65,
    className: 'state-border',
  };
}

function highlightFeature(e: L.LeafletMouseEvent) {
  const layer = e.target as L.Path;
  layer.setStyle({
    weight: 2,
    color: '#F4A261',
    dashArray: '0',
    fillOpacity: 0,
    opacity: 0.95,
  });
  layer.bringToFront();
}


export default function KeralaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false }).setView([10.5, 76.5], 7);
    mapRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      className: 'remaining-tiles',
    }).addTo(map);

    const geojson = L.geoJson(keralaDistricts, {
      style: style as L.StyleFunction,
      onEachFeature(feature, layer) {
        const pathLayer = layer as L.Path;
        pathLayer.on({
          mouseover: (event) => {
            highlightFeature(event);
            pathLayer.openPopup();
          },
          mouseout: () => {
            geojson.resetStyle(pathLayer);
            pathLayer.closePopup();
          },
        });
        if (feature.properties) {
          const districtName = feature.properties.name as string;
          layer.bindPopup(
            `<div class="glass-popup"><div class="glass-title">${districtName}</div></div>`,
            {
              closeButton: false,
              autoClose: false,
              closeOnClick: false,
              closeOnEscapeKey: false,
              className: 'kerala-popup',
            }
          );
        }
      },
    }).addTo(map);

    const bounds = geojson.getBounds();
    geojson.eachLayer((layer: any) => {
      if (layer.getBounds && layer.feature?.properties?.name) {
        L.marker(layer.getBounds().getCenter(), {
          icon: getWeatherIcon(layer.feature.properties.name),
          interactive: false,
        }).addTo(map);
      }
    });

    map.fitBounds(bounds);
    map.setMaxBounds(bounds.pad(0.1));
    map.setMinZoom(map.getBoundsZoom(bounds));

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const handleLocationClick = () => {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: PALETTE.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px' }}>
        <img src={logo} alt="Kalavasta Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        <span style={{ fontSize: '18px', fontWeight: 700, color: PALETTE.ice }}>Kalavasta</span>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        <button
          type="button"
          onClick={handleLocationClick}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 20,
            zIndex: 1000,
            padding: '10px 16px',
            borderRadius: 999,
            border: 'none',
            background: '#8EE6A2',
            color: '#06140D',
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.22)',
          }}
        >
          Click Me
        </button>
      </div>
    </div>
  );
}
