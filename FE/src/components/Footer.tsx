import React from 'react';
import { Typography } from 'antd';
import { 
  FacebookOutlined, 
  InstagramOutlined, 
  YoutubeOutlined, 
  TwitterOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2D2D2D] text-white pt-14 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Title level={4} className="!text-white mb-6">MYTICKET</Title>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HomeOutlined />
                <Text className="text-gray-300">
                  158 Lĩnh Đông, Thủ Đức, TP.HCM
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <PhoneOutlined />
                <Text className="text-gray-300">
                  0123.456.789
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <MailOutlined />
                <Text className="text-gray-300">
                  support@myticket.vn
                </Text>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <Title level={4} className="!text-white mb-6">LIÊN KẾT</Title>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white">Về chúng tôi</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Điều khoản sử dụng</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Chính sách bảo mật</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">FAQ</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <Title level={4} className="!text-white mb-6">DANH MỤC</Title>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white">Âm nhạc</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Thể thao</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Festival</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Nghệ thuật</a></li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div>
            <Title level={4} className="!text-white mb-6">KẾT NỐI VỚI CHÚNG TÔI</Title>
            <div className="flex gap-4 mb-6">
              <a href="#" className="text-gray-300 hover:text-white text-2xl">
                <InstagramOutlined />

              </a>
              <a href="#" className="text-gray-300 hover:text-white text-2xl">
                <YoutubeOutlined />
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-2xl">
                <FacebookOutlined />
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-2xl">
                <TwitterOutlined />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-3 border-t border-gray-700 text-center">
          <Text className="text-gray-400">
            © {new Date().getFullYear()} MyTicket. Tất cả quyền được bảo lưu.
          </Text>
        </div>
      </div>
    </footer>
  );
};

export default Footer;