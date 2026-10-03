import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import type { Property } from '@/data/mock/properties';
import { formatCurrency } from '@/utils/formatCurrency';

export function PropertyMap({ properties, activeId, onSelect }: { properties: Property[]; activeId: string | null; onSelect: (id: string) => void }) {
  const { t, i18n } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([34.5281, 69.1723], 12);
    mapRef.current = map;
    const tiles = L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    tiles.on('tileload', () => setTileError(false));
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentMarkers = markers.current;
    currentMarkers.forEach((marker) => marker.remove());
    currentMarkers.clear();
    const bounds = L.latLngBounds([]);
    properties.forEach((property) => {
      if (!Number.isFinite(property.latitude) || !Number.isFinite(property.longitude) || Math.abs(property.latitude) > 90 || Math.abs(property.longitude) > 180 || (property.latitude === 0 && property.longitude === 0)) return;
      const label = document.createElement('span');
      label.className = 'map-price';
      label.textContent = formatCurrency(property.fromPrice, property.currency, i18n.language);
      const icon = L.divIcon({ html: label, className: 'property-map-marker', iconSize: [100, 36], iconAnchor: [50, 36] });
      const marker = L.marker([property.latitude, property.longitude], { icon, title: property.name, alt: property.name }).addTo(map);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = property.name;
      const link = document.createElement('a');
      link.href = `/property/${encodeURIComponent(property.slug)}`;
      link.textContent = t('common.viewDetails');
      link.className = 'map-property-link';
      popup.append(title, document.createElement('br'), link);
      marker.bindPopup(popup).on('click', () => onSelect(property.id));
      currentMarkers.set(property.id, marker);
      bounds.extend(marker.getLatLng());
    });
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    return () => { currentMarkers.forEach((marker) => marker.remove()); currentMarkers.clear(); };
  }, [properties, i18n.language, t, onSelect]);
  useEffect(() => {
    markers.current.forEach((marker, id) => {
      marker.getElement()?.classList.toggle('is-active', activeId === id);
      marker.setZIndexOffset(activeId === id ? 1000 : 0);
    });
    const marker = activeId ? markers.current.get(activeId) : undefined;
    if (marker) { mapRef.current?.panTo(marker.getLatLng()); marker.openPopup(); }
  }, [activeId, properties, i18n.language]);
  return <div className="relative isolate overflow-hidden rounded-2xl border border-line bg-paper">
    <div ref={container} className="h-[420px] w-full sm:h-[560px]" role="region" aria-label={t('map.title')} />
    {tileError && <p role="alert" className="absolute inset-x-3 top-3 z-[1000] rounded-xl border border-line bg-white p-3 text-sm text-ink">{t('map.tileError')}</p>}
  </div>;
}
