import Event from '../models/Event.js';
import TicketClass from '../models/TicketClass.js';
import Ticket from '../models/Ticket.js';

// Lấy tất cả Event
export const getAllEvents = async (req, res) => {
  try {
    const Events = await Event.find().lean();
    res.json(Events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo Event mới
export const createEvent = async (req, res) => {
  try {
    const newEvent = new Event({ ...req.body });
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

// Lấy Event theo ID (kèm TicketClass + ticketList)
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Lấy TicketClass của Event
    const ticketClasses = await TicketClass.find({ event: event._id }).lean();

    // Nếu seatType = reserved thì populate ticketList
    const ticketClassesWithTickets = await Promise.all(ticketClasses.map(async tc => {
      if (tc.seatType === 'reserved') {
        const tickets = await Ticket.find({ ticketClass: tc._id }).lean();
        return { ...tc, ticketList: tickets };
      }
      return tc;
    }));

    event.ticketClasses = ticketClassesWithTickets;

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy tất cả TicketClass theo eventId
export const getTicketClassesByEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const ticketClasses = await TicketClass.find({ event: eventId }).lean();

    const results = await Promise.all(ticketClasses.map(async tc => {
      if (tc.seatType === 'reserved') {
        const tickets = await Ticket.find({ ticketClass: tc._id }).lean();
        return { ...tc, ticketList: tickets };
      }
      return tc;
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
