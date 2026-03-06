import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('Error boundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2>Algo salió mal.</h2>
          <p>Por favor recarga la página.</p>
          <button onClick={() => this.setState({ hasError: false })}>Reintentar</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
