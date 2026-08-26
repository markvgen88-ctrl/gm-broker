import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { HomePage } from "@/pages/HomePage";
import { ArticlesIndexPage } from "@/pages/ArticlesIndexPage";
import { ArticlePage } from "@/pages/ArticlePage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminApplicationPage } from "@/pages/admin/AdminApplicationPage";

function AppShell() {
  // Внутренняя CRM-панель не должна показывать публичные шапку/футер сайта.
  const isAdminRoute = useLocation().pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      <div className="relative">
        {!isAdminRoute && <Header />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesIndexPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="applications/:id" element={<AdminApplicationPage />} />
          </Route>
        </Routes>
        {!isAdminRoute && <Footer />}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
