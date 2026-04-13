import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/client/HomePage';
import EventDetail from './pages/client/EventDetail';
import SreachResultPage from './pages/client/SreachResultPage';
import CheckoutPage from './pages/client/CheckoutPage';
import PaymentResultPage from './pages/client/PaymentResultPage'; 
import MyTicketsPage from './pages/client/MyTicketsPage'; 
import TicketInfoPage from './pages/client/TicketInfoPage';
import ProfilePage from './pages/client/ProfilePage';

// Các trang mới của đồng nghiệp
import MyReviewsPage from './pages/client/MyReviewsPage';
import PurchaseHistoryPage from './pages/client/PurchaseHistoryPage';

// Admin & Organizer
import EventOrganizerPage from './pages/admin/EventOrganizerPage';
import EventInforPage from './pages/admin/EventInforPage';
import TicketInforPage from './pages/admin/TicketInforPage';
import CustomerInforPage from './pages/admin/CustomerInforPage';
import SettingPage from './pages/admin/SettingPage';
import StatisticsPage from './pages/admin/StatisticsPage';
import StatisPage from './pages/organizer/StatisPage';
import OrganizerEventInforPage from './pages/organizer/EventInforPage';
import OrganizerMessagesPage from './pages/organizer/MessagesPage';
import OrganizerSettingPage from './pages/organizer/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { AUTH_CHANGE_EVENT, getUserRole } from './utils/auth';

const App: React.FC = () => {
  const [, setAuthVersion] = React.useState(0);

  React.useEffect(() => {
    const handleAuthChanged = () => {
      setAuthVersion((current) => current + 1);
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChanged);
    window.addEventListener('storage', handleAuthChanged);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChanged);
      window.removeEventListener('storage', handleAuthChanged);
    };
  }, []);

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
        {/* Public Routes */}
        <Route path="/" element={role && role !== 'user' ? <Navigate to={roleHome} replace /> : <HomePage />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/search" element={<SreachResultPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/ticket-info/:ticketId" element={<TicketInfoPage />} />
        
        {/* User Routes (Bảo vệ) */}
        <Route path="/my-tickets" element={<ProtectedRoute allowedRoles={['user']}><MyTicketsPage /></ProtectedRoute>} />
        <Route path="/purchase-history" element={<ProtectedRoute allowedRoles={['user']}><PurchaseHistoryPage /></ProtectedRoute>} />
        <Route path="/my-reviews" element={<ProtectedRoute allowedRoles={['user']}><MyReviewsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['user']}><ProfilePage /></ProtectedRoute>} />
        
        {/* Admin Routes - chỉ admin mới truy cập */}
        <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><EventInforPage /></ProtectedRoute>} />
        <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={['admin']}><TicketInforPage /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']}><CustomerInforPage /></ProtectedRoute>} />
        <Route path="/admin/organizer" element={<ProtectedRoute allowedRoles={['admin']}><EventOrganizerPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingPage /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/settings" replace /></ProtectedRoute>} />
        <Route path="/admin/statistics" element={<ProtectedRoute allowedRoles={['admin']}><StatisticsPage /></ProtectedRoute>} />

        {/* Organizer Routes - chỉ organizer mới truy cập */}
        <Route path="/organizer/statistics" element={<ProtectedRoute allowedRoles={['organizer']}><StatisPage /></ProtectedRoute>} />
        <Route path="/organizer/st" element={<ProtectedRoute allowedRoles={['organizer']}><Navigate to="/organizer/statistics" replace /></ProtectedRoute>} />
        <Route path="/organizer/events" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerEventInforPage /></ProtectedRoute>} />
        <Route path="/organizer/messages" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerMessagesPage /></ProtectedRoute>} />
        <Route path="/organizer/profile" element={<ProtectedRoute allowedRoles={['organizer']}><OrganizerSettingPage /></ProtectedRoute>} />

        {/* Redirect mồi */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/events" replace /></ProtectedRoute>} />
        <Route path="/organizer" element={<ProtectedRoute allowedRoles={['organizer']}><Navigate to="/organizer/events" replace /></ProtectedRoute>} />

        {/* Fallback 404 */}
        <Route path="*" element={<Navigate to={roleHome} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;