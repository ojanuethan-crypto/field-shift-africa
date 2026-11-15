import { useParams } from 'react-router-dom'
import StateScreen from './StateScreen.jsx'

// S26 route: /states/<offline|error|desert|ocean|outside|nodata>
export default function S26States() {
  const { type } = useParams()
  return <StateScreen type={type} />
}
