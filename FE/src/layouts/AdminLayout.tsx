import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { getUserFromToken } from '../utils/auth';
import {
  MailOutlined,
  InstagramFilled,
  YoutubeFilled,
  FacebookFilled,
  TwitterOutlined,
  LogoutOutlined,
  UserOutlined,
  LayoutOutlined,
  IdcardOutlined,
  HomeOutlined,
  MessageOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== 'admin') {
      message.error('Bạn không có quyền truy cập trang quản trị');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const menuItems = [
    { label: 'Event Information', icon: <LayoutOutlined />, path: '/admin/events' },
    { label: 'Ticket Information', icon: <IdcardOutlined />, path: '/admin/tickets' },
    { label: 'Event Organizers', icon: <HomeOutlined />, path: '/admin/organizer' },
    { label: 'Messages', icon: <MessageOutlined />, path: '/admin/messages', badge: '2' },
    { label: 'Settings', icon: <SettingOutlined />, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#333]">
      {/* 1. TOP BAR - Làm gọn lại */}
      <div className="bg-[#3b3b3b] text-white py-2 px-8">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-light opacity-80">
            <MailOutlined />
            <span>admin123@example.com</span>
          </div>
          <div className="flex items-center gap-5 text-sm opacity-90">
            <InstagramFilled className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
            <YoutubeFilled className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
            <FacebookFilled className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
            <TwitterOutlined className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
          </div>
        </div>
      </div>

      {/* 2. HEADER - Tăng sự chuyên nghiệp */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="text-[#0D99FF] font-black text-2xl tracking-[ -0.05em]">
            MYTICKET
          </div>
          <div className="flex items-center gap-4">
            <button 
            onClick={handleLogout}
            className="group flex items-center gap-2 font-bold text-xs tracking-wider text-gray-500 hover:text-red-500 transition-all"
          >
            LOG-OUT 
            <LogoutOutlined className="text-lg group-hover:translate-x-1 transition-transform" />
          </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 3. SIDEBAR - Tinh chỉnh màu sắc và spacing */}
        <aside className="w-64 min-w-[16rem] flex-shrink-0 bg-[#EEF9FF] font-bold flex flex-col border-r border-blue-50/50 overflow-y-auto">
          {/* Avatar Section */}
          <div className="py-12 flex flex-col items-center">
            <div className="relative group">
              <div className="bg-white p-5 rounded-full border border-gray-100 shadow-md transition-transform group-hover:scale-105">
                <UserOutlined style={{ fontSize: '36px', color: '#555' }} />
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4">
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path} className="relative">
                    <Link
                      to={item.path}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 group ${
                        isActive 
                          ? 'bg-[#23A6F0]/20 text-[#0D99FF] shadow-sm' 
                          : 'text-gray-900 hover:bg-white hover:text-[#0D99FF]'
                      }`}
                    >
                      <span className={`text-xl flex items-center ${isActive ? 'text-[#0D99FF]' : 'group-hover:text-[#0D99FF]'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-[14px] tracking-tight truncate">{item.label}</span>
                      
                      {item.badge && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-[#0D99FF] text-white' : 'text-gray-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-[-16px] top-1/4 bottom-1/4 w-1 bg-[#0D99FF] rounded-r-full"></div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* 4. MAIN CONTENT AREA */}
        <main className="flex-1 bg-[#F8F9FA] p-6 overflow-x-hidden">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;