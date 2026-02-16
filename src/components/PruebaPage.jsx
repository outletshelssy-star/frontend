import { Box } from '@mui/material'
import CompaniesTable from './CompaniesTable'
import CompanyBlocksTable from './CompanyBlocksTable'

const PruebaPage = ({
  companies,
  companiesError,
  isCompaniesLoading,
  blocks,
  blocksError,
  isBlocksLoading,
  tokenType,
  accessToken,
  onCompanyChanged,
  onBlockChanged,
}) => {
  return (
    <Box sx={{ display: 'grid', gap: 1.35 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.35,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <CompaniesTable
          companies={companies}
          companiesError={companiesError}
          isCompaniesLoading={isCompaniesLoading}
          tokenType={tokenType}
          accessToken={accessToken}
          onCompanyChanged={onCompanyChanged}
        />
        <CompanyBlocksTable
          blocks={blocks}
          blocksError={blocksError}
          isBlocksLoading={isBlocksLoading}
          companies={companies}
          tokenType={tokenType}
          accessToken={accessToken}
          onBlockChanged={onBlockChanged}
        />
      </Box>
    </Box>
  )
}

export default PruebaPage
