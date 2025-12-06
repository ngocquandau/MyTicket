import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/client/HomePage';
import EventDetail from './pages/client/EventDetail';
import SreachResultPage from './pages/client/SreachResultPage';
import CheckoutPage from './pages/client/CheckoutPage';
import PaymentResultPage from './pages/client/PaymentResultPage'; // Mới
import MyTicketsPage from './pages/client/MyTicketsPage'; // Mới

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/search" element={<SreachResultPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        

        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;