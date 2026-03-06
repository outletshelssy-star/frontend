import { Box } from '@mui/material'
import CompaniesTable from './companies/CompaniesTable'
import CompanyBlocksTable from './blocks/CompanyBlocksTable'

const CompaniesSection = ({ companies }) => {
  return (
    <Box sx={{ display: 'grid', gap: 1.35 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.35,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <CompaniesTable />
        <CompanyBlocksTable companies={companies} />
      </Box>
    </Box>
  )
}

export default CompaniesSection
