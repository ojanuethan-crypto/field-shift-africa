import { useParams } from 'react-router-dom'
import StateScreen from '../../components/StateScreen'

/* S26 States: /states/<offline|error|desert|ocean|outside|nodata>. Other screens can also render
   <StateScreen type="..." embedded /> inline when a request fails or a location is unsupported. */
export default function States() {
  const { type } = useParams()
  return <StateScreen type={type} />
}
