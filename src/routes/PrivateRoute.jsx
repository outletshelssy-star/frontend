import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ isAllowed, children }) =>
  isAllowed ? children : <Navigate to="/" replace />

export default PrivateRoute
