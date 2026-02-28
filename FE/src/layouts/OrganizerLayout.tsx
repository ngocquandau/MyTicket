import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { logoutAPI } from '../services/authService';
import {
  MailOutlined,
  InstagramFilled,
  YoutubeFilled,
  FacebookFilled,
  TwitterOutlined,
  LogoutOutlined,
  UserOutlined,
  DollarOutlined,
  LayoutOutlined,
  MessageOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const OrganizerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('token');
      message.success('Đăng xuất thành công');
      navigate('/');
    }
  };

  const menuItems = [
    { label: 'Revenue', icon: <DollarOutlined />, path: '/organizer/revenue' },
    { label: 'Event Information', icon: <LayoutOutlined />, path: '/organizer/events' },
    { label: 'Messages', icon: <MessageOutlined />, path: '/organizer/messages' },
    { label: 'Profile', icon: <SettingOutlined />, path: '/organizer/profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#333]">
      <div className="bg-[#3b3b3b] text-white py-2 px-8">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-light opacity-80">
            <MailOutlined />
            <span>organizer@example.com</span>
          </div>
          <div className="flex items-center gap-5 text-sm opacity-90">
            <InstagramFilled className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
            <YoutubeFilled className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
            <FacebookFilled className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
            <TwitterOutlined className="hover:text-[#0D99FF] cursor-pointer transition-colors" />
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="text-[#0D99FF] font-black text-2xl tracking-[ -0.05em]">MYTICKET</div>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 font-bold text-xs tracking-wider text-gray-500 hover:text-red-500 transition-all"
          >
            LOG-OUT
            <LogoutOutlined className="text-lg group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-[#FFF7EE] font-bold flex flex-col border-r border-yellow-50/50">
          <div className="py-12 flex flex-col items-center">
            <div className="relative group">
              <div className="bg-white p-5 rounded-full border border-gray-100 shadow-md transition-transform group-hover:scale-105">
                <UserOutlined style={{ fontSize: '36px', color: '#555' }} />
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>

          <nav className="flex-1 px-4">
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path} className="relative">
                    <Link
                      to={item.path}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 group ${
                        isActive ? 'bg-[#F6C85F]/20 text-[#D97706] shadow-sm' : 'text-gray-900 hover:bg-white hover:text-[#D97706]'
                      }`}
                    >
                      <span className={`text-xl flex items-center ${isActive ? 'text-[#D97706]' : 'group-hover:text-[#D97706]'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-[14px] tracking-tight">{item.label}</span>
                    </Link>
                    {isActive && <div className="absolute left-[-16px] top-1/4 bottom-1/4 w-1 bg-[#D97706] rounded-r-full"></div>}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 bg-[#FFFDF8] p-10">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default OrganizerLayout;
