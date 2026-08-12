import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { HomePage } from "@/pages/HomePage";
import { ArticlesIndexPage } from "@/pages/ArticlesIndexPage";
import { ArticlePage } from "@/pages/ArticlePage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="relative">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesIndexPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
