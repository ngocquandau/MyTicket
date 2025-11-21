import React from 'react';
import { Button, Typography, message } from 'antd';
import { LeftOutlined, RightOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../../layouts/ClientLayout';
import { getAllEventsAPI } from '../../../services/eventService';

const { Title, Text } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = React.useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    getAllEventsAPI()
      .then(setEvents)
      .catch(() => message.error('Không thể tải sự kiện'));
  }, []);

  // Auto slide
  React.useEffect(() => {
    if (!events.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % events.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [events]);

  const getMinPrice = (tickets?: Array<{ price: string | number }>) => {
    if (!tickets || tickets.length === 0) return 'Đang cập nhật';
    const prices = tickets
      .map(t => parseInt(String(t.price).replace(/[^\d]/g, '')) || 0)
      .filter(p => p > 0);
    if (!prices.length) return 'Đang cập nhật';
    return `Từ ${Math.min(...prices).toLocaleString('vi-VN')} VND`;
  };

  const visibleEvents = React.useMemo(() => {
    if (!events.length) return [];
    return [0, 1, 2].map(i => events[(currentIndex + i) % events.length]);
  }, [currentIndex, events]);

  const handlePrev = () => setCurrentIndex(current => current === 0 ? events.length - 1 : current - 1);
  const handleNext = () => setCurrentIndex(current => (current + 1) % events.length);

  const formatEventDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');

  return (
    <ClientLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Top carousel */}
        <div className="relative bg-[#EAF8FF] p-8 rounded-lg">
          <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center z-10 hover:bg-gray-50">
            <LeftOutlined />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {visibleEvents.map(ev => (
              <div key={ev._id} className="relative rounded-lg overflow-hidden h-[400px] group bg-gray-100">
                <img src={ev.posterURL} alt={ev.title} className="block w-full h-full object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg font-semibold mb-1 line-clamp-2">{ev.title}</h3>
                  <div className="flex items-center justify-between">
                    <Text className="text-white/90">{ev.location.city} • {formatEventDate(ev.startDateTime)}</Text>
                    <Button
                      type="primary"
                      className="!bg-[#23A6F0] group-hover:!bg-[#1890ff] transition-colors"
                      onClick={() => navigate(`/event/${ev._id}`, { state: { event: ev } })}
                    >
                      XEM CHI TIẾT
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center z-10 hover:bg-gray-50">
            <RightOutlined />
          </button>
        </div>

        {/* Popular events */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <Title level={4} className="!text-[#E04646] !m-0">SỰ KIỆN PHỔ BIẾN</Title>
            <button onClick={() => navigate('/search?all=1')} className="text-sm text-gray-700 hover:text-[#E04646] underline">
              XEM THÊM &gt;&gt;&gt;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 6).map(ev => (
              <div
                key={ev._id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/event/${ev._id}`, { state: { event: ev } })}
              >
                <div className="h-64 overflow-hidden bg-gray-100 flex items-center justify-center">
                  <img src={ev.posterURL} alt={ev.title} className="block w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{ev.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <EnvironmentOutlined />
                    <span>{ev.location.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <CalendarOutlined />
                    <span>{formatEventDate(ev.startDateTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#23A6F0]">{getMinPrice(ev.tickets)}</span>
                    <Button type="primary" size="small" className="!bg-[#23A6F0]" onClick={(e) => { e.stopPropagation(); navigate(`/event/${ev._id}`, { state: { event: ev } }); }}>
                      XEM CHI TIẾT
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default HomePage;
