import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Tag, Button, message } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import ClientLayout from '../../../layouts/ClientLayout';
import { getAllEventsAPI } from '../../../services/eventService';

const { Title, Text } = Typography;

function getMinPrice(tickets?: Array<{ price: string | number }>) {
  if (!tickets?.length) return 'Đang cập nhật';
  const nums = tickets
    .map(t => parseInt(String(t.price).replace(/[^\d]/g, '')) || 0)
    .filter(n => n > 0);
  if (!nums.length) return 'Đang cập nhật';
  return `Từ ${Math.min(...nums).toLocaleString('vi-VN')} VND`;
}

function getLocationText(location?: any) {
  if (!location) return 'Đang cập nhật địa điểm';
  if (typeof location === 'string') return location;

  const parts = [
    location.address,
    location.ward,
    location.district,
    location.city,
    location.province,
  ].filter(Boolean);

  if (parts.length) return parts.join(', ');
  return location.venueName || 'Đang cập nhật địa điểm';
}

const SearchResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const SEARCH_DEBOUNCE_MS = 400;

  const q = (params.get('q') || '').trim();
  const showAll = params.get('all') === '1';

  React.useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getAllEventsAPI();
        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          message.error('Không thể tải sự kiện');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (showAll || q === '') {
      fetchEvents();
    } else {
      timer = window.setTimeout(fetchEvents, SEARCH_DEBOUNCE_MS);
    }

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [q, showAll]);

  const results = events;

  return (
    <ClientLayout>
      <div className="container bg-[#1d3f73] mx-auto px-4 md:px-6 py-6 md:py-8 text-white">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <Title level={3} className="!m-0 !text-white !uppercase !tracking-wide">Kết quả tìm kiếm</Title>
            <div className="mt-2 text-[#a9bdd8]">
              {showAll || !q ? (
                <Text className="!text-[#a9bdd8]">Sự kiện phù hợp • {results.length} kết quả</Text>
              ) : (
                <Text className="!text-[#a9bdd8]">
                  Từ khóa: <Tag className="!bg-[#122949] !border-[#335d94] !text-[#8bc1ff]">{q}</Tag> • <span>{results.length} kết quả</span>
                </Text>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#9db2cf]">Đang tải dữ liệu...</div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-[#9db2cf] border border-[#233a5e] rounded-2xl bg-[#0a1424]">
            Không tìm thấy sự kiện phù hợp.
            <div className="mt-4">
              <Button
                type="default"
                className="!h-9 !rounded-full !border-[#4f7db8] !bg-[#132946] !text-[#d2e8ff] hover:!border-[#70abff] hover:!bg-[#1a3b66]"
                onClick={() => setParams({ all: '1' })}
              >
                Xem tất cả sự kiện
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {results.map((ev) => (
              <div
                key={ev._id}
                className="h-full rounded-2xl overflow-hidden border border-[#2a446f] bg-[#0b1422] shadow-[0_10px_30px_rgba(5,12,23,0.45)] hover:border-[#4579bf] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => navigate(`/event/${ev._id}`, { state: { event: ev } })}
              >
                <div className="h-52 md:h-56 bg-[#101a2b] flex items-center justify-center overflow-hidden">
                  <img
                    src={ev.posterURL}
                    alt={ev.title}
                    className="block w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg md:text-xl leading-6 min-h-[48px] mb-2 line-clamp-2 text-white">{ev.title}</h3>
                  <div className="flex items-start gap-2 text-sm text-[#a8b6ca] min-h-[44px] mb-1">
                    <EnvironmentOutlined />
                    <span className="line-clamp-2 leading-5">{getLocationText(ev.location)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#a8b6ca] min-h-[24px] mb-4">
                    <CalendarOutlined />
                    <span>{new Date(ev.startDateTime).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs md:text-sm px-3 py-1 rounded-full border border-[#3b6ea8] text-[#79b7ff] bg-[#0e1f36]">{getMinPrice(ev.tickets)}</span>
                    <Button
                      type="default"
                      size="small"
                      className="!h-8 !rounded-full !border-[#456c9e] !bg-[#10233f] !text-[#d3e8ff] hover:!border-[#67a8ff] hover:!text-white hover:!bg-[#1a3d6d]"
                      onClick={(e) => { e.stopPropagation(); navigate(`/event/${ev._id}`, { state: { event: ev } }); }}
                    >
                      XEM CHI TIẾT
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default SearchResultPage;
