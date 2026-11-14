import FarmMap from '../../../components/FarmMap.jsx'

// Rounded, fixed-height wrapper around the shared FarmMap. Defaults to the whole of Africa.
export default function MapBox({ className = 'h-80', center = [2, 20], zoom = 3, ...rest }) {
  return (
    <div className={`${className} isolate overflow-hidden rounded-3xl bg-white shadow-sm`}>
      <FarmMap center={center} zoom={zoom} {...rest} />
    </div>
  )
}
