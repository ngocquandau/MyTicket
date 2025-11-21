import React from 'react';
import { Typography, Button, message } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, HomeOutlined, CommentOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '../../../layouts/ClientLayout';
import { getEventByIdAPI } from '../../../services/eventService';
import { getTicketClassesByEventAPI } from '../../../services/ticketService';

const { Title, Text } = Typography;

type Ticket = { type: string; price: string | number; status: string };

const EventDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation() as { state?: any };
  const stateEvent = location.state?.event;

  const [event, setEvent] = React.useState<any>(stateEvent);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [introOpen, setIntroOpen] = React.useState(true);
  const priceSectionRef = React.useRef<HTMLDivElement | null>(null);

  // Lấy event
  React.useEffect(() => {
    if (!stateEvent && id) {
      getEventByIdAPI(id)
        .then(setEvent)
        .catch(() => message.error('Không thể tải chi tiết sự kiện'));
    }
  }, [id, stateEvent]);

  // Lấy danh sách vé từ backend
  React.useEffect(() => {
    if (!event?._id) return;

    const fetchTickets = async () => {
      try {
        const ticketClasses = await getTicketClassesByEventAPI(event._id);

        const allTickets: Ticket[] = [];
        ticketClasses.forEach(tc => {
          if (tc.seatType === 'general') {
            allTickets.push({ type: tc.name, price: tc.price, status: tc.status });
          } else if (tc.seatType === 'reserved' && tc.ticketList?.length) {
            allTickets.push(
              ...tc.ticketList.map(t => ({
                type: `${tc.name} - ${t.seat}`,
                price: tc.price,
                status: t.isSold ? 'sold' : 'available',
              }))
            );
          }
        });

        setTickets(allTickets);
      } catch (err) {
        console.error(err);
        message.error('Không thể tải danh sách vé');
      }
    };

    fetchTickets();
  }, [event]);

  const minPrice = React.useMemo(() => {
    if (!tickets.length) return null;
    const prices = tickets
      .map(t => parseInt(String(t.price).toString().replace(/[^\d]/g, '')) || 0)
      .filter(p => p > 0);
    if (!prices.length) return null;
    return Math.min(...prices).toLocaleString('vi-VN');
  }, [tickets]);

  if (!event) {
    return (
      <ClientLayout>
        <div className="container mx-auto px-6 py-12 text-center">
          <Title level={4}>Không tìm thấy sự kiện</Title>
          <Button onClick={() => navigate('/')}>Về trang chủ</Button>
        </div>
      </ClientLayout>
    );
  }

  const formatEventDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');
  const formatEventTimeRange = (start: string, end: string) =>
    `${new Date(start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

  const timeRange = formatEventTimeRange(event.startDateTime, event.endDateTime);
  const dateDisplay = formatEventDate(event.startDateTime);

  return (
    <ClientLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Poster & Thông tin event */}
        <div className="grid grid-cols-12 gap-8 mb-8">
          <div className="col-span-7">
            <div className="w-full h-[500px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <img src={event.posterURL} alt={event.title} className="block w-full h-full object-contain" />
            </div>
          </div>
          <div className="col-span-5 space-y-4">
            <Title level={2} className="!text-[#23A6F0]">{event.title}</Title>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-2"><CalendarOutlined /><Text>{timeRange}, {dateDisplay}</Text></div>
              <div className="flex items-center gap-2"><EnvironmentOutlined /><Text>{event.location.address}, {event.location.city}</Text></div>
              <div className="flex items-center gap-2"><HomeOutlined /><Text>{event.location.venue}</Text></div>
            </div>
            <div>
              <Text>Giá vé chỉ từ</Text>
              <div className="text-[#23A6F0] text-xl font-bold">{minPrice ? `${minPrice} VND` : 'Đang cập nhật'}</div>
            </div>
            <Button type="primary" className="!bg-[#23A6F0] mt-2"
              onClick={() => priceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Mua vé ngay
            </Button>
          </div>
        </div>

        {/* Giới thiệu */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Title level={3} className="!text-[#23A6F0] !m-0">GIỚI THIỆU</Title>
            <button onClick={() => setIntroOpen(v => !v)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
              {introOpen ? <><UpOutlined /> Ẩn</> : <><DownOutlined /> Hiện</>}
            </button>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${introOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="rounded-lg p-6 border-l-4 border-[#23A6F0] bg-white shadow-sm">
              <p>{event.description}</p>
            </div>
          </div>
        </section>

        {/* Sơ đồ chỗ ngồi */}
        <section className="mb-8 rounded-lg p-6 border-t-4 border-[#23A6F0] bg-white shadow-sm">
          <Title level={3} className="!text-[#E04646] text-center !mb-4">SƠ ĐỒ CHỖ NGỒI</Title>
          <div className="rounded-lg bg-gray-50 border border-gray-200">
            <img src="https://salt.tkbcdn.com/ts/ds/cd/44/ca/36ecda21a3b64383662ba0d2d6b8220b.jpg"
              alt="Sơ đồ chỗ ngồi" className="block w-full h-auto object-contain" />
          </div>
        </section>

        {/* Bảng giá vé */}
        <section className="mb-8" ref={priceSectionRef}>
          <Title level={3} className="!text-[#23A6F0] text-center !mb-4">BẢNG GIÁ VÉ</Title>
          <div className="rounded-lg overflow-hidden shadow-sm">
            <div className="bg-white border-t-4 border-[#23A6F0] p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left">Tên hạng vé</th>
                    <th className="py-3 text-left">Giá vé</th>
                    <th className="py-3 text-left">Trạng thái</th>
                    <th className="py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3">{t.type}</td>
                      <td className="py-3">{t.price}</td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          t.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {t.status === 'available' ? 'Mua vé ngay' : 'Hết vé'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button type="primary" disabled={t.status !== 'available'} className="!bg-[#23A6F0]"
                          onClick={() => navigate('/checkout', { state: { event, ticket: { type: t.type, price: t.price } } })}>
                          Mua vé
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Đơn vị tổ chức */}
        <section className="mt-6">
          <div className="rounded-lg p-6 bg-white border-l-4 border-[#23A6F0] flex items-center gap-4">
            <img src="https://salt.tkbcdn.com/ts/ds/be/b4/01/51ba553d08151771675e5a5d9ed69525.png"
              alt="Ban tổ chức" className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <Title level={5} className="!mb-1 text-[#0b6fbf]">BAN TỔ CHỨC MYTICKET</Title>
              <Text className="text-gray-700">Đơn vị tổ chức sự kiện chuyên nghiệp</Text>
            </div>
            <div>
              <Button type="default" icon={<CommentOutlined />} className="!bg-white">
                Chat với Ban tổ chức
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ClientLayout>
  );
};

export default EventDetail;
