import Event        from '../models/Event.js';
import TicketClass  from '../models/TicketClass.js';
import Ticket       from '../models/Ticket.js';

export const getAllEvents = async (req, res) => {
  try {
    const {
      limit = 10,
      direction = 'asc',
      sortField = '_id',
      search,
      ...filters
    } = req.query;

    const cursor = req.headers['cursor'] || null;
    const sortOrder = direction === 'desc' ? -1 : 1;

    const query = { ...filters };

    // SEARCH
    if (search) {
      query.$text = { $search: search };
    }

    // CURSOR pagination
    if (cursor && !search) {
      query[sortField] =
        sortOrder === 1
          ? { $gt: cursor }
          : { $lt: cursor };
    }

    let mongoQuery = Event.find(query);

    // Nếu có search → sort theo relevance
    if (search) {
      mongoQuery = mongoQuery
        .select({
          _id: 1,
          title: 1,
          posterURL: 1,
          startDateTime: 1,
          endDateTime: 1,
          score: { $meta: 'textScore' }
        })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      mongoQuery = mongoQuery
        .sort({ [sortField]: sortOrder, _id: sortOrder })
        .select('_id title posterURL startDateTime endDateTime');
    }

    const events = await mongoQuery.limit(parseInt(limit, 10));

    const nextCursor =
      events.length > 0 && !search
        ? events[events.length - 1][sortField]
        : null;

    res.json({
      events,
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
