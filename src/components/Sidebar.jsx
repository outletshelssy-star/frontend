import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import {
  BarChartOutlined,
  BusinessOutlined,
  DevicesOutlined,
  GroupOutlined,
  HandymanOutlined,
  LogoutOutlined,
  PersonOutline,
  PrecisionManufacturingOutlined,
  ScienceOutlined,
  ViewModuleOutlined,
} from '@mui/icons-material'

const Sidebar = ({
  currentUser,
  currentUserError,
  activeSection,
  isCollapsed,
  onToggle,
  onSectionChange,
  onLogout,
}) => {
  const canSeeUsers = ['admin', 'superadmin'].includes(
    String(currentUser?.user_type || '').toLowerCase()
  )

  return (
    <Box component="aside" className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      <Box className="sidebar__top">
        <IconButton
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
        >
          <Box className="sidebar__toggle-bars">
            <span />
            <span />
            <span />
          </Box>
        </IconButton>
        {!isCollapsed ? (
          <Box className="sidebar__brand">
            <img
              className="brand__logo"
              src="/assets/Company_Frontera_Energy.png"
              alt="Frontera Energy"
            />
          </Box>
        ) : null}
      </Box>
      {!isCollapsed ? (
        <Box className="sidebar__brand-name">Laboratorio 2026</Box>
      ) : null}

      <Divider
        sx={{
          borderColor: 'rgba(148, 163, 184, 0.2)',
          mb: 1.5,
          width: '100%',
        }}
      />

      <Stack className="sidebar__nav" spacing={1}>
        <Button
          type="button"
          className={`sidebar__item ${activeSection === 'dashboard' ? 'is-active' : ''}`}
          onClick={() => onSectionChange('dashboard')}
        >
          <span className="sidebar__icon">
            <BarChartOutlined fontSize="small" />
          </span>
          {!isCollapsed ? <span>Dashboard</span> : null}
        </Button>
        <Button
          type="button"
          className={`sidebar__item ${activeSection === 'profile' ? 'is-active' : ''}`}
          onClick={() => onSectionChange('profile')}
        >
          <span className="sidebar__icon">
            <PersonOutline fontSize="small" />
          </span>
          {!isCollapsed ? <span>Mi perfil</span> : null}
        </Button>
        {canSeeUsers ? (
          <Button
            type="button"
            className={`sidebar__item ${activeSection === 'users' ? 'is-active' : ''}`}
            onClick={() => onSectionChange('users')}
          >
            <span className="sidebar__icon">
              <GroupOutlined fontSize="small" />
            </span>
            {!isCollapsed ? <span>Usuarios</span> : null}
          </Button>
        ) : null}
        {canSeeUsers ? (
          <Button
            type="button"
            className={`sidebar__item ${
              activeSection === 'companies' ? 'is-active' : ''
            }`}
            onClick={() => onSectionChange('companies')}
          >
            <span className="sidebar__icon">
              <BusinessOutlined fontSize="small" />
            </span>
            {!isCollapsed ? <span>Empresas</span> : null}
          </Button>
        ) : null}
        {canSeeUsers ? (
          <Button
            type="button"
            className={`sidebar__item ${activeSection === 'blocks' ? 'is-active' : ''}`}
            onClick={() => onSectionChange('blocks')}
          >
            <span className="sidebar__icon">
              <ViewModuleOutlined fontSize="small" />
            </span>
            {!isCollapsed ? <span>Bloques</span> : null}
          </Button>
        ) : null}
        {canSeeUsers ? (
          <Button
            type="button"
            className={`sidebar__item ${
              activeSection === 'terminals' ? 'is-active' : ''
            }`}
            onClick={() => onSectionChange('terminals')}
          >
            <span className="sidebar__icon">
              <DevicesOutlined fontSize="small" />
            </span>
            {!isCollapsed ? <span>Terminales</span> : null}
          </Button>
        ) : null}
        {canSeeUsers ? (
          <Button
            type="button"
            className={`sidebar__item ${
              activeSection === 'equipment-types' ? 'is-active' : ''
            }`}
            onClick={() => onSectionChange('equipment-types')}
          >
            <span className="sidebar__icon">
              <PrecisionManufacturingOutlined fontSize="small" />
            </span>
            {!isCollapsed ? <span>Tipos de equipo</span> : null}
          </Button>
        ) : null}
        <Button
          type="button"
          className={`sidebar__item ${activeSection === 'equipment' ? 'is-active' : ''}`}
          onClick={() => onSectionChange('equipment')}
        >
          <span className="sidebar__icon">
            <HandymanOutlined fontSize="small" />
          </span>
          {!isCollapsed ? <span>Equipos</span> : null}
        </Button>
        <Button
          type="button"
          className={`sidebar__item ${activeSection === 'samples' ? 'is-active' : ''}`}
          onClick={() => onSectionChange('samples')}
        >
          <span className="sidebar__icon">
            <ScienceOutlined fontSize="small" />
          </span>
          {!isCollapsed ? <span>Muestras</span> : null}
        </Button>
        <Button
          type="button"
          className={`sidebar__item ${activeSection === 'reports' ? 'is-active' : ''}`}
          onClick={() => onSectionChange('reports')}
        >
          <span className="sidebar__icon">
            <BarChartOutlined fontSize="small" />
          </span>
          {!isCollapsed ? <span>Reportes</span> : null}
        </Button>
      </Stack>

      <Box className="sidebar__footer">
        <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)', mb: 1.5 }} />
        <Box className="sidebar__user">
          <Avatar
            className="sidebar__avatar"
            src={currentUser?.photo_url || ''}
            alt={
              currentUser
                ? `${currentUser.name || ''} ${currentUser.last_name || ''}`.trim()
                : 'Usuario'
            }
          >
            {currentUser?.name?.charAt(0) || 'U'}
          </Avatar>
          {!isCollapsed ? (
            <Box>
              <Typography
                className="sidebar__user-name"
                variant="body2"
                sx={{ fontSize: '0.98rem' }}
              >
                {currentUser
                  ? `${currentUser.name} ${currentUser.last_name}`
                  : 'Cargando usuario...'}
              </Typography>
              <Typography
                className="sidebar__user-meta"
                variant="caption"
                sx={{ fontSize: '0.86rem' }}
              >
                {currentUserError
                  ? currentUserError
                  : currentUser?.company?.name || currentUser?.email || ''}
              </Typography>
            </Box>
          ) : null}
        </Box>
        <Button
          type="button"
          className="link-button sidebar__logout"
          onClick={onLogout}
          size="small"
          sx={{
            fontSize: '0.68rem',
            padding: isCollapsed ? '0.35rem' : '0.3rem 0.6rem',
            minHeight: '32px',
            minWidth: isCollapsed ? '36px' : 'auto',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            '& .MuiButton-startIcon': {
              margin: 0,
            },
          }}
          startIcon={<LogoutOutlined fontSize="small" />}
        >
          {!isCollapsed ? 'Cerrar sesion' : null}
        </Button>
      </Box>
    </Box>
  )
}

export default Sidebar
