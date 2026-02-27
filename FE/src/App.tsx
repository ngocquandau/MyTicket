import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/client/HomePage';
import EventDetail from './pages/client/EventDetail';
import SreachResultPage from './pages/client/SreachResultPage';
import CheckoutPage from './pages/client/CheckoutPage';
import PaymentResultPage from './pages/client/PaymentResultPage'; // Mới
import MyTicketsPage from './pages/client/MyTicketsPage'; // Mới
import TicketInfoPage from './pages/client/TicketInfoPage';
import ProfilePage from './pages/client/ProfilePage';
import EventOrganizerPage from './pages/admin/EventOrganizerPage';
import EventInforPage from './pages/admin/EventInforPage';
import TicketInforPage from './pages/admin/TicketInforPage';
import CustomerInforPage from './pages/admin/CustomerInforPage';
import MessagesPage from './pages/admin/MessagesPage';
import StatisticsPage from './pages/admin/StatisticsPage';
import RevenuePage from './pages/organizer/RevenuePage';
import OrganizerEventInforPage from './pages/organizer/EventInforPage';
import OrganizerMessagesPage from './pages/organizer/MessagesPage';
import OrganizerSettingPage from './pages/organizer/SettingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { getUserRole } from './utils/auth';

const App: React.FC = () => {
  const role = getUserRole();
  const roleHome = role === 'admin'
    ? '/admin/events'
    : role === 'organizer'
      ? '/organizer/events'
      : role === 'user'
        ? '/my-tickets'
        : '/';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={role && role !== 'user' ? <Navigate to={roleHome} replace /> : <HomePage />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/search" element={<SreachResultPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/my-tickets" element={<ProtectedRoute allowedRoles={['user']}><MyTicketsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['user']}><ProfilePage /></ProtectedRoute>} />
        <Route path="/ticket-info/:ticketId" element={<TicketInfoPage />} />
        
        {/* Admin routes - chỉ admin mới truy cập */}
        <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><EventInforPage /></ProtectedRoute>} />
        <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={['admin']}><TicketInforPage /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']}><CustomerInforPage /></ProtectedRoute>} />
        <Route path="/admin/organizer" element={<ProtectedRoute allowedRoles={['admin']}><EventOrganizerPage /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin']}><MessagesPage /></ProtectedRoute>} />
        <Route path="/admin/statistics" element={<ProtectedRoute allowedRoles={['admin']}><StatisticsPage /></ProtectedRoute>} />

        {/* Organizer routes - chỉ organizer mới truy cập */}
        <Route path="/organizer/revenue" element={<ProtectedRoute allowedRoles={['organizer']}><RevenuePage /></ProtectedRoute>} />
        <Route path="/organizer/events" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerEventInforPage /></ProtectedRoute>} />
        <Route path="/organizer/messages" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerMessagesPage /></ProtectedRoute>} />
        <Route path="/organizer/settings" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerSettingPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/events" replace /></ProtectedRoute>} />
        <Route path="/organizer" element={<ProtectedRoute allowedRoles={['organizer']}><Navigate to="/organizer/events" replace /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={roleHome} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;