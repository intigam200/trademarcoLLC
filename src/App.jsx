import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Company from "./pages/Company";
import Products from "./pages/Products";
import Manufacturers from "./pages/Manufacturers";
import ManufacturerDetail from "./pages/ManufacturerDetail";
import ProductDetail from "./pages/ProductDetail";

import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import RequireAuth from "./admin/components/RequireAuth";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminLogin from "./admin/pages/Login";
import AdminDashboard from "./admin/pages/Dashboard";
import AdminProducts from "./admin/pages/Products";
import AdminProductEditor from "./admin/pages/ProductEditor";
import AdminManufacturers from "./admin/pages/Manufacturers";
import AdminCategories from "./admin/pages/Categories";
import AdminImport from "./admin/pages/Import";
import AdminRFQs from "./admin/pages/RFQs";
import AdminSettings from "./admin/pages/Settings";

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/company" element={<Company />} />
          <Route path="/products" element={<Products />} />
          <Route path="/manufacturers" element={<Manufacturers />} />
          <Route path="/manufacturers/:slug" element={<ManufacturerDetail />} />
          <Route path="/manufacturers/:manufacturerSlug/:productSlug" element={<ProductDetail />} />
        </Route>

        <Route path="/admin/*" element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
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
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
