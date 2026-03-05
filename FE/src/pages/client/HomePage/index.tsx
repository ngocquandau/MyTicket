import React from 'react';
import { Button, Typography, message } from 'antd';
import { LeftOutlined, RightOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../../layouts/ClientLayout';
import { getAllEventsAPI } from '../../../services/eventService';

const { Title } = Typography;

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
  const getLocationText = (location?: any) => {
    if (!location) return 'Đang cập nhật địa điểm';
    if (typeof location === 'string') return location;
    return location.city || location.address || 'Đang cập nhật địa điểm';
  };

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 text-white bg-[#1d3f73]">
        {/* Top carousel */}
        <div className="relative rounded-2xl border border-[#1d3f73] bg-gradient-to-br from-[#0b1528] via-[#132544] to-[#1a2c4d] px-4 md:px-8 py-6 md:py-8 shadow-[0_0_40px_rgba(34,121,255,0.15)] overflow-hidden">
          <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#1d5bcb]/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 w-72 h-72 rounded-full bg-[#2d8cff]/20 blur-3xl" />

          <button onClick={handlePrev} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#0f1f39]/90 border border-[#3f6ba8] text-[#b8d4ff] flex items-center justify-center z-10 hover:bg-[#17335f] transition-colors">
            <LeftOutlined />
          </button>

          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1fr] gap-3 md:gap-4 items-center z-[1] [perspective:1400px]">
            {visibleEvents.map((ev, idx) => (
              <div
                key={ev._id}
                className={`relative rounded-xl overflow-hidden bg-[#0b1629]/80 border border-[#355d9a] h-[180px] md:h-[250px] lg:h-[280px] transition-all duration-500 ease-out ${
                  idx === 1
                    ? 'md:scale-[1.08] md:z-20 md:-translate-y-1 shadow-[0_24px_48px_rgba(20,90,180,0.42)]'
                    : idx === 0
                      ? 'md:scale-[0.78] md:z-10 md:-mr-12 md:rotate-y-[24deg] md:origin-right opacity-80'
                      : 'md:scale-[0.78] md:z-10 md:-ml-12 md:rotate-y-[-24deg] md:origin-left opacity-80'
                }`}
              >
                <img
                  src={ev.posterURL}
                  alt={ev.title}
                  className="block w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040a14]/90 via-[#040a14]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1">{ev.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {!!visibleEvents[1] && (
            <div className="relative z-[1] mt-5 flex justify-center">
              <Button
                type="default"
                className="!h-10 !px-7 !rounded-full !bg-transparent !text-[#7bc1ff] !border-[#3f79c9] hover:!text-white hover:!border-[#62a5ff] hover:!bg-[#173a68]"
                onClick={() => navigate(`/event/${visibleEvents[1]._id}`, { state: { event: visibleEvents[1] } })}
              >
                XEM CHI TIẾT
              </Button>
            </div>
          )}

          <button onClick={handleNext} className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#0f1f39]/90 border border-[#3f6ba8] text-[#b8d4ff] flex items-center justify-center z-10 hover:bg-[#17335f] transition-colors">
            <RightOutlined />
          </button>
        </div>

        {/* Popular events */}
        <div className="mt-9 md:mt-10">
          <div className="flex items-center justify-between mb-6">
            <Title level={4} className="!text-white !m-0 !tracking-wide !uppercase !text-[26px]">SỰ KIỆN PHỔ BIẾN</Title>
            <button onClick={() => navigate('/search?all=1')} className="text-sm text-[#b0c9ec] hover:text-[#79b7ff]">
              XEM THÊM &gt;&gt;&gt;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {events.slice(0, 6).map(ev => (
              <div
                key={ev._id}
                className="h-full rounded-2xl overflow-hidden border border-[#2a446f] bg-[#0b1422] shadow-[0_10px_30px_rgba(5,12,23,0.45)] hover:border-[#4579bf] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => navigate(`/event/${ev._id}`, { state: { event: ev } })}
              >
                <div className="h-52 md:h-56 overflow-hidden bg-[#101a2b] flex items-center justify-center">
                  <img src={ev.posterURL} alt={ev.title} className="block w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg md:text-xl leading-6 min-h-[48px] mb-2 line-clamp-2 text-white">{ev.title}</h3>
                  <div className="flex items-start gap-2 text-sm text-[#a8b6ca] min-h-[44px] mb-2">
                    <EnvironmentOutlined />
                    <span className="line-clamp-2 leading-5">{getLocationText(ev.location)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#a8b6ca] min-h-[24px] mb-4">
                    <CalendarOutlined />
                    <span>{formatEventDate(ev.startDateTime)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs md:text-sm px-3 py-1 rounded-full border border-[#3b6ea8] text-[#79b7ff] bg-[#0e1f36]">
                      {getMinPrice(ev.tickets)}
                    </span>
                    <Button
                      type="default"
                      size="small"
                      className="!h-8 !rounded-full !border-[#456c9e] !bg-[#10233f] !text-[#d3e8ff] hover:!border-[#67a8ff] hover:!text-white hover:!bg-[#1a3d6d]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event/${ev._id}`, { state: { event: ev } });
                      }}
                    >
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
