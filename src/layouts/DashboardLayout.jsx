import { IconButton, Tooltip, useMediaQuery } from '@mui/material'
import { Menu, MenuOpen } from '@mui/icons-material'

const DashboardLayout = ({ isCollapsed, onToggleSidebar, sidebar, children }) => {
  const isMobile = useMediaQuery('(max-width:980px)')

  return (
    <div className={`dashboard-layout ${isCollapsed ? 'is-collapsed' : ''}`}>
      {sidebar}
      <div className="dashboard-main">
        {isMobile ? (
          <Tooltip
            title={isCollapsed ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
            placement="right"
            arrow
          >
            <IconButton
              type="button"
              className="dashboard-main__sidebar-toggle"
              onClick={onToggleSidebar}
              aria-label={isCollapsed ? 'Mostrar barra lateral' : 'Ocultar barra lateral'}
            >
              {isCollapsed ? <Menu fontSize="small" /> : <MenuOpen fontSize="small" />}
            </IconButton>
          </Tooltip>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
