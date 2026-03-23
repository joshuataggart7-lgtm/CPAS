import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(error, info) { this.setState({ error: error.message + '\n' + info.componentStack }); }
  static getDerivedStateFromError(error) { return { error: error.message }; }
  render() {
    if (this.state.error) {
      return React.createElement('div', {style:{padding:'20px',color:'#ff4444',fontFamily:'monospace',background:'#000',minHeight:'100vh',whiteSpace:'pre-wrap'}},
        'CPAS ERROR: ' + this.state.error
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
)
