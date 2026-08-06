import { Component } from "react";
import { COLORS } from "../theme/colors";
import Button from "./Button";

// Class component is required here — React only supports error boundaries
// via getDerivedStateFromError/componentDidCatch, there's no hook equivalent.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", textAlign: "center", background: COLORS.white,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.navy, margin: "0 0 12px" }}>Something Went Wrong</h1>
        <p style={{ fontSize: 15, color: COLORS.medGray, margin: "0 0 28px", maxWidth: 440 }}>
          An unexpected error occurred. Reloading the page usually fixes this — if it keeps happening, please contact us.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    );
  }
}
