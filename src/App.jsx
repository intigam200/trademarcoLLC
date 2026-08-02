import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Company from "./pages/Company";
import Products from "./pages/Products";
import Manufacturers from "./pages/Manufacturers";
import ManufacturerDetail from "./pages/ManufacturerDetail";
import ProductDetail from "./pages/ProductDetail";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/company" element={<Company />} />
          <Route path="/products" element={<Products />} />
          <Route path="/manufacturers" element={<Manufacturers />} />
          <Route path="/manufacturers/:slug" element={<ManufacturerDetail />} />
          <Route path="/manufacturers/:manufacturerSlug/:productSlug" element={<ProductDetail />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
