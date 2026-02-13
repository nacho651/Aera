import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import ManagePage from './pages/ManagePage';
import ExperiencePage from './pages/ExperiencePage';
import FleetPage from './pages/FleetPage';
import FleetDetailPage from './pages/FleetDetailPage';
import MissionPage from './pages/MissionPage';
import AboutPage from './pages/AboutPage';
import DestinationsPage from './pages/DestinationsPage';
import ContactPage from './pages/ContactPage';
import CitiesPage from './pages/CitiesPage';
import CityDetailPage from './pages/CityDetailPage';

const App = () => (
  <div className="app-shell">
    <Header />
    <main className="site-main">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/:aircraftSlug" element={<FleetDetailPage />} />
        <Route path="/mission" element={<MissionPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/cities" element={<CitiesPage />} />
        <Route path="/cities/:citySlug" element={<CityDetailPage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
