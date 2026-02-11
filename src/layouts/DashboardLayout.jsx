const DashboardLayout = ({ isCollapsed, sidebar, children }) => (
  <div className={`dashboard-layout ${isCollapsed ? 'is-collapsed' : ''}`}>
    {sidebar}
    <div className="dashboard-main">{children}</div>
  </div>
)

export default DashboardLayout
