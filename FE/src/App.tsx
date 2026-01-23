import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/client/HomePage';
import EventDetail from './pages/client/EventDetail';
import SreachResultPage from './pages/client/SreachResultPage';
import CheckoutPage from './pages/client/CheckoutPage';
import PaymentResultPage from './pages/client/PaymentResultPage'; // Mới
import MyTicketsPage from './pages/client/MyTicketsPage'; // Mới
import EventOrganizerPage from './pages/admin/EventOrganizerPage';
import EventInforPage from './pages/admin/EventInforPage';
import TicketInforPage from './pages/admin/TicketInforPage';
import MessagesPage from './pages/admin/MessagesPage';
import SettingPage from './pages/admin/SettingPage';
import RevenuePage from './pages/organizer/RevenuePage';
import OrganizerEventInforPage from './pages/organizer/EventInforPage';
import OrganizerMessagesPage from './pages/organizer/MessagesPage';
import OrganizerSettingPage from './pages/organizer/SettingPage';

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
        
        {/* Admin routes */}
        <Route path="/admin/events" element={<EventInforPage />} />
        <Route path="/admin/tickets" element={<TicketInforPage />} />
        <Route path="/admin/organizer" element={<EventOrganizerPage />} />
        <Route path="/admin/messages" element={<MessagesPage />} />
        <Route path="/admin/settings" element={<SettingPage />} />

        {/* Organizer routes */}
        <Route path="/organizer/revenue" element={<RevenuePage />} />
        <Route path="/organizer/events" element={<OrganizerEventInforPage />} />
        <Route path="/organizer/messages" element={<OrganizerMessagesPage />} />
        <Route path="/organizer/settings" element={<OrganizerSettingPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;