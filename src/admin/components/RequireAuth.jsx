import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { ADMIN_COLORS } from "../theme";

export default function RequireAuth({ children }) {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === "checking") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: ADMIN_COLORS.contentBg, color: ADMIN_COLORS.medGray, fontSize: 14,
      }}>
        Checking session&hellip;
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
