import { useAuthStore } from '../store/useAuthStore'
import { login } from '../services/api'

const Login = () => {
  const {
    username,
    password,
    error,
    isLoading,
    setUsername,
    setPassword,
    setError,
    setIsLoggedIn,
    setIsLoading,
    setTokenType,
    setAccessToken,
  } = useAuthStore()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Completa usuario y contrasena.')
      return
    }

    setIsLoading(true)

    try {
      const data = await login({ username, password })
      setTokenType(data.token_type || 'bearer')
      setAccessToken(data.access_token || '')
      setIsLoggedIn(true)
    } catch (err) {
      setError(err?.detail || 'No se pudo iniciar sesion.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="card login-layout">
      <div className="login-panel login-panel--logo">
        <div className="login-logo">
          <img
            className="login-logo__image"
            src="/assets/Company_Frontera_Energy.png"
            alt="Frontera Energy"
          />
          <div className="login-logo__text">
            <div className="login-logo__title">Laboratorio 2026</div>
            <p className="subtitle">Gestiona accesos y usuarios en un solo lugar.</p>
          </div>
        </div>
      </div>
      <div className="login-panel login-panel--form">
        <h1>Iniciar sesion</h1>
        <p className="subtitle">Accede con un usuario y contrasena.</p>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Correo</span>
            <input
              type="email"
              placeholder="ej: admin@local.dev"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>Contrasena</span>
            <input
              type="password"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Login
