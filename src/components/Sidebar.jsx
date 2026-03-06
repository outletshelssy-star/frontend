import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import {
  AssessmentOutlined,
  BarChartOutlined,
  BusinessOutlined,
  DevicesOutlined,
  GroupOutlined,
  HandymanOutlined,
  KeyboardDoubleArrowRightOutlined,
  LogoutOutlined,
  PersonOutline,
  PrecisionManufacturingOutlined,
  ScienceOutlined,
  FactCheckOutlined,
} from '@mui/icons-material'

const NavBtn = ({ section, label, icon, activeSection, isCollapsed, onSectionChange }) => {
  const isActive = activeSection === section
  const button = (
    <Button
      type="button"
      className={`sidebar__item ${isActive ? 'is-active' : ''}`}
      onClick={() => onSectionChange(section)}
    >
      <span className="sidebar__icon">{icon}</span>
      {!isCollapsed ? <span>{label}</span> : null}
    </Button>
  )
  return isCollapsed ? (
    <Tooltip title={label} placement="right" arrow>
      <span style={{ display: 'block' }}>{button}</span>
    </Tooltip>
  ) : (
    button
  )
}

const SectionLabel = ({ children, isCollapsed }) =>
  isCollapsed ? (
    <Divider sx={{ borderColor: 'rgba(148,163,184,0.2)', my: 0.5 }} />
  ) : (
    <Typography className="sidebar__section-label">{children}</Typography>
  )

const Sidebar = ({
  currentUser,
  currentUserError,
  activeSection,
  isCollapsed,
  onToggle,
  onSectionChange,
  onLogout,
  brandName = 'Laboratorio 2026',
}) => {
  const isCompactSidebar = useMediaQuery('(max-width:980px)')
  const isIconsOnly = isCollapsed || isCompactSidebar
  const role = String(currentUser?.user_type || '').toLowerCase()
  const canSeeAdmin = ['admin', 'superadmin'].includes(role)
  const isVisitor = role === 'visitor'

  return (
    <Box component="aside" className={`sidebar ${isIconsOnly ? 'is-collapsed' : ''}`}>
      <Box className="sidebar__top">
        {!isCompactSidebar ? (
          isCollapsed ? (
            <Tooltip title="Expandir" placement="right" arrow>
              <IconButton
                className="sidebar__collapsed-logo-toggle"
                onClick={onToggle}
                aria-label="Expandir barra lateral"
              >
                <img
                  className="sidebar__collapsed-logo"
                  src="/assets/FronteraVertical.png"
                  alt="Frontera Energy"
                />
                <span className="sidebar__collapsed-expand-icon">
                  <KeyboardDoubleArrowRightOutlined fontSize="small" />
                </span>
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Contraer" placement="right" arrow>
              <IconButton
                className="sidebar__toggle"
                onClick={onToggle}
                aria-label="Contraer barra lateral"
              >
                <Box className="sidebar__toggle-bars">
                  <span />
                  <span className="sidebar__toggle-bar--mid" />
                  <span />
                </Box>
              </IconButton>
            </Tooltip>
          )
        ) : null}
        {!isIconsOnly ? (
          <Box className="sidebar__brand">
            <img
              className="brand__logo"
              src="/assets/Company_Frontera_Energy.png"
              alt="Frontera Energy"
            />
          </Box>
        ) : null}
      </Box>

      {!isIconsOnly ? <Box className="sidebar__brand-name">{brandName}</Box> : null}

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.2)', mb: 0.5, width: '100%' }} />

      <Stack className="sidebar__nav" spacing={0.5}>
        {!isVisitor ? (
          <NavBtn
            section="dashboard"
            label="Dashboard"
            icon={<BarChartOutlined fontSize="small" />}
            activeSection={activeSection}
            isCollapsed={isIconsOnly}
            onSectionChange={onSectionChange}
          />
        ) : null}
        <NavBtn
          section="profile"
          label="Mi perfil"
          icon={<PersonOutline fontSize="small" />}
          activeSection={activeSection}
          isCollapsed={isIconsOnly}
          onSectionChange={onSectionChange}
        />

        {canSeeAdmin ? (
          <>
            <SectionLabel isCollapsed={isIconsOnly}>Administracion</SectionLabel>
            <NavBtn
              section="users"
              label="Usuarios"
              icon={<GroupOutlined fontSize="small" />}
              activeSection={activeSection}
              isCollapsed={isIconsOnly}
              onSectionChange={onSectionChange}
            />
            <NavBtn
              section="companies"
              label="Empresas"
              icon={<BusinessOutlined fontSize="small" />}
              activeSection={activeSection}
              isCollapsed={isIconsOnly}
              onSectionChange={onSectionChange}
            />
            <NavBtn
              section="terminals"
              label="Terminales"
              icon={<DevicesOutlined fontSize="small" />}
              activeSection={activeSection}
              isCollapsed={isIconsOnly}
              onSectionChange={onSectionChange}
            />
          </>
        ) : null}

        <SectionLabel isCollapsed={isIconsOnly}>Laboratorio</SectionLabel>
        <NavBtn
          section="equipment-types"
          label="Plan Metrologico"
          icon={<PrecisionManufacturingOutlined fontSize="small" />}
          activeSection={activeSection}
          isCollapsed={isIconsOnly}
          onSectionChange={onSectionChange}
        />
        <NavBtn
          section="equipment"
          label="Equipos"
          icon={<HandymanOutlined fontSize="small" />}
          activeSection={activeSection}
          isCollapsed={isIconsOnly}
          onSectionChange={onSectionChange}
        />
        <NavBtn
          section="samples"
          label="Muestras"
          icon={<ScienceOutlined fontSize="small" />}
          activeSection={activeSection}
          isCollapsed={isIconsOnly}
          onSectionChange={onSectionChange}
        />
        <NavBtn
          section="external-analyses"
          label="Analisis externos"
          icon={<FactCheckOutlined fontSize="small" />}
          activeSection={activeSection}
          isCollapsed={isIconsOnly}
          onSectionChange={onSectionChange}
        />
        <NavBtn
          section="reports"
          label="Reportes"
          icon={<AssessmentOutlined fontSize="small" />}
          activeSection={activeSection}
          isCollapsed={isIconsOnly}
          onSectionChange={onSectionChange}
        />
      </Stack>

      <Box className="sidebar__footer">
        <Divider sx={{ borderColor: 'rgba(148,163,184,0.2)', mb: 1.5 }} />
        <Box className="sidebar__user">
          <Tooltip
            title={currentUser ? `${currentUser.name} ${currentUser.last_name}` : 'Usuario'}
            placement="right"
            arrow
            disableHoverListener={!isIconsOnly}
          >
            <Avatar
              className="sidebar__avatar"
              src={currentUser?.photo_url ?? undefined}
              alt={
                currentUser
                  ? `${currentUser.name || ''} ${currentUser.last_name || ''}`.trim()
                  : 'Usuario'
              }
            >
              {currentUser?.name?.charAt(0) || 'U'}
            </Avatar>
          </Tooltip>
          {!isIconsOnly ? (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography className="sidebar__user-name" variant="body2" noWrap>
                {currentUser ? `${currentUser.name} ${currentUser.last_name}` : 'Cargando...'}
              </Typography>
              <Typography
                className="sidebar__user-meta"
                variant="caption"
                noWrap
                sx={{ display: 'block' }}
              >
                {currentUserError
                  ? currentUserError
                  : currentUser?.company?.name || currentUser?.email || ''}
              </Typography>
            </Box>
          ) : null}
        </Box>

        <Tooltip title="Cerrar sesion" placement="right" arrow disableHoverListener={!isIconsOnly}>
          <Button
            type="button"
            className="link-button sidebar__logout"
            onClick={onLogout}
            size="small"
            startIcon={<LogoutOutlined fontSize="small" />}
          >
            {!isIconsOnly ? 'Cerrar sesion' : null}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default Sidebar
