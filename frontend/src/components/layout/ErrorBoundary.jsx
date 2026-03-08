import React from "react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "2rem", backgroundColor: "#ffebee", color: "#c62828", minHeight: "100vh" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Something went wrong.</h1>
                    <details style={{ whiteSpace: "pre-wrap", marginTop: "1rem", backgroundColor: "white", padding: "1rem", border: "1px solid #ef9a9a" }}>
                        <summary style={{ fontWeight: "bold", cursor: "pointer" }}>Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}
