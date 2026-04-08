import React, { useEffect, useRef, useState } from 'react';
import { Typography, Empty, Button, Card, Tag, Spin, Row, Col, message } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, HistoryOutlined, StarOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../../layouts/ClientLayout';
import { getMyPurchasesAPI } from '../../../services/purchaseService';
import { handleAuthError } from '../../../utils/httpError';

const { Title, Text } = Typography;

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
    endDateTime: string;
    posterURL: string;
    location: { address: string };
  };
  ticketClass: {
    name: string;
    price: number;
    seatType: 'general' | 'reserved';
  };
}

const PurchaseHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchHistory = async () => {
      try {
        const data = await getMyPurchasesAPI();
        if (Array.isArray(data)) {
          // Lấy tất cả vé (API đã sort theo createdAt DESC mặc định)
          setPurchases(data);
        } else {
          setPurchases([]);
        }
      } catch (error: any) {
        console.error("Lỗi tải lịch sử mua vé:", error);
        if (handleAuthError(error, navigate, { notify: message.warning })) {
          return;
        }
        message.error("Không thể tải lịch sử mua vé.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate]);

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

  return (
    <ClientLayout>
      <div className="bg-[#f5f7fa] min-h-screen pb-10">
        <div className="container mx-auto px-6 py-8 ">
          
          <div className="flex items-center gap-3 mb-6">
            <HistoryOutlined className="text-2xl text-[#1d3f73]" />
            <Title level={2} className="!text-[#1d3f73] !m-0">Lịch sử mua vé</Title>
          </div>

          {loading ? (
            <div className="flex justify-center h-60 items-center"><Spin size="large" /></div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 min-h-[400px]">
              <Empty description={<span className="text-gray-500 text-lg">Lịch sử trống</span>} />
            </div>
          ) : (
            <div className="space-y-6 ">
              {purchases.map((item) => {
                const isEnded = item.event?.endDateTime ? new Date(item.event.endDateTime) < new Date() : false;

                return (
                  <Card key={item._id} hoverable className="rounded-xl overflow-hidden shadow-sm border border-gray-200" styles={{ body: { padding: 0 } }}>
                    <Row align="stretch">
                      <Col xs={24} md={4} lg={4}>
                        <div className="h-full min-h-[160px] w-full bg-gray-100 flex items-center justify-center">
                          <img 
                            src={item.event?.posterURL || "https://via.placeholder.com/300"} 
                            alt={item.event?.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300?text=Error")}
                          />
                        </div>
                      </Col>
                      
                      <Col xs={24} md={20} lg={20}>
                        <div className="p-5 flex flex-col h-full justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <Title level={5} className="!mb-0 !leading-tight cursor-pointer hover:text-[#23A6F0]" 
                                     onClick={() => item.event?._id && navigate(`/event/${item.event._id}`)}>
                                {item.event?.title || "Sự kiện không xác định"}
                              </Title>
                              
                              <Tag color={isEnded ? 'default' : (item.paymentStatus === 'paid' ? 'success' : 'warning')} className="px-3 py-1 rounded-full">
                                {isEnded ? 'ĐÃ KẾT THÚC' : (item.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN')}
                              </Tag>
                            </div>

                            <div className="space-y-1 mb-3 text-gray-500 text-sm">
                              <div className="flex items-center gap-2">
                                <CalendarOutlined />
                                <span>{formatDate(item.event?.startDateTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <EnvironmentOutlined />
                                <span>{item.event?.location?.address || "Đang cập nhật địa điểm"}</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-6 mt-2 text-sm">
                                <div><span className="text-gray-400">Ngày mua:</span> <Text strong>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text></div>
                                <div><span className="text-gray-400">Loại vé:</span> <Text strong>{item.ticketClass?.name}</Text></div>
                                <div><span className="text-gray-400">Số lượng:</span> <Text strong>{item.quantity}</Text></div>
                                <div><span className="text-gray-400">Tổng tiền:</span> <Text strong className="text-[#E04646]">{formatCurrency(item.totalAmount)}</Text></div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            {isEnded && item.paymentStatus === 'paid' ? (
                              <Button 
                                type="primary" 
                                icon={<StarOutlined />} 
                                className="!bg-orange-500 hover:!bg-orange-600 border-0"
                                onClick={() => navigate('/my-reviews')}
                              >
                                Bình luận & Đánh giá
                              </Button>
                            ) : (
                              !isEnded && item.paymentStatus === 'paid' ? (
                                <Button 
                                  type="default" 
                                  icon={<QrcodeOutlined />} 
                                  onClick={() => navigate('/my-tickets')}
                                >
                                  Xem QR Check-in
                                </Button>
                              ) : null
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
};

export default PurchaseHistoryPage;