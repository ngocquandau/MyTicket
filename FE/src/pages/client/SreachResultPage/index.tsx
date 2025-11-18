import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Input, Tag, Button } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import ClientLayout from '../../../layouts/ClientLayout';
import { mockEvents, formatEventDate } from '../../../data/mockEvents';

const { Title, Text } = Typography;
const { Search } = Input;

function getOrganizerName(ev: any) {
  // Hỗ trợ cả organizer là object hoặc string
  if (typeof ev.organizer === 'object' && ev.organizer?.name) return ev.organizer.name;
  if (typeof ev.organizerName === 'string') return ev.organizerName;
  return '';
}

function getMinPrice(tickets?: Array<{ price: string | number }>) {
  if (!tickets?.length) return 'Đang cập nhật';
  const nums = tickets
    .map(t => parseInt(String(t.price).replace(/[^\d]/g, '')) || 0)
    .filter(n => n > 0);
  if (!nums.length) return 'Đang cập nhật';
  return `Từ ${Math.min(...nums).toLocaleString('vi-VN')} VND`;
}

const SreachResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const q = (params.get('q') || '').trim();
  const showAll = params.get('all') === '1';

  const results = React.useMemo(() => {
    if (showAll || q === '') return mockEvents;
    const query = q.toLowerCase();
    return mockEvents.filter(ev => {
      const title = ev.title?.toLowerCase() || '';
      const city = ev.location?.city?.toLowerCase() || '';
      const org = getOrganizerName(ev).toLowerCase();
      const genre = ev.genre?.toLowerCase() || '';
      return (
        title.includes(query) ||
        city.includes(query) ||
        org.includes(query) ||
        genre.includes(query)
      );
    });
  }, [q, showAll]);

  const onSearch = (value: string) => {
    const v = value.trim();
    if (!v) {
      setParams({ all: '1' });
    } else {
      setParams({ q: v });
    }
  };

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
                  Từ khóa: <Tag color="blue" className="align-middle">{q}</Tag> •
                  <span className="ml-2">{results.length} kết quả</span>
                </Text>
              )}
            </div>
          </div>
        </div>

        {results.length === 0 ? (
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
                {/* Poster đồng nhất, hiển thị đầy đủ ảnh */}
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
                    <span>{formatEventDate(ev.startDateTime)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#23A6F0]">
                      {getMinPrice(ev.tickets)}
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      className="!bg-[#23A6F0]"
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
        )}
      </div>
    </ClientLayout>
  );
};

export default SreachResultPage;