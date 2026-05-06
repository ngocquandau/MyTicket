import React, { useEffect, useState } from 'react';
import { Typography, Empty, Button, Card, Spin, Row, Col, message, Rate, Input } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../../layouts/ClientLayout'; 
import { getMyPurchasesAPI } from '../../../services/purchaseService';
import { createReviewAPI, getMyReviewAPI } from '../../../services/reviewService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MyReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pastEvents, setPastEvents] = useState<any[]>([]);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  
  // State lưu trữ dữ liệu review CÓ SẴN từ database
  const [existingReviews, setExistingReviews] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchEligibleEvents = async () => {
      try {
        const data = await getMyPurchasesAPI();
        if (Array.isArray(data)) {
          const now = new Date();
          
          const eligible = data.filter(p => 
            p.paymentStatus === 'paid' && 
            p.event?.endDateTime && 
            new Date(p.event.endDateTime) < now
          );

          const uniqueEvents: any[] = [];
          const seen = new Set();
          eligible.forEach(p => {
            if (!seen.has(p.event._id)) {
              seen.add(p.event._id);
              uniqueEvents.push(p.event);
            }
          });

          setPastEvents(uniqueEvents);

          // Tự động gọi API lấy bài đánh giá cho từng sự kiện
          const reviewsMap: Record<string, any> = {};
          await Promise.all(uniqueEvents.map(async (ev) => {
            try {
              const reviewData = await getMyReviewAPI(ev._id);
              if (reviewData) {
                reviewsMap[ev._id] = reviewData; // Lưu lại review cũ nếu có
              }
            } catch (err) {
              console.error("Lỗi lấy đánh giá cho sự kiện", ev._id, err);
            }
          }));
          
          setExistingReviews(reviewsMap);
        }
      } catch (error) {
        message.error("Không thể tải danh sách sự kiện đã tham gia.");
      } finally {
        setLoading(false);
      }
    };
    fetchEligibleEvents();
  }, []);

  const handleSubmitReview = async (eventId: string) => {
    const rating = ratings[eventId] || 0;
    const comment = comments[eventId] || '';

    if (rating === 0) {
      message.warning('Vui lòng chọn số sao để đánh giá!');
      return;
    }

    setSubmitting(prev => ({ ...prev, [eventId]: true }));
    try {
      const response = await createReviewAPI(eventId, { rating, comment });
      message.success('Cảm ơn bạn đã đánh giá sự kiện!');
      
      // Đẩy dữ liệu vừa đánh giá vào state để chuyển UI sang dạng "Chỉ đọc"
      setExistingReviews(prev => ({ 
        ...prev, 
        [eventId]: response.review || { rating, comment, createdAt: new Date() } 
      }));
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('đã đánh giá')) {
        message.info('Bạn đã đánh giá sự kiện này trước đó rồi.');
        // Thử fetch lại review nếu lỡ bị kẹt state
        const reviewData = await getMyReviewAPI(eventId);
        if (reviewData) setExistingReviews(prev => ({ ...prev, [eventId]: reviewData }));
      } else {
        message.error('Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setSubmitting(prev => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <ClientLayout>
      <div className="bg-[#f5f7fa] min-h-screen pb-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <StarOutlined className="text-2xl text-orange-500" />
            <Title level={2} className="!text-orange-500 !m-0">Đánh giá sự kiện đã tham gia</Title>
          </div>

          {loading ? (
            <div className="flex justify-center h-60 items-center"><Spin size="large" /></div>
          ) : pastEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 min-h-[400px]">
              <Empty description={<span className="text-gray-500 text-lg">Bạn chưa có sự kiện nào đã kết thúc để đánh giá</span>} />
              <Button type="default" size="large" onClick={() => navigate('/my-tickets')} className="mt-6">
                Quay về Vé của tôi
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {pastEvents.map((event) => (
                <Card key={event._id} hoverable className="rounded-xl shadow-sm border-0">
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={6}>
                      <img 
                        src={event.posterURL || "https://via.placeholder.com/300"} 
                        alt={event.title} 
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </Col>
                    
                    <Col xs={24} md={18}>
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <Title level={4} className="!mb-2">{event.title}</Title>
                          <Text type="secondary">Kết thúc lúc: {new Date(event.endDateTime).toLocaleString('vi-VN')}</Text>
                        </div>

                        {/* HIỂN THỊ ĐÁNH GIÁ CŨ NẾU ĐÃ REVIEW */}
                        {existingReviews[event._id] ? (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-green-700"> Bài đánh giá của bạn</span>
                              <Text type="secondary" className="text-xs">
                                {new Date(existingReviews[event._id].createdAt).toLocaleDateString('vi-VN')}
                              </Text>
                            </div>
                            <div className="mb-2">
                              <Rate disabled value={existingReviews[event._id].rating} className="text-orange-500 text-sm" />
                            </div>
                            {existingReviews[event._id].comment && (
                              <div className="bg-white p-3 rounded border border-green-100 text-gray-700 whitespace-pre-wrap">
                                {existingReviews[event._id].comment}
                              </div>
                            )}
                            <div className="mt-4 flex justify-end">
                              <Button onClick={() => navigate('/my-tickets')}>
                                Quay về Vé của tôi
                              </Button>
                            </div>
                          </div>
                        ) : (
                          
                          /* HIỂN THỊ FORM NẾU CHƯA REVIEW */
                          <div className="mt-4 bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                            <div className="mb-3">
                              <span className="font-medium mr-3">Trải nghiệm của bạn:</span>
                              <Rate 
                                value={ratings[event._id] || 0} 
                                onChange={(val) => setRatings(prev => ({...prev, [event._id]: val}))} 
                                className="text-orange-400"
                              />
                            </div>
                            <TextArea 
                              rows={3} 
                              placeholder="Chia sẻ cảm nhận của bạn về sự kiện (Không bắt buộc)..." 
                              value={comments[event._id] || ''}
                              onChange={(e) => setComments(prev => ({...prev, [event._id]: e.target.value}))}
                              className="mb-3 rounded-md"
                            />
                            <div className="flex justify-end">
                              <Button 
                                type="primary" 
                                className="!bg-orange-500 hover:!bg-orange-600 border-0"
                                loading={submitting[event._id]}
                                onClick={() => handleSubmitReview(event._id)}
                              >
                                Lưu Đánh Giá
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
};

export default MyReviewsPage;