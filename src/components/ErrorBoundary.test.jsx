import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'

const ThrowingChild = () => {
  throw new Error('Test error')
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('shows error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Algo salió mal.')).toBeInTheDocument()
  })

  it('renders retry button when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('retry button is clickable', async () => {
    const user = userEvent.setup()
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    )
    await user.click(screen.getByText('Reintentar'))
    // After reset, ThrowingChild throws again, error boundary catches again
    expect(screen.getByText('Algo salió mal.')).toBeInTheDocument()
  })
})
