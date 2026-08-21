import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import ScrollToTop from "./components/ScrollToTop";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Company from "./pages/Company";
import Products from "./pages/Products";
import Manufacturers from "./pages/Manufacturers";
import ManufacturerDetail from "./pages/ManufacturerDetail";
import ProductDetail from "./pages/ProductDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";

// Lazy-loaded: the admin panel is a meaningful chunk of JS (Supabase client,
// data tables, editors) that public visitors never need to download.
const AdminAuthProvider = lazy(() => import("./admin/context/AdminAuthContext").then((m) => ({ default: m.AdminAuthProvider })));
const RequireAuth = lazy(() => import("./admin/components/RequireAuth"));
const AdminLayout = lazy(() => import("./admin/layouts/AdminLayout"));
const AdminLogin = lazy(() => import("./admin/pages/Login"));
const AdminDashboard = lazy(() => import("./admin/pages/Dashboard"));
const AdminProducts = lazy(() => import("./admin/pages/Products"));
const AdminProductEditor = lazy(() => import("./admin/pages/ProductEditor"));
const AdminManufacturers = lazy(() => import("./admin/pages/Manufacturers"));
const AdminCategories = lazy(() => import("./admin/pages/Categories"));
const AdminImport = lazy(() => import("./admin/pages/Import"));
const AdminRFQs = lazy(() => import("./admin/pages/RFQs"));
const AdminSettings = lazy(() => import("./admin/pages/Settings"));

function PublicLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function ProtectedAdminLayout() {
  return (
    <RequireAuth>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </RequireAuth>
  );
}

function AdminFallback() {
  return <div style={{ minHeight: "100vh" }} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Analytics />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/company" element={<Company />} />
          <Route path="/products" element={<Products />} />
          <Route path="/manufacturers" element={<Manufacturers />} />
          <Route path="/manufacturers/:slug" element={<ManufacturerDetail />} />
          <Route path="/manufacturers/:manufacturerSlug/:productSlug" element={<ProductDetail />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminAuthProvider><Outlet /></AdminAuthProvider>
            </Suspense>
          }
        >
          <Route path="login" element={<AdminLogin />} />
          <Route element={<ProtectedAdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductEditor />} />
            <Route path="products/:id/edit" element={<AdminProductEditor />} />
            <Route path="manufacturers" element={<AdminManufacturers />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="import" element={<AdminImport />} />
            <Route path="rfqs" element={<AdminRFQs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
