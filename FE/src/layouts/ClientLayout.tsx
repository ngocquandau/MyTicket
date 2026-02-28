import React, { useEffect, useState } from 'react';
import { Typography, message, Dropdown, MenuProps, Avatar, Modal, Input, Button } from 'antd'; // Thêm Dropdown, Avatar, Modal, Input, Button
import { Link, useNavigate } from 'react-router-dom';
import {
  QuestionCircleOutlined,
  MailOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  FacebookOutlined,
  TwitterOutlined,
  SearchOutlined,
  CreditCardOutlined,
  UserOutlined,
  LogoutOutlined, // Icon đăng xuất
} from '@ant-design/icons';
import Footer from '../components/Footer';
import RegisterModal from '../components/auth/RegisterModal'; // Sửa lại đường dẫn import đúng case
import LoginModal from '../components/auth/LoginModal';       // Sửa lại đường dẫn import đúng case
import logo from '../assets/myticket_logo.png';
import { logoutAPI } from '../services/authService';

const { Title } = Typography;

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<{ path: string; state?: any } | null>(null);
  const [keyword, setKeyword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State kiểm tra đăng nhập
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const navigate = useNavigate();

  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token); // Chuyển đổi sang boolean
  }, []); // Chỉ chạy 1 lần khi mount (hoặc thêm dependencies nếu token thay đổi động)

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      message.success('Đăng xuất thành công');
      navigate('/');
    }
  };

  const navigateToSearch = React.useCallback(() => {
    const q = keyword.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    else navigate('/search?all=1');
  }, [keyword, navigate]);

  // Xử lý khi bấm "Vé của tôi"
  const handleMyTicketsClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault(); // Chặn chuyển trang
      message.info('Vui lòng đăng nhập để xem vé của bạn');
      setPendingRedirect({ path: '/my-tickets' });
      setIsLoginOpen(true); // Mở modal login
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    setIsLoggedIn(true);
    if (pendingRedirect) {
      navigate(pendingRedirect.path, { state: pendingRedirect.state });
      setPendingRedirect(null);
    }
  };

  // Menu Dropdown cho Avatar
  const userMenu: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Link to="/profile">Thông tin tài khoản</Link>
      ),
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true, // Màu đỏ cho nút đăng xuất
    },
  ];

  const openSupport = () => setIsSupportOpen(true);
  const closeSupport = () => setIsSupportOpen(false);
  const sendSupport = async () => {
    if (!supportMessage.trim()) {
      message.warning('Vui lòng nhập nội dung hỗ trợ');
      return;
    }
    setSendingSupport(true);
    // Demo: hiện message local, không gọi API
    await new Promise((r) => setTimeout(r, 600));
    setSendingSupport(false);
    message.success('Tin nhắn hỗ trợ đã được gửi (demo)');
    setSupportMessage('');
    setIsSupportOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-[#2D2D2D] text-white py-2">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-xs flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MailOutlined />
              <span>support@myticket.vn</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-lg">
            <InstagramOutlined className="hover:text-[#0D99FF] cursor-pointer" />
            <YoutubeOutlined className="hover:text-[#0D99FF] cursor-pointer" />
            <FacebookOutlined className="hover:text-[#0D99FF] cursor-pointer" />
            <TwitterOutlined className="hover:text-[#0D99FF] cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="py-4 bg-white shadow sticky top-0 z-50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          
          {/* Cột 1: Logo */}
          <div className="min-w-[220px] flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <img src={logo} alt="logo" className="h-10 w-auto" />
              <Title level={3} className="!m-0 !text-[#0D99FF] !font-bold">MYTICKET</Title>
            </Link>
          </div>
          
          {/* Cột 2: Thanh tìm kiếm */}
          <div className="flex-1 flex justify-center mx-6"> 
            <div className="relative flex items-center w-full max-w-[600px]">
              <input
                className="w-full h-10 pl-4 pr-12 rounded-full border border-gray-300 focus:border-[#23A6F0] focus:outline-none transition-colors shadow-sm"
                placeholder="Tìm sự kiện, nghệ sĩ..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigateToSearch(); }}
              />
              <button
                onClick={navigateToSearch}
                className="absolute right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Tìm kiếm"
              >
                <SearchOutlined className="text-gray-500 text-lg" />
              </button>
            </div>
          </div>
          
          {/* Cột 3: Menu phải */}
          <div className="flex items-center gap-6 text-sm font-semibold min-w-fit"> 
            {/* Vé của tôi */}
            <Link 
              to="/my-tickets" 
              onClick={handleMyTicketsClick} // Gắn hàm xử lý click
              className="flex items-center gap-2 text-[#0D99FF] hover:text-[#0b7ecf] transition-colors no-underline group"
            >
              <div className="p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                <CreditCardOutlined className="text-xl" />
              </div>
              <span className="hidden md:inline">Vé của tôi</span>
            </Link>

            {/* Phân luồng hiển thị: Đã đăng nhập vs Chưa đăng nhập */}
            {isLoggedIn ? (
              // Case 1: Đã đăng nhập -> Hiển thị Avatar + Dropdown
              <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow trigger={['click']}>
                <div className="cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar 
                    size="large" 
                    icon={<UserOutlined />} 
                    className="bg-[#23A6F0]" 
                    // src="url_avatar_user" // Nếu có url avatar thì bỏ comment dòng này
                  />
                </div>
              </Dropdown>
            ) : (
              // Case 2: Chưa đăng nhập -> Hiển thị Login / Register
              <div className="flex items-center gap-1 text-gray-600">
                <button 
                  onClick={() => setIsLoginOpen(true)} 
                  className="px-4 py-2 hover:text-[#0D99FF] hover:bg-blue-50 rounded-lg transition-all font-semibold"
                >
                  Đăng nhập
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => setIsRegisterOpen(true)} 
                  className="px-4 py-2 bg-[#23A6F0] text-white rounded-lg hover:bg-[#1890ff] shadow-md hover:shadow-lg transition-all font-semibold"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="flex-grow bg-[#F8F9FA]">
        {children}
      </main>

      <Footer />

      {/* Modals */}
      <LoginModal 
        open={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onRegisterClick={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }} 
        onLoginSuccess={handleLoginSuccess} // Cập nhật state khi login thành công
      />
      <RegisterModal 
        open={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onLoginClick={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }} 
      />

      {/* Support chat modal (UI-only demo) */}
      <Modal
        title="Hỗ trợ"
        open={isSupportOpen}
        onCancel={closeSupport}
        footer={null}
        centered
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">Gửi câu hỏi hoặc mô tả vấn đề. (Demo — chưa có API)</p>
          <Input.TextArea
            rows={6}
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder="Mô tả vấn đề, kèm thông tin liên hệ (email hoặc SĐT)"
          />
          <div className="flex justify-end gap-2">
            <Button onClick={closeSupport}>Đóng</Button>
            <Button type="primary" onClick={sendSupport} loading={sendingSupport}>Gửi</Button>
          </div>
        </div>
      </Modal>

      {/* Floating support icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          type="primary"
          shape="circle"
          size="large"
          onClick={openSupport}
          style={{ backgroundColor: '#23A6F0', borderColor: '#23A6F0' }}
          aria-label="Open support chat"
        >
          <QuestionCircleOutlined />
        </Button>
      </div>
    </div>
  );
};

export default ClientLayout;