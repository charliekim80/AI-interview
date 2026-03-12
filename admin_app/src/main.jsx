import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#1e293b', color: '#f8fafc', minHeight: '100vh' }}>
          <h2 style={{ color: '#f87171', marginBottom: '16px' }}>🚨 앱 오류 발생 (개발자용 오류 메시지)</h2>
          <pre style={{ background: '#0f172a', padding: '20px', borderRadius: '8px', overflow: 'auto', fontSize: '13px', color: '#fbbf24', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>이 메시지를 개발자에게 전달해 주세요.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
