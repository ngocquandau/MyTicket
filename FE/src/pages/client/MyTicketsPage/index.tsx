import React, { useEffect, useRef, useState } from 'react';
import { Typography, Empty, Button, Card, Tag, Spin, Row, Col, Modal, QRCode, message, Input, Pagination, Select } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, QrcodeOutlined, DownloadOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../../layouts/ClientLayout';
import { getAllEventsAPI } from '../../../services/eventService';
import { downloadTicketQrImageAPI, getMyPurchasesAPI } from '../../../services/purchaseService';
import { handleAuthError } from '../../../utils/httpError';

const { Title, Text } = Typography;
const PAGE_SIZE = 4;
type TicketTimeFilter = 'upcoming' | 'ended';
type TicketSortField = 'purchaseDate' | 'eventDate';
type TicketSortOrder = 'desc' | 'asc';

// Gộp chung Interface đầy đủ nhất
interface PurchaseItem {
  _id: string;
  totalAmount: number;
  quantity: number;
  paymentStatus: string;
  createdAt: string;
  event: {
    _id: string;
    title: string;
    status?: string;
    startDateTime: string;
    endDateTime: string;
    posterURL: string;
    location: { address: string };
  };
  ticketClass: {
    name: string;
    price: number;
    seatType: 'general' | 'reserved';
  };
  ticketList: {
    seat: string;
    ticketId: string;
  }[];
}

const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<TicketTimeFilter>('upcoming');
  const [sortField, setSortField] = useState<TicketSortField>('purchaseDate');
  const [sortOrder, setSortOrder] = useState<TicketSortOrder>('desc');
  
  // State cho Modal QR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicketList, setCurrentTicketList] = useState<any[]>([]);
  const [currentSeatType, setCurrentSeatType] = useState<'general' | 'reserved'>('general');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchTickets = async () => {
      try {
        const [purchaseData, completedEvents] = await Promise.all([
          getMyPurchasesAPI(),
          getAllEventsAPI({ status: 'completed' })
        ]);

        if (Array.isArray(purchaseData)) {
          const completedEventIds = new Set(
            (Array.isArray(completedEvents) ? completedEvents : []).map((event) => String(event?._id))
          );

          const paidPurchases = purchaseData
            .filter((purchase) => purchase?.paymentStatus === 'paid')
            .map((purchase) => {
              const purchaseEventId = String(purchase?.event?._id || '');
              const existingStatus = purchase?.event?.status;

              return {
                ...purchase,
                event: purchase?.event
                  ? {
                      ...purchase.event,
                      status: existingStatus || (completedEventIds.has(purchaseEventId) ? 'completed' : undefined)
                    }
                  : purchase?.event
              };
            });

          setPurchases(paidPurchases);
        } else {
          setPurchases([]);
        }
      } catch (error: any) {
        console.error("Lỗi tải vé:", error);
        if (handleAuthError(error, navigate, { notify: message.warning })) {
          return;
        }
        message.error("Không thể tải danh sách vé.");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [navigate]);

  const showQRModal = (tickets: any[], seatType: 'general' | 'reserved') => {
    if (!tickets || tickets.length === 0) {
      message.warning('Vé này chưa có mã QR. Vui lòng chờ hệ thống đồng bộ mã vé.');
      return;
    }
    const sampleTicketId = tickets?.[0]?.ticketId;
    const sampleUrl = sampleTicketId ? buildTicketInfoUrl(sampleTicketId) : '';
    if (sampleUrl.includes('localhost') || sampleUrl.includes('127.0.0.1')) {
      message.warning('QR đang trỏ về localhost, điện thoại khác thiết bị sẽ không mở được. Hãy cấu hình lại IP LAN hoặc domain public.');
    }
    setCurrentTicketList(tickets || []);
    setCurrentSeatType(seatType);
    setIsModalOpen(true);
  };

  const formatCurrency = (val: number) => (val ? val.toLocaleString('vi-VN') + ' VND' : '0 VND');
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Đang cập nhật';
    try {
      const date = new Date(dateStr);
      return `${date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${date.toLocaleDateString('vi-VN')}`;
    } catch (e) {
      return 'Thời gian không hợp lệ';
    }
  };

  const renderSeatLabel = (seat: string, type: 'general' | 'reserved') => {
    if (type === 'reserved') {
        return `Ghế ngồi cố định: ${seat}`;
    }
    return 'Vé tự do (Vào cổng)';
  };

  const isEndedPurchase = (purchase: PurchaseItem) => {
    const eventStatus = (purchase.event?.status || '').toLowerCase();
    const eventEndTime = purchase.event?.endDateTime ? new Date(purchase.event.endDateTime).getTime() : null;
    const eventStartTime = purchase.event?.startDateTime ? new Date(purchase.event.startDateTime).getTime() : null;

    if (eventStatus === 'completed') {
      return true;
    }

    return eventEndTime !== null ? eventEndTime < currentTime : eventStartTime !== null && eventStartTime < currentTime;
  };

  // Chuẩn hóa URL QR giống luồng email: /ticket-info/:ticketId
  const buildTicketInfoUrl = (ticketId: string) => {
    const configuredFrontendUrl = process.env.REACT_APP_FRONTEND_URL;
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    const fallbackPublicFrontend = 'https://mticket.vercel.app';
    const baseUrl = configuredFrontendUrl || (isLocalhost ? fallbackPublicFrontend : window.location.origin);
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    return `${normalizedBaseUrl}/ticket-info/${encodeURIComponent(ticketId)}`;
  };

  const handleDownloadQr = async (ticketId?: string) => {
    if (!ticketId) return;
    try {
      const blob = await downloadTicketQrImageAPI(ticketId);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `ticket-${ticketId}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      message.success('Đã tải QR về máy');
    } catch (error) {
      console.error('Lỗi tải QR:', error);
      message.error('Không thể tải QR. Vui lòng thử lại.');
    }
  };

  const normalizedKeyword = searchKeyword.trim().toLocaleLowerCase('vi-VN');
  const currentTime = Date.now();
  const timeFilteredPurchases = purchases.filter((purchase) => {
    if (timeFilter === 'ended') {
      return isEndedPurchase(purchase);
    }

    if (isEndedPurchase(purchase)) return false;

    const eventEndTime = purchase.event?.endDateTime ? new Date(purchase.event.endDateTime).getTime() : null;
    const eventStartTime = purchase.event?.startDateTime ? new Date(purchase.event.startDateTime).getTime() : null;
    return eventEndTime !== null ? eventEndTime >= currentTime : eventStartTime !== null && eventStartTime >= currentTime;
  });

  const filteredPurchases = timeFilteredPurchases.filter((purchase) => {
    if (!normalizedKeyword) return true;
    const eventTitle = purchase.event?.title?.toLocaleLowerCase('vi-VN') || '';
    return eventTitle.includes(normalizedKeyword);
  });

  filteredPurchases.sort((a, b) => {
    const aEventTime = new Date(a.event?.startDateTime || 0).getTime();
    const bEventTime = new Date(b.event?.startDateTime || 0).getTime();
    const aPurchaseTime = new Date(a.createdAt || 0).getTime();
    const bPurchaseTime = new Date(b.createdAt || 0).getTime();

    const aValue = sortField === 'eventDate' ? aEventTime : aPurchaseTime;
    const bValue = sortField === 'eventDate' ? bEventTime : bPurchaseTime;

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedKeyword, timeFilter, sortField, sortOrder]);

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <ClientLayout>
      <div className="bg-[#1d3f73] min-h-screen pb-10">
        <div className="container mx-auto px-6 py-8 ">
          
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <QrcodeOutlined className="text-2xl text-[#23A6F0]" />
              <Title level={2} className="!text-[#23A6F0] !m-0">VÉ ĐÃ THANH TOÁN THÀNH CÔNG</Title>
            </div>
            {!loading && purchases.length > 0 && (
              <div className="w-full lg:w-[650px] lg:flex-shrink-0 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    allowClear
                    size="large"
                    value={searchKeyword}
                    prefix={<SearchOutlined className="text-gray-400" />}
                    placeholder="Nhập tên sự kiện"
                    className="rounded-lg w-full"
                    onChange={(event) => setSearchKeyword(event.target.value)}
                  />
                </div>
                <Select
                  size="large"
                  value={sortField}
                  className="min-w-[150px]"
                  onChange={(value) => setSortField(value)}
                  options={[
                    { value: 'purchaseDate', label: 'Thời gian mua vé' },
                    { value: 'eventDate', label: 'Thời gian diễn ra' },
                  ]}
                />
                <Select
                  size="large"
                  value={sortOrder}
                  className="min-w-[100px]"
                  onChange={(value) => setSortOrder(value)}
                  options={sortField === 'purchaseDate'
                    ? [
                        { value: 'desc', label: 'Mới -> Cũ' },
                        { value: 'asc', label: 'Cũ -> Mới' },
                      ]
                    : [
                        { value: 'asc', label: 'Sớm -> Muộn' },
                        { value: 'desc', label: 'Muộn -> Sớm' },
                      ]}
                />
              </div>
            )}
          </div>

          {!loading && purchases.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              <Button
                type={timeFilter === 'upcoming' ? 'primary' : 'default'}
                className={timeFilter === 'upcoming' ? '!bg-[#23A6F0]' : '!border-[#23A6F0] !text-[#23A6F0]'}
                onClick={() => setTimeFilter('upcoming')}
              >
                Sự kiện sắp diễn ra
              </Button>
              <Button
                type={timeFilter === 'ended' ? 'primary' : 'default'}
                className={timeFilter === 'ended' ? '!bg-[#23A6F0]' : '!border-[#23A6F0] !text-[#23A6F0]'}
                onClick={() => setTimeFilter('ended')}
              >
                Sự kiện đã diễn ra
              </Button>
            </div>
          )}

          {!loading && purchases.length > 0 && timeFilter === 'ended' && (
            <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-orange-700">Đánh giá và xem lại đánh giá</div>
                  <div className="text-sm text-orange-600">Mở mục Đánh giá để đánh giá sự kiện đã tham gia hoặc xem lại các bài đánh giá trước đó.</div>
                </div>
                <Button
                  icon={<StarOutlined />}
                  className="!border-orange-400 !text-orange-600 hover:!border-orange-500 hover:!text-orange-700"
                  onClick={() => navigate('/my-reviews')}
                >
                  Đến Đánh giá
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center h-60 items-center"><Spin size="large" /></div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 min-h-[400px]">
              <Empty description={<span className="text-gray-500 text-lg">Bạn chưa có vé nào đã thanh toán thành công</span>} />
              <div className="flex gap-4 mt-6">
                <Button type="primary" size="large" onClick={() => navigate('/')} className="!bg-[#23A6F0]">Khám phá sự kiện</Button>
                <Button size="large" onClick={() => navigate('/purchase-history')}>Xem lịch sử mua vé</Button>
              </div>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 min-h-[320px]">
              <Empty description={<span className="text-gray-500 text-lg">{timeFilter === 'upcoming' ? 'Không có vé cho sự kiện sắp diễn ra phù hợp' : 'Không có vé cho sự kiện đã diễn ra phù hợp'}</span>} />
            </div>
          ) : (
            <div className="space-y-6 ">
              {paginatedPurchases.map((item) => (
                <Card key={item._id} hoverable className="rounded-xl overflow-hidden shadow-sm border-0 min-h-[370px] md:min-h-[260px]" styles={{ body: { padding: 0 } }}>
                  <Row align="stretch">
                    <Col xs={24} md={6} lg={4}>
                      <div className="h-[158px] md:h-full md:min-h-[260px] w-full bg-gray-100 flex items-center justify-center p-2">
                        <img 
                          src={item.event?.posterURL || "https://via.placeholder.com/300"} 
                          alt={item.event?.title} 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300?text=Error")}
                        />
                      </div>
                    </Col>
                    
                    <Col xs={24} md={18} lg={19}>
                      <div className="p-3 md:p-4 flex flex-col h-full min-h-[212px] md:min-h-[260px] justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1.5">
                            <Title level={4} className="!mb-0 !text-[16px] md:!text-[17px] !leading-tight !text-red-700 cursor-pointer hover:text-[#23A6F0] !line-clamp-2 min-h-[42px] md:min-h-[46px]" 
                                   onClick={() => item.event?._id && navigate(`/event/${item.event._id}`)}>
                              {item.event?.title || "Sự kiện không xác định"}
                            </Title>
                            
                            <Tag color={item.paymentStatus === 'paid' ? 'success' : 'warning'} className="px-3 py-1 text-xs font-medium rounded-full">
                              {item.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                            </Tag>
                          </div>

                          <div className="space-y-1 mb-2.5 min-h-[52px] md:min-h-[56px] text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarOutlined className="text-[#23A6F0]" />
                              {/* Highlight ngày sự kiện theo màu cam từ bản 2 */}
                              <span className="text-[15px] leading-tight font-medium text-orange-600">{formatDate(item.event?.startDateTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <EnvironmentOutlined className="text-[#23A6F0]" />
                              <span className="text-[15px] leading-tight line-clamp-1">{item.event?.location?.address || "Đang cập nhật địa điểm"}</span>
                            </div>
                          </div>
                          
                            <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-gray-100 min-h-[104px] max-h-[104px] overflow-y-auto pr-1 md:min-h-[118px] md:max-h-[118px] md:pr-2">
                             <div className="flex justify-between items-center flex-wrap gap-2.5 mb-2">
                                <div>
                                   <span className="text-gray-500 mr-2 text-sm">Loại vé:</span>
                                   <span className="font-bold text-gray-800 text-sm">{item.ticketClass?.name}</span>
                                </div>
                                <div>
                                   <span className="text-gray-500 mr-2 text-sm">Số lượng:</span>
                                   <span className="font-bold text-gray-800 text-sm">x{item.quantity}</span>
                                </div>
                                <div>
                                   <span className="text-gray-500 mr-2 text-sm">Tổng tiền:</span>
                                   <span className="font-bold text-[#E04646] text-sm">{formatCurrency(item.totalAmount)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                   <ClockCircleOutlined className="text-[#23A6F0] text-xs" />
                                   <span className="text-gray-500 mr-1 text-sm">Ngày mua:</span>
                                   <span className="font-bold text-gray-800 text-sm">{formatDate(item.createdAt)}</span>
                                </div>
                             </div>

                              <div>
                                <span className="text-gray-500 block mb-1 text-xs uppercase font-semibold tracking-wider">Chi tiết vé:</span>
                                <div className="flex flex-wrap gap-2">
                                  {item.ticketList && item.ticketList.length > 0 ? (
                                    item.ticketList.map((ticket, idx) => (
                                      <Tag key={idx} color={item.ticketClass?.seatType === 'reserved' ? 'purple' : 'blue'} className="px-3 py-1 text-xs rounded border-opacity-50">
                                        {renderSeatLabel(ticket.seat, item.ticketClass?.seatType)}
                                        <span className="opacity-50 mx-2">|</span> 
                                        <span className="font-mono text-xs">{ticket.ticketId}</span>
                                      </Tag>
                                    ))
                                  ) : (
                                    <Text type="secondary">Đang cập nhật mã vé...</Text>
                                  )}
                                </div>
                             </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <Button 
                            type="primary" 
                            icon={<QrcodeOutlined />} 
                            className="w-full justify-center md:w-auto !bg-[#23A6F0]" 
                            onClick={() => showQRModal(item.ticketList, item.ticketClass?.seatType)}
                          >
                            Quét QR Check-in
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}

              {filteredPurchases.length > PAGE_SIZE && (
                <div className="flex justify-center pt-2">
                  <Pagination
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={filteredPurchases.length}
                    showSizeChanger={false}
                    onChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal hiển thị QR */}
        <Modal 
            title={<div className="text-center font-bold text-lg">MÃ VÉ CHECK-IN</div>}
            open={isModalOpen} 
            onCancel={() => setIsModalOpen(false)}
            footer={[<Button key="close" type="primary" onClick={() => setIsModalOpen(false)} className="!bg-[#23A6F0]">Đóng</Button>]}
            centered
            width={600}
        >
            <div className="flex flex-col gap-8 max-h-[60vh] overflow-y-auto p-4">
                {currentTicketList && currentTicketList.length > 0 ? (
                    currentTicketList.map((t, idx) => (
                        <div key={idx} className="flex flex-col items-center border-b pb-6 last:border-0 border-dashed border-gray-300">
                            <Tag color={currentSeatType === 'reserved' ? 'purple' : 'blue'} className="text-base px-3 py-1 mb-3 font-semibold">
                                {renderSeatLabel(t.seat, currentSeatType)}
                            </Tag>
                            
                            <div className="p-2 border-4 border-gray-800 rounded-lg bg-white">
                                <QRCode value={buildTicketInfoUrl(t.ticketId || 'INVALID')} size={180} />
                            </div>
                            <Text copyable className="mt-3 font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
                                {t.ticketId}
                            </Text>
                            <Button type="default" icon={<DownloadOutlined />} className="mt-3" onClick={() => handleDownloadQr(t.ticketId)}>
                              Tải QR
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-8">Dữ liệu vé đang được cập nhật. Vui lòng quay lại sau.</div>
                )}
            </div>
        </Modal>
      </div>
    </ClientLayout>
  );
};

export default MyTicketsPage;