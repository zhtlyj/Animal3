import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AnimalsProvider } from './contexts/AnimalsContext';
import { DonationProvider } from './contexts/DonationContext';
import { WalletProvider } from './contexts/WalletContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import AdoptionCenter from './pages/AdoptionCenter';
import Guide from './pages/Guide';
import Profile from './pages/Profile';
import AdoptionManagement from './pages/AdoptionManagement';
import MyAnimals from './pages/MyAnimals';
import MyAdoptions from './pages/MyAdoptions';
import MyAdoptedAnimals from './pages/MyAdoptedAnimals';
import Publish from './pages/Publish';
import AnimalDetailPage from './pages/AnimalDetailPage';
import AdoptionApply from './pages/AdoptionApply';
import RescueAnimal from './pages/RescueAnimal';
import Donate from './pages/Donate';
import MyAnimalDetail from './pages/MyAnimalDetail';
import History from './pages/History';
import NavBar from './components/NavBar';
// Dashboard 已废弃，统一使用 Home
import './App.css';

function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <AnimalsProvider>
          <DonationProvider>
            <div className="App">
              <NavBar />
              <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/adoption" element={<AdoptionCenter />} />
          <Route path="/guide" element={<Guide />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/adoption-management" element={<AdoptionManagement />} />
            <Route path="/my-animals" element={<MyAnimals />} />
            <Route path="/my-adoptions" element={<MyAdoptions />} />
            <Route path="/my-adopted-animals" element={<MyAdoptedAnimals />} />
          { /* 去除 /dashboard 路由，避免登录后落到旧页面 */ }
          <Route path="/publish" element={<Publish />} />
          <Route path="/animals/:id" element={<AnimalDetailPage />} />
          <Route path="/my-animals/:id" element={<MyAnimalDetail />} />
          <Route path="/adopt/:id/apply" element={<AdoptionApply />} />
          <Route path="/rescue/:id/apply" element={<RescueAnimal />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/history" element={<History />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
              </Routes>
            </div>
          </DonationProvider>
        </AnimalsProvider>
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;
