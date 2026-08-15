import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { HomePage } from "@/pages/HomePage";
import { ArticlesIndexPage } from "@/pages/ArticlesIndexPage";
import { ArticlePage } from "@/pages/ArticlePage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { AdminPage } from "@/pages/AdminPage";

function SiteLayout() {
  return (
    <div className="relative">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesIndexPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Route>
        {/* Страница без Header/Footer сайта — отдельная закрытая CRM за паролем */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
