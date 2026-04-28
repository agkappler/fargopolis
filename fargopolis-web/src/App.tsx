import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { SwrConfigWrapper } from "@/components/SwrConfigWrapper";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { AboutPage } from "@/pages/AboutPage";
import { BountiesPage } from "@/pages/BountiesPage";
import { CharacterActionsPage } from "@/pages/CharacterActionsPage";
import { CharacterDetailPage } from "@/pages/CharacterDetailPage";
import { DndGlossaryClassesPage } from "@/pages/DndGlossaryClassesPage";
import { DndGlossaryPage } from "@/pages/DndGlossaryPage";
import { DndGlossaryRacesPage } from "@/pages/DndGlossaryRacesPage";
import { DndPage } from "@/pages/DndPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { RecipeDetailPage } from "@/pages/RecipeDetailPage";
import { RecipesPage } from "@/pages/RecipesPage";
import { SplitCheckPage } from "@/pages/SplitCheckPage";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

function AppShell() {
  return (
    <SwrConfigWrapper>
      <ThemeRegistry>
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/bounties" element={<BountiesPage />} />
            <Route path="/split-check" element={<SplitCheckPage />} />
            <Route path="/dnd" element={<DndPage />} />
            <Route path="/dnd/glossary" element={<DndGlossaryPage />} />
            <Route path="/dnd/glossary/classes" element={<DndGlossaryClassesPage />} />
            <Route path="/dnd/glossary/races" element={<DndGlossaryRacesPage />} />
            <Route path="/dnd/:id" element={<CharacterDetailPage />} />
            <Route path="/dnd/:id/actions" element={<CharacterActionsPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </ThemeRegistry>
      <ToastContainer />
    </SwrConfigWrapper>
  );
}

export default function App() {
  return <AppShell />;
}
