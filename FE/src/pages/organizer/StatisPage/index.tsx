import React, { useEffect, useState } from "react";
import { Card, Col, Row, Spin, message } from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  TagOutlined,
  SwapOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import OrganizerLayout from "../../../layouts/OrganizerLayout";
import axiosClient from "../../../services/axiosClient";

interface OrganizerStatistic {
  totalEvents: number;
  totalTicketsPosted: number;
  totalTicketsSold: number;
  totalRevenue: number;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value || 0);

const StatisPage: React.FC = () => {
  const [stat, setStat] = useState<OrganizerStatistic | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStat = async () => {
      setLoading(true);
      try {
        const meRes = await axiosClient.get("/api/organizer/me");
        const organizerId = meRes.data?._id;

        if (!organizerId) {
          message.error("Không tìm thấy thông tin ban tổ chức.");
          setLoading(false);
          return;
        }

        const res = await axiosClient.get("/api/statistic/organizer", {
          headers: { organizer: organizerId },
        });

        const data = res.data as OrganizerStatistic;

        setStat({
          totalEvents: data.totalEvents || 0,
          totalTicketsPosted: data.totalTicketsPosted || 0,
          totalTicketsSold: data.totalTicketsSold || 0,
          totalRevenue: data.totalRevenue || 0,
        });
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Lỗi khi tải số liệu thống kê.";
        message.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchStat();
  }, []);

  const averageSoldRate =
    stat && stat.totalTicketsPosted > 0
      ? (stat.totalTicketsSold / stat.totalTicketsPosted) * 100
      : 0;

  // 3 ô hàng trên
  const topRowStats = [
    {
      key: "events",
      title: "Số sự kiện",
      value: stat?.totalEvents ?? 0,
      icon: <CalendarOutlined />,
      iconBg: "#E6F0FF",
      iconColor: "#2A6DF4",
    },
    {
      key: "posted",
      title: "Số vé đã đăng",
      value: stat?.totalTicketsPosted ?? 0,
      icon: <TagOutlined />,
      iconBg: "#FFF1E0",
      iconColor: "#F97316",
    },
    {
      key: "sold",
      title: "Số vé đã bán",
      value: stat?.totalTicketsSold ?? 0,
      icon: <SwapOutlined />,
      iconBg: "#E6F7E6",
      iconColor: "#10B981",
    },
  ];

  // Ô tỉ lệ bán vé riêng
  const rateStat = {
    key: "avg-rate",
    title: "Tỉ lệ bán vé trung bình",
    value: `${averageSoldRate.toFixed(1)}%`,
    icon: <RiseOutlined />,
    iconBg: "#E0F2FE",
    iconColor: "#06B6D4",
  };

  return (
    <OrganizerLayout>
      <div className="min-h-screen bg-[#f8fafc] p-5 flex flex-col gap-5">
        {/* Header */}
        <Card
          bordered={false}
          className="rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="border-l-4 border-[#2A6DF4] pl-4 py-1">
            <h2 className="text-2xl font-bold text-gray-800">
              Thống kê - Ban tổ chức
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Tổng quan doanh thu và vé cho tài khoản ban tổ chức của bạn
            </p>
          </div>
        </Card>

        {/* Nội dung thống kê */}
        <Card
          bordered={false}
          className="rounded-2xl shadow-sm border border-gray-100"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : stat ? (
            <div className="flex flex-col gap-5">
              {/* Hàng 1: 3 ô đều nhau */}
              <Row gutter={[20, 20]}>
                {topRowStats.map((item) => (
                  <Col key={item.key} xs={24} sm={8} lg={8} className="flex">
                    <div className="bg-gradient-to-r from-[#F0FDF4] to-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 w-full h-full">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-black text-lg font-medium mb-2">
                            {item.title}
                          </p>
                          <p className="text-green-600 text-4xl font-bold">
                            {item.value}
                          </p>
                        </div>
                        <span
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{
                            backgroundColor: item.iconBg,
                            color: item.iconColor,
                          }}
                        >
                          {item.icon}
                        </span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Hàng 2: Tỉ lệ bán vé và Doanh thu */}
              <Row gutter={[20, 20]}>
                {/* Cột tỉ lệ bán vé */}
                <Col xs={24} lg={10} className="flex">
                  <div className="bg-gradient-to-r from-[#EFF6FF] to-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 w-full h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-black text-lg font-medium mb-2 truncate">
                          {rateStat.title}
                        </p>
                        <p className="text-blue-600 text-4xl font-bold">
                          {rateStat.value}
                        </p>
                      </div>
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{
                          backgroundColor: rateStat.iconBg,
                          color: rateStat.iconColor,
                        }}
                      >
                        {rateStat.icon}
                      </span>
                    </div>
                  </div>
                </Col>

                {/* Cột doanh thu */}
                <Col xs={24} lg={14} className="flex">
                  <div className="bg-gradient-to-r from-[#EFF6FF] to-white rounded-xl p-5 border border-blue-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 w-full h-full">
                    <div className="flex items-center h-full">
                      <span className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl text-[#2A6DF4] mr-4">
                        <DollarOutlined />
                      </span>
                      <div>
                        <p className="text-black text-lg mb-2 font-medium">
                          Tổng doanh thu
                        </p>
                        <p className="text-blue-600 text-4xl font-bold">
                          {formatNumber(stat?.totalRevenue ?? 0)} VND
                        </p>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Không có dữ liệu thống kê.
            </div>
          )}
        </Card>
      </div>
    </OrganizerLayout>
  );
};

export default StatisPage;