import Statistic from '../models/Statistic.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Organizer from '../models/Organizer.js';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';

/**
 * Service: Tính toán thống kê và lưu DB
 */
const generateStatistic = async () => {
  const totalEvents = await Event.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalOrganizers = await Organizer.countDocuments();

  // ===== Tính đầu tháng =====
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const newEventsThisMonth = await Event.countDocuments({
    createdAt: { $gte: firstDayOfMonth }
  });

  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: firstDayOfMonth }
  });

  const activeOrganizers = await Event.distinct('organizer', {
    createdAt: { $gte: firstDayOfMonth }
  });

  const activeOrganizersThisMonth = activeOrganizers.length;

  return await Statistic.create({
    totalEvents,
    totalUsers,
    totalOrganizers,
    newEventsthisMonth: newEventsThisMonth,
    newUsersThisMonth,
    activeOrganizersThisMonth
  });
};

/**
 * API cho CRONJOB gọi
 */
export const wakeupStatistic = async (req, res) => {
  try {
    const statistic = await generateStatistic();

    return res.status(200).json({
      message: 'Statistic generated successfully',
      data: statistic
    });

  } catch (error) {
    console.error('Error in wakeupStatistic:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * API lấy thống kê gần nhất
 */
export const getOverviewStatistic = async (req, res) => {
  try {
    const latestStatistic = await Statistic.findOne()
      .sort({ createdAt: -1 });

    if (!latestStatistic) {
      return res.status(404).json({
        message: 'No statistic data found'
      });
    }

    return res.status(200).json(latestStatistic);

  } catch (error) {
    console.error('Error in getOverviewStatistic:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getOrganizerStatistic = async (req, res) => {
  try {
    const organizerId = req.headers.organizer;

    if (!organizerId) {
      return res.status(400).json({ message: "Missing organizerId in header" });
    }

    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ message: "Invalid organizerId" });
    }

    // Tổng số event
    const totalEvents = await Event.countDocuments({
      organizer: organizerId
    });

    // Lấy danh sách event id
    const events = await Event.find(
      { organizer: organizerId },
      { _id: 1 }
    );

    const eventIds = events.map(e => e._id);

    // Thống kê vé đã bán + doanh thu
    const stats = await Purchase.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: null,
          totalTicketsSold: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalTicketsSold = stats[0]?.totalTicketsSold || 0;
    const totalRevenue = stats[0]?.totalRevenue || 0;

    // Tổng số vé đã đăng (từ TicketClass)
    const totalTicketsPosted = await Event.aggregate([
      { $match: { organizer: new mongoose.Types.ObjectId(organizerId) } },
      {
        $lookup: {
          from: "ticketClasses",
          localField: "_id",
          foreignField: "event",
          as: "ticketClasses"
        }
      },
      { $unwind: "$ticketClasses" },
      {
        $group: {
          _id: null,
          totalTicketsPosted: { $sum: "$ticketClasses.totalQuantity" }
        }
      }
    ]);

    const totalTickets = totalTicketsPosted[0]?.totalTicketsPosted || 0;

    return res.status(200).json({
      totalEvents,
      totalTicketsPosted: totalTickets,
      totalTicketsSold,
      totalRevenue
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};