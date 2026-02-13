import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import Login from '../pages/Login'
import DashBoard from '../pages/Dashboard'
import PrivateRoute from './PrivateRoute'
import { fetchCurrentUser } from '../services/api'

const AppRoutes = () => {
  const {
    isLoggedIn,
    accessToken,
    tokenType,
    setCurrentUser,
    setCurrentUserError,
    setIsLoggedIn,
    resetAuth,
  } = useAuthStore()

  useEffect(() => {
    let isActive = true

    const validateSession = async () => {
      if (!accessToken) {
        return
      }

      try {
        const data = await fetchCurrentUser({ tokenType, accessToken })
        if (!isActive) return
        setCurrentUser(data)
        setIsLoggedIn(true)
      } catch (err) {
        if (!isActive) return
        setCurrentUserError(
          err?.detail || 'No se pudo validar la sesion. Inicia sesion de nuevo.'
        )
        resetAuth()
      }
    }

    validateSession()

    return () => {
      isActive = false
    }
  }, [
    accessToken,
    tokenType,
    setCurrentUser,
    setCurrentUserError,
    setIsLoggedIn,
    resetAuth,
  ])

  return (
    <div className={`app ${isLoggedIn ? 'app--dashboard' : ''}`}>
      <main className="app__main">
        <Routes>
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/app" replace /> : <Login />}
          />
          <Route
            path="/app"
            element={
              <PrivateRoute isAllowed={isLoggedIn}>
                <DashBoard />
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? '/app' : '/'} replace />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default AppRoutes
