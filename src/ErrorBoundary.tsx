import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React rendering error caught by ErrorBoundary', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell" role="alert">
          <section className="card">
            <h1>画面の表示中に問題が発生しました</h1>
            <p>ページを再読み込みしてください。保存済みの記録はブラウザに残っています。</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
