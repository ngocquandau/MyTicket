  import React from 'react';
  import { Typography, Button, message, Progress } from 'antd'; // Import thêm Progress
  import { CalendarOutlined, EnvironmentOutlined, CommentOutlined, DownOutlined, UpOutlined, FireOutlined } from '@ant-design/icons';
  import { useParams, useNavigate } from 'react-router-dom';
  import ClientLayout from '../../../layouts/ClientLayout';
  import { getEventByIdAPI } from '../../../services/eventService';
  import { getTicketClassesByEventAPI } from '../../../services/ticketService';
  import { TicketClass } from '../../../types/event';
  // Đảm bảo đường dẫn import đúng case (viết hoa/thường)
  import LoginModal from '../../../components/auth/LoginModal'; 
  import RegisterModal from '../../../components/auth/RegisterModal';

  const { Title, Text } = Typography;

  // Định nghĩa kiểu dữ liệu hiển thị vé
  type TicketDisplay = { 
      type: string; 
      price: string | number; 
      status: 'available' | 'sold' | 'sold_out'; 
      ticketClassId: string; 
      seat?: string;
      isReserved?: boolean;
      totalQty: number;
      soldQty: number;
      remaining: number;
      // Danh sách ghế để truyền sang Checkout
      availableSeats?: { _id: string, seat: string, isSold?: boolean }[]; 
  };

  const EventDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [event, setEvent] = React.useState<any>(null);
    const [ticketsDisplay, setTicketsDisplay] = React.useState<TicketDisplay[]>([]);
    const [introOpen, setIntroOpen] = React.useState(true);
    const priceSectionRef = React.useRef<HTMLDivElement | null>(null);

    // Auth State
    const [showLogin, setShowLogin] = React.useState(false);
    const [showRegister, setShowRegister] = React.useState(false);

    // Lấy chi tiết sự kiện
    React.useEffect(() => {
      if (id) {
        getEventByIdAPI(id)
          .then(setEvent)
          .catch(() => message.error('Không thể tải chi tiết sự kiện'));
      }
    }, [id]);

    // Lấy danh sách vé và GOM NHÓM
    React.useEffect(() => {
      if (!event?._id) return;

      const fetchTickets = async () => {
        try {
          const ticketClasses: TicketClass[] = await getTicketClassesByEventAPI(event._id);
          const allTicketsDisplay: TicketDisplay[] = [];
          
          ticketClasses.forEach(tc => {
            let sold = tc.soldQuantity || 0;
            let total = tc.totalQuantity;
            let remaining = total - sold;
            let availableSeatsList: any[] = [];

            // --- LOGIC GOM NHÓM QUAN TRỌNG ---
            
            // Trường hợp 1: Vé có ghế ngồi (Reserved)
            // Thay vì loop từng vé, ta gom lại thành 1 dòng duy nhất cho TicketClass này
            if (tc.seatType === 'reserved' && tc.ticketList) {
              // Tính toán lại số lượng dựa trên danh sách ghế thực tế
              total = tc.ticketList.length;
              const unsoldTickets = tc.ticketList.filter(t => !t.isSold);
              remaining = unsoldTickets.length;
              sold = total - remaining;
              
              // Lưu danh sách ghế để truyền sang Checkout
              availableSeatsList = tc.ticketList; 
            }
            // Trường hợp 2: Vé tự do (General) -> Sử dụng số lượng có sẵn trong tc (đã khai báo ở trên)

            const status = remaining > 0 ? 'available' : 'sold_out';

            // Chỉ đẩy 1 dòng duy nhất cho mỗi TicketClass vào danh sách hiển thị
            allTicketsDisplay.push({ 
              type: tc.name, // Tên hạng vé (VD: VIP Zone 1)
              price: tc.price, 
              status: status,
              ticketClassId: tc._id!, 
              isReserved: tc.seatType === 'reserved',
              totalQty: total,
              soldQty: sold,
              remaining: remaining,
              availableSeats: availableSeatsList // Truyền danh sách ghế đi
            });
          });

          setTicketsDisplay(allTicketsDisplay);
        } catch (err) {
          console.error(err);
          message.error('Không thể tải danh sách vé');
        }
      };
      fetchTickets();
    }, [event]);

    const minPrice = React.useMemo(() => {
      if (!ticketsDisplay.length) return null;
      const prices = ticketsDisplay
        .map(t => parseInt(String(t.price).toString().replace(/[^\d]/g, '')) || 0)
        .filter(p => p > 0);
      if (!prices.length) return null;
      return Math.min(...prices).toLocaleString('vi-VN');
    }, [ticketsDisplay]);

    // Logic Mua vé
    const handleBuyTicket = (ticket: TicketDisplay) => {
      const token = localStorage.getItem('token');
      
      if (!token) {
          message.info("Vui lòng đăng nhập để tiếp tục mua vé!");
          setShowLogin(true);
          return;
      }

      navigate('/checkout', { 
        state: { 
          event, 
          ticketInfo: { 
            ...ticket,
            seat: null // Chưa chọn ghế, sẽ chọn ở trang checkout
          } 
        } 
      });
    };

    if (!event) return null;

    const formatEventDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');
    const formatEventTimeRange = (start: string, end: string) =>
      `${new Date(start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    const timeRange = formatEventTimeRange(event.startDateTime, event.endDateTime);
    const dateDisplay = formatEventDate(event.startDateTime);
    const address = event.location?.address || 'Đang cập nhật';

    return (
      <ClientLayout>
        <div className="container mx-auto px-6 py-8">
          {/* Phần 1: Poster & Info */}
          <div className="grid grid-cols-12 gap-8 mb-8">
            <div className="col-span-7">
              <div className="w-full h-[500px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow-lg">
                <img src={event.posterURL} alt={event.title} className="block w-full h-full object-contain" />
              </div>
            </div> 
            <div className="col-span-5 space-y-4">
              <Title level={2} className="!text-[#23A6F0]">{event.title}</Title>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center gap-2"><CalendarOutlined /><Text>{timeRange}, {dateDisplay}</Text></div>
                <div className="flex items-center gap-2"><EnvironmentOutlined /><Text>{address}</Text></div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <Text className="text-gray-500 text-sm uppercase font-bold">Giá vé chỉ từ</Text>
                <div className="text-[#E04646] text-3xl font-bold mt-1">{minPrice ? `${minPrice} VND` : 'Đang cập nhật'}</div>
              </div>
              <Button type="primary" size="large" className="!bg-[#23A6F0] mt-2 w-full h-12 text-lg font-semibold shadow-md hover:!bg-[#1890ff]"
                onClick={() => priceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                CHỌN VÉ NGAY
              </Button>
            </div>
          </div>

          {/* Phần 2: Giới thiệu */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Title level={3} className="!text-[#23A6F0] !m-0 border-l-4 border-[#23A6F0] pl-3">GIỚI THIỆU</Title>
              <button onClick={() => setIntroOpen(v => !v)} className="text-sm text-gray-600 hover:text-blue-500">
                {introOpen ? <><UpOutlined /> Ẩn</> : <><DownOutlined /> Hiện</>}
              </button>
            </div>
            {introOpen && (
              <div className="rounded-lg p-6 bg-white shadow-sm border border-gray-100 text-gray-700 leading-relaxed">
                <p>{event.description}</p>
              </div>
            )}
          </section>

          {/* Phần 3: Sơ đồ chỗ ngồi */}
          <section className="mb-8">
            <Title level={3} className="!text-[#E04646] text-center !mb-6">SƠ ĐỒ CHỖ NGỒI</Title>
            <div className="rounded-xl bg-gray-50 border border-gray-200 flex justify-center p-4 shadow-inner min-h-[300px] items-center">
              {event.seatImgUrl ? (
                <img src={event.seatImgUrl} alt="Sơ đồ" className="block max-w-full h-auto object-contain rounded" />
              ) : (
                <div className="text-gray-400 italic">Sơ đồ chỗ ngồi đang được cập nhật.</div>
              )}
            </div>
          </section>

          {/* Phần 4: Bảng giá vé */}
          <section className="mb-8" ref={priceSectionRef}>
            <div className="flex items-center gap-2 mb-4">
              <FireOutlined className="text-red-500 text-xl" />
              <Title level={3} className="!text-[#23A6F0] !m-0">CHỌN LOẠI VÉ</Title>
            </div>
            
            <div className="rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="py-4 px-6 text-left font-semibold">Loại vé / Khu vực</th>
                    <th className="py-4 px-6 text-left font-semibold w-1/3">Tình trạng</th>
                    <th className="py-4 px-6 text-left font-semibold">Giá vé</th>
                    <th className="py-4 px-6 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ticketsDisplay.length > 0 ? (
                    ticketsDisplay.map((t, i) => {
                      const percentSold = t.totalQty > 0 ? Math.round(((t.totalQty - t.remaining) / t.totalQty) * 100) : 100;
                      
                      return (
                        <tr key={i} className="hover:bg-blue-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-gray-800 text-lg">{t.type}</div>
                            {t.isReserved ? (
                              <div className="text-xs text-blue-500 mt-1 font-medium">Vé ngồi cố định (Chọn ghế ở bước sau)</div>
                            ) : (
                              <div className="text-xs text-gray-500 mt-1">Vé tự do trong khu vực</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1 max-w-[200px]">
                              <div className="flex justify-between text-xs mb-1">
                                <span className={t.remaining < 10 ? "text-red-500 font-bold" : "text-gray-500"}>
                                  {t.status === 'available' ? `Còn ${t.remaining} vé` : 'Hết vé'}
                                </span>
                                <span className="text-gray-400">Tổng: {t.totalQty}</span>
                              </div>
                              <Progress 
                                percent={percentSold} 
                                status={t.status === 'available' ? 'active' : 'exception'} 
                                showInfo={false} 
                                strokeColor={t.remaining < 5 ? '#ff4d4f' : '#23A6F0'}
                                size="small"
                              />
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[#E04646] font-bold text-lg">
                              {parseInt(String(t.price)).toLocaleString('vi-VN')} đ
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {t.status === 'available' ? (
                              <Button 
                                type="primary" 
                                className="!bg-[#23A6F0] hover:!bg-[#1890ff] rounded-full px-6 font-semibold shadow-sm"
                                onClick={() => handleBuyTicket(t)}
                              >
                                Mua ngay
                              </Button>
                            ) : (
                              <Button disabled className="bg-gray-200 text-gray-400 rounded-full px-6 border-none">
                                Hết vé
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 italic">
                        Hiện chưa có vé được mở bán.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Auth Modals */}
          <LoginModal 
            open={showLogin} 
            onClose={() => setShowLogin(false)} 
            onRegisterClick={() => { setShowLogin(false); setShowRegister(true); }}
            onLoginSuccess={() => setShowLogin(false)}
          />
          
          <RegisterModal 
            open={showRegister} 
            onClose={() => { setShowRegister(false); setShowLogin(true); }} 
            onLoginClick={() => { setShowRegister(false); setShowLogin(true); }}
          />
        </div>
      </ClientLayout>
    );
  };

  export default EventDetail;