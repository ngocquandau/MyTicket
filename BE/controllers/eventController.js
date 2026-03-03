import Event        from '../models/Event.js';
import TicketClass  from '../models/TicketClass.js';
import Ticket       from '../models/Ticket.js';

export const getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      direction = 'desc',
      sortField = 'createdAt',
      search,
      cursor,
      ...rawFilters
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 200);
    const sortOrder = String(direction).toLowerCase() === 'asc' ? 1 : -1;

    // chỉ cho phép 1 số filter hợp lệ
    const query = {};
    if (rawFilters.status) query.status = rawFilters.status;
    if (rawFilters.genre) query.genre = rawFilters.genre;
    if (rawFilters.organizer) query.organizer = rawFilters.organizer;

    if (search) {
      query.$text = { $search: search };
    }

    // hỗ trợ cursor nếu cần (không dùng khi search)
    if (cursor && !search) {
      query[sortField] = sortOrder === 1 ? { $gt: cursor } : { $lt: cursor };
    }

    let mongoQuery = Event.find(query);

    if (search) {
      mongoQuery = mongoQuery
        .select({
          _id: 1,
          title: 1,
          genre: 1,
          status: 1,
          posterURL: 1,
          organizer: 1,
          location: 1,
          startDateTime: 1,
          endDateTime: 1,
          createdAt: 1,
          score: { $meta: 'textScore' }
        })
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
    } else {
      mongoQuery = mongoQuery
        .sort({ [sortField]: sortOrder, _id: sortOrder })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select('_id title genre status posterURL organizer location startDateTime endDateTime createdAt');
    }

    const [events, total] = await Promise.all([
      mongoQuery,
      Event.countDocuments(query)
    ]);

    const nextCursor =
      events.length > 0 && !search
        ? events[events.length - 1][sortField]
        : null;

    res.json({
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      nextCursor
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo Event mới
export const createEvent = async (req, res) => {
  try {
    // Tạo Event mới
    const newEvent = new Event({
      ...req.body
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật Event
export const updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa Event
export const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy Event theo ID
export const getEvent = async (req, res) => {
  try {
    // const Event = await Event.findById(req.params.id);
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy tất cả TicketClass theo eventId
export const getTicketClassesByEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const ticketClasses = await TicketClass.find({ event: eventId }).lean();

    const results = await Promise.all(ticketClasses.map(async tc => {
      if (tc.seatType === 'reserved') {
        const tickets = await Ticket.find({ ticketClass: tc._id });
        return { ...tc, ticketList: tickets };
      }
      return tc;
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
