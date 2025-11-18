import React from 'react';
import { Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  QuestionCircleOutlined,
  MailOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  FacebookOutlined,
  TwitterOutlined,
  SearchOutlined,
  FilterOutlined,
  CreditCardOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Footer from '../components/Footer';
import RegisterModal from '../components/auth/RegisterModal';
import LoginModal from '../components/auth/LoginModal';
import logo from '../assets/myticket_logo.png';

const { Title } = Typography;

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [keyword, setKeyword] = React.useState(''); // search keyword
  const navigate = useNavigate();

  const doSearch = React.useCallback(() => {
    const q = keyword.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    else navigate('/search?all=1');
  }, [keyword, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-[#2D2D2D] text-white py-2">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-xs flex items-center gap-4">
            <div className="flex items-center gap-2">
                <QuestionCircleOutlined />
                <span className='text-sx'>Hỗ trợ</span>
            </div>
            <div className="flex items-center gap-2">
                <MailOutlined />
                <span className='text-sx'>support@myticket.vn</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <InstagramOutlined />
            <YoutubeOutlined />
            <FacebookOutlined />
            <TwitterOutlined />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="py-4 bg-white shadow">
        <div className="container mx-auto px-6 flex items-center justify-between">
          
          {/* Cột 1: Logo (Giữ nguyên kích thước tối thiểu) */}
          <div className="min-w-[220px] flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <img src={logo} alt="logo" className="h-8 w-auto" />
              <Title level={3} className="!m-0 !text-[#0D99FF] !font-bold">MYTICKET</Title>
            </Link>
          </div>
          
          {/* Cột 2: Thanh tìm kiếm (Mở rộng để chiếm phần lớn không gian giữa) */}
          <div className="flex-1 flex justify-center mx-6"> 
            <div className="relative flex items-center w-full max-w-[600px]">
              <input
                className="w-full h-10 pl-4 pr-20 rounded-full border border-gray-300 focus:border-[#23A6F0] focus:outline-none transition-colors"
                placeholder="Nhập tên sự kiện hoặc tên đơn vị tổ chức..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                aria-label="Tìm kiếm sự kiện hoặc đơn vị tổ chức"
              />
              <div className="absolute right-3 flex items-center gap-3">
                <button
                  onClick={doSearch}
                  className="hover:opacity-80"
                  aria-label="Thực hiện tìm kiếm"
                >
                  <SearchOutlined className="text-gray-600 text-lg" />
                </button>
                {/* <button className="hover:opacity-80"><FilterOutlined className="text-gray-600 text-lg" /></button> */}
              </div>
            </div>
          </div>
          
          {/* Cột 3: Vé của tôi và Auth (Giữ nguyên kích thước tối thiểu và căn phải) */}
          <div className="flex items-center gap-4 text-sm font-semibold min-w-fit"> 
            {/* Vé của tôi (Nút hình chữ nhật bo tròn) */}
            <Link 
              to="/my-tickets" 
              className="flex items-center gap-1 text-[#0D99FF] bg-white border border-[#0D99FF] px-3 py-1 rounded-lg hover:bg-[#0D99FF] hover:text-white transition-colors no-underline whitespace-nowrap"
            >
                <CreditCardOutlined className="text-lg" />
                <span>Vé của tôi</span>
            </Link>

            {/* Login / Register (Link text) */}
            <div className="flex items-center gap-1 text-gray-700 whitespace-nowrap">
                <UserOutlined className="text-lg text-[#0D99FF]" /> {/* Icon trang trí */}
                
                {/* Link Login */}
                <button 
                  onClick={() => setIsLoginOpen(true)} 
                  className="text-gray-700 hover:text-[#0D99FF] hover:underline transition-colors no-underline bg-transparent border-none cursor-pointer p-0 font-semibold"
                >
                    Login
                </button>
                
                <span className="text-gray-400">/</span>
                
                {/* Link Register */}
                <button 
                  onClick={() => setIsRegisterOpen(true)} 
                  className="text-gray-700 hover:text-[#0D99FF] hover:underline transition-colors no-underline bg-transparent border-none cursor-pointer p-0 font-semibold"
                >
                    Register
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* horizontal separator between header and page content */}
      <div className="border-b border-gray-200" />

      <main className="flex-grow bg-[#EAF8FF]">
        {children}
      </main>

      <Footer />

      <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} onRegisterClick={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }} />
      <RegisterModal open={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onLoginClick={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }} />
    </div>
  );
};

export default ClientLayout;