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
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <Title level={3} className="!m-0">Kết quả tìm kiếm</Title>
            <div className="mt-1 text-gray-600">
              {showAll || !q ? (
                <Text>Sự kiện phù hợp • {results.length} kết quả</Text>
              ) : (
                <Text>
                  Từ khóa: <Tag color="blue">{q}</Tag> • <span>{results.length} kết quả</span>
                </Text>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-600">Đang tải dữ liệu...</div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-gray-600">
            Không tìm thấy sự kiện phù hợp.
            <div className="mt-4">
              <Button onClick={() => setParams({ all: '1' })}>Xem tất cả sự kiện</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((ev) => (
              <div
                key={ev._id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/event/${ev._id}`, { state: { event: ev } })}
              >
                <div className="h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={ev.posterURL}
                    alt={ev.title}
                    className="block w-full h-full object-contain"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{ev.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <EnvironmentOutlined />
                    <span>{ev.location?.city || 'Đang cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <CalendarOutlined />
                    <span>{new Date(ev.startDateTime).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#23A6F0]">{getMinPrice(ev.tickets)}</span>
                    <Button
                      type="primary"
                      size="small"
                      className="!bg-[#23A6F0]"
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
