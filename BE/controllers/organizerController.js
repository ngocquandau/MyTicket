import Organizer  from '../models/Organizer.js';
import Event      from '../models/Event.js';
import Purchase   from '../models/Purchase.js';
import Ticket     from '../models/Ticket.js';


// Lấy tất cả Organizer
export const getAllOrganizers = async (req, res) => {
  try {
    // console.log(req.Organizer.id);
    const Organizers = await Organizer.find();
    res.json(Organizers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo Organizer mới
export const createOrganizer = async (req, res) => {
  try {
    const newOrganizer = new Organizer({
      ...req.body
    });

    await newOrganizer.save();
    res.status(201).json(newOrganizer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật Organizer
export const updateOrganizer = async (req, res) => {
  try {
    const updatedOrganizer = await Organizer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedOrganizer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa Organizer
export const deleteOrganizer = async (req, res) => {
  try {
    await Organizer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Organizer deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy Organizer theo ID
export const getOrganizer = async (req, res) => {
  try {
    // const Organizer = await Organizer.findById(req.params.id);
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) return res.status(404).json({ message: 'Organizer not found' });
    res.json(organizer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getEventsByOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;
    const events = await Event.find({ organizer: organizerId });

    if (!events || events.length === 0) {
      return res.status(404).json({ message: 'No events found for this organizer' });
    }

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy organizer theo user id trong token (route: GET /api/organizer/me)
export const getOrganizerByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const organizer = await Organizer.findOne({ user: userId });
    if (!organizer) return res.status(404).json({ message: 'Organizer not found for this user' });

    res.json(organizer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// API mới: Lấy danh sách khách hàng đã mua vé theo event của organizer
// Route: GET /api/organizer/:id/events/:eventId/attendees
export const getEventAttendeesForOrganizer = async (req, res) => {
  try {
    const { id: organizerId, eventId } = req.params;
    const requester = req.user;

    if (!requester?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!['organizer', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập dữ liệu này.' });
    }

    const organizer = await Organizer.findById(organizerId).select('_id user').lean();
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    if (requester.role === 'organizer' && String(organizer.user) !== String(requester.id)) {
      return res.status(403).json({ message: 'Bạn chỉ có thể xem dữ liệu sự kiện của chính bạn.' });
    }

    const event = await Event.findOne({ _id: eventId, organizer: organizerId })
      .select('_id title startDateTime endDateTime')
      .lean();

    if (!event) {
      return res.status(404).json({ message: 'Event not found for this organizer' });
    }

    const purchases = await Purchase.find({
      event: eventId,
      paymentStatus: 'paid'
    })
      .populate('user', 'firstName lastName email phoneNumber')
      .populate('ticketClass', 'name price seatType')
      .select('_id user ticketClass paymentMethod paymentStatus quantity totalAmount purchaseDate createdAt')
      .sort({ createdAt: -1 })
      .lean();

    if (!purchases.length) {
      return res.json({
        event,
        totalRows: 0,
        attendees: []
      });
    }

    const purchaseIds = purchases.map((purchase) => purchase._id);
    const tickets = await Ticket.find({ purchase: { $in: purchaseIds }, isSold: true })
      .select('purchase seat ticketId isSold')
      .lean();

    const ticketsByPurchaseId = new Map();
    for (const ticket of tickets) {
      const key = String(ticket.purchase || '');
      if (!ticketsByPurchaseId.has(key)) {
        ticketsByPurchaseId.set(key, []);
      }
      ticketsByPurchaseId.get(key).push(ticket);
    }

    const attendees = [];
    for (const purchase of purchases) {
      const purchaseKey = String(purchase._id);
      const purchaseTickets = ticketsByPurchaseId.get(purchaseKey) || [];
      const buyer = purchase.user || {};
      const buyerName = [buyer.lastName, buyer.firstName].filter(Boolean).join(' ').trim() || 'Đang cập nhật';
      const ticketClass = purchase.ticketClass || {};

      if (purchaseTickets.length === 0) {
        attendees.push({
          key: `${purchaseKey}-fallback`,
          purchaseId: purchaseKey,
          customerName: buyerName,
          customerEmail: buyer.email || '',
          customerPhone: buyer.phoneNumber || '',
          ticketId: '',
          ticketClassName: ticketClass.name || '',
          seat: '',
          seatType: ticketClass.seatType || 'general',
          ticketPrice: Number(ticketClass.price || 0),
          quantity: Number(purchase.quantity || 0),
          totalAmount: Number(purchase.totalAmount || 0),
          paymentMethod: purchase.paymentMethod || '',
          paymentStatus: purchase.paymentStatus || '',
          purchasedAt: purchase.purchaseDate || purchase.createdAt || null
        });
        continue;
      }

      for (const ticket of purchaseTickets) {
        attendees.push({
          key: ticket.ticketId || `${purchaseKey}-${ticket._id}`,
          purchaseId: purchaseKey,
          customerName: buyerName,
          customerEmail: buyer.email || '',
          customerPhone: buyer.phoneNumber || '',
          ticketId: ticket.ticketId || '',
          ticketClassName: ticketClass.name || '',
          seat: ticket.seat || '',
          seatType: ticketClass.seatType || 'general',
          ticketPrice: Number(ticketClass.price || 0),
          quantity: Number(purchase.quantity || 0),
          totalAmount: Number(purchase.totalAmount || 0),
          paymentMethod: purchase.paymentMethod || '',
          paymentStatus: purchase.paymentStatus || '',
          purchasedAt: purchase.purchaseDate || purchase.createdAt || null
        });
      }
    }

    return res.json({
      event,
      totalRows: attendees.length,
      attendees
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
