import React, { useEffect, useRef, useState } from 'react';
import { Typography, Empty, Button, Card, Tag, Spin, Row, Col, Modal, QRCode, message } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, QrcodeOutlined, HistoryOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../../layouts/ClientLayout';
import { downloadTicketQrImageAPI, getMyPurchasesAPI } from '../../../services/purchaseService';
import { handleAuthError } from '../../../utils/httpError';

const { Title, Text } = Typography;

// Cập nhật Interface để bao gồm seatType
interface PurchaseItem {
  _id: string;
  totalAmount: number;
  quantity: number;
  paymentStatus: string;
  createdAt: string;
  event: {
    _id: string;
    title: string;
    startDateTime: string;
    posterURL: string;
    location: { address: string };
  };
  ticketClass: {
    name: string;
    price: number;
    seatType: 'general' | 'reserved'; // ✅ Thêm trường này để check loại vé
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
  
  // State cho Modal QR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicketList, setCurrentTicketList] = useState<any[]>([]);
  const [currentSeatType, setCurrentSeatType] = useState<'general' | 'reserved'>('general'); // ✅ Lưu loại vé đang xem QR
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchTickets = async () => {
      try {
        const data = await getMyPurchasesAPI();
        if (Array.isArray(data)) {
          setPurchases(data);
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

  // ✅ Cập nhật hàm mở Modal để nhận thêm seatType
  const showQRModal = (tickets: any[], seatType: 'general' | 'reserved') => {
    if (!tickets || tickets.length === 0) {
      message.warning('Vé này chưa có mã QR. Vui lòng chờ hệ thống đồng bộ mã vé.');
      return;
    }
    const sampleTicketId = tickets?.[0]?.ticketId;
    const sampleUrl = sampleTicketId ? buildTicketHtmlUrl(sampleTicketId) : '';
    if (sampleUrl.includes('localhost') || sampleUrl.includes('127.0.0.1')) {
      message.warning('QR đang trỏ về localhost, điện thoại khác thiết bị sẽ không mở được. Hãy cấu hình REACT_APP_PUBLIC_API_BASE_URL bằng IP LAN hoặc domain public.');
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

  // ✅ Hàm helper để hiển thị nhãn ghế
  const renderSeatLabel = (seat: string, type: 'general' | 'reserved') => {
    if (type === 'reserved') {
        return `Ghế ngồi cố định: ${seat}`;
    }
    return 'Vé tự do (Vào cổng)';
  };

  const buildTicketHtmlUrl = (ticketId: string) => {
    const publicWebBase = ((globalThis as any)?.process?.env?.REACT_APP_PUBLIC_FE_BASE_URL || window.location.origin).replace(/\/$/, '');
    return `${publicWebBase}/ticket-info/${encodeURIComponent(ticketId)}`;
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

  return (
    <ClientLayout>
      <div className="bg-[#1d3f73] min-h-screen pb-10">
        <div className="container mx-auto px-6 py-8 ">
          <div className="flex items-center gap-3 mb-6">
            <HistoryOutlined className="text-2xl text-[#23A6F0]" />
            <Title level={2} className="!text-[#23A6F0] !m-0">Vé của tôi</Title>
          </div>

          {loading ? (
            <div className="flex justify-center h-60 items-center"><Spin size="large" /></div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 min-h-[400px]">
              <Empty description={<span className="text-gray-500 text-lg">Bạn chưa mua vé sự kiện nào</span>} />
              <Button type="primary" size="large" onClick={() => navigate('/')} className="mt-6 !bg-[#23A6F0]">Khám phá ngay</Button>
            </div>
          ) : (
            <div className="space-y-6 ">
              {purchases.map((item) => (
                <Card key={item._id} hoverable className="rounded-xl overflow-hidden shadow-sm border-0" styles={{ body: { padding: 0 } }}>
                  <Row align="stretch">
                    <Col xs={24} md={6} lg={5}>
                      <div className="h-full min-h-[220px] w-full bg-gray-100 flex items-center justify-center p-2">
                        <img 
                          src={item.event?.posterURL || "https://via.placeholder.com/300"} 
                          alt={item.event?.title} 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300?text=Error")}
                        />
                      </div>
                    </Col>
                    
                    <Col xs={24} md={18} lg={19}>
                      <div className="p-5 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <Title level={4} className="!mb-0 !text-[18px] !leading-tight !text-red-700 cursor-pointer hover:text-[#23A6F0]" 
                                   onClick={() => item.event?._id && navigate(`/event/${item.event._id}`)}>
                              {item.event?.title || "Sự kiện không xác định"}
                            </Title>
                            
                            <Tag color={item.paymentStatus === 'paid' ? 'success' : 'warning'} className="px-3 py-1 text-sm font-medium rounded-full">
                              {item.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                            </Tag>
                          </div>

                          <div className="space-y-1.5 mb-3 text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarOutlined className="text-[#23A6F0]" />
                              <span className="text-[16px] leading-tight font-medium">{formatDate(item.event?.startDateTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <EnvironmentOutlined className="text-[#23A6F0]" />
                              <span className="text-[16px] leading-tight line-clamp-1">{item.event?.location?.address || "Đang cập nhật địa điểm"}</span>
                            </div>
                          </div>
                          
                          <div className="bg-[#F8FAFC] p-3 rounded-lg border border-gray-100">
                             <div className="flex justify-between items-center flex-wrap gap-3 mb-2">
                                <div>
                                   <span className="text-gray-500 mr-2">Loại vé:</span>
                                   <span className="font-bold text-gray-800">{item.ticketClass?.name}</span>
                                </div>
                                <div>
                                   <span className="text-gray-500 mr-2">Số lượng:</span>
                                   <span className="font-bold text-gray-800">x{item.quantity}</span>
                                </div>
                                <div>
                                   <span className="text-gray-500 mr-2">Tổng tiền:</span>
                                   <span className="font-bold text-[#E04646] text-base">{formatCurrency(item.totalAmount)}</span>
                                </div>
                             </div>

                             {/* Danh sách vé chi tiết */}
                              <div>
                                <span className="text-gray-500 block mb-1 text-xs uppercase font-semibold tracking-wider">Chi tiết vé:</span>
                                <div className="flex flex-wrap gap-2">
                                  {item.ticketList && item.ticketList.length > 0 ? (
                                    item.ticketList.map((ticket, idx) => (
                                      <Tag key={idx} color={item.ticketClass?.seatType === 'reserved' ? 'purple' : 'blue'} className="px-3 py-1 text-sm rounded border-opacity-50">
                                        {/* ✅ Hiển thị loại ghế rõ ràng */}
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

                        <div className="mt-4 flex justify-end">
                          <Button 
                            type="primary" 
                            icon={<QrcodeOutlined />} 
                            className="!bg-[#23A6F0]" 
                            // Truyền thêm loại vé vào hàm mở modal
                            onClick={() => showQRModal(item.ticketList, item.ticketClass?.seatType)}
                          >
                            QR thông tin vé
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
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
                            {/* ✅ Hiển thị loại ghế trong Modal */}
                            <Tag color={currentSeatType === 'reserved' ? 'purple' : 'blue'} className="text-base px-3 py-1 mb-3 font-semibold">
                                {renderSeatLabel(t.seat, currentSeatType)}
                            </Tag>
                            
                            <div className="p-2 border-4 border-gray-800 rounded-lg bg-white">
                                <QRCode value={buildTicketHtmlUrl(t.ticketId || 'INVALID')} size={180} />
                            </div>
                            <Text copyable className="mt-3 font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
                                {t.ticketId}
                            </Text>
                            <Button
                              type="default"
                              icon={<DownloadOutlined />}
                              className="mt-3"
                              onClick={() => handleDownloadQr(t.ticketId)}
                            >
                              Tải QR
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        Dữ liệu vé đang được cập nhật. Vui lòng quay lại sau.
                    </div>
                )}
            </div>
        </Modal>
      </div>
    </ClientLayout>
  );
};

export default MyTicketsPage;