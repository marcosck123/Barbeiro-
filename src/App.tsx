import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import BarberPanel from './pages/BarberPanel';
import Booking from './pages/Booking';
import { initStorage } from './services/storage';

export default function App() {
  useEffect(() => {
    initStorage();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-dark text-white selection:bg-white selection:text-black">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/barber" element={<BarberPanel />} />
              <Route path="/booking" element={<Booking />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
