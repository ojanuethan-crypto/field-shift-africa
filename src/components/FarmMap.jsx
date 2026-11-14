import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

// Shared map. Teammates (S9 space layers, S10 zones, S11 twins) can reuse it and pass `children`
// for extra layers. Props: center [lat, lon], zoom, pin {lat, lon}, onPick(lat, lon), children.
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#1b4332;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
})

function Clicks({ onPick }) {
  useMapEvents({ click: (e) => onPick?.(e.latlng.lat, e.latlng.lng) })
  return null
}

function Fly({ target, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], zoom, { duration: 0.8 })
  }, [target?.lat, target?.lon]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function FarmMap({ center = [-6, 18], zoom = 3, pin, onPick, flyZoom = 7, children, className = 'h-full w-full' }) {
  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} className={className} attributionControl>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
        maxZoom={18}
      />
      <Clicks onPick={onPick} />
      {pin && <Marker position={[pin.lat, pin.lon]} icon={pinIcon} />}
      <Fly target={pin} zoom={flyZoom} />
      {children}
    </MapContainer>
  )
}
