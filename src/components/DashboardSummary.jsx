const DashboardSummary = ({ username, usersCount, isUsersLoading, onLogout }) => (
  <section className="card dashboard-card">
    <h1>Dashboard</h1>
    <p className="subtitle">Hola, {username.trim() || 'usuario'}. Ya iniciaste sesion.</p>
    <div className="dashboard">
      <article>
        <h2>Usuarios</h2>
        <p>Resumen del sistema de usuarios.</p>
        <div className="meta">
          {isUsersLoading ? 'Cargando usuarios...' : `Total: ${usersCount}`}
        </div>
      </article>
    </div>
    <button type="button" className="secondary" onClick={onLogout}>
      Salir
    </button>
  </section>
)

export default DashboardSummary
