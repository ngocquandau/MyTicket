import Event        from '../models/Event.js';
import TicketClass  from '../models/TicketClass.js';
import Ticket       from '../models/Ticket.js';

// Lấy tất cả Event
export const getAllEvents = async (req, res) => {
  try {
    // console.log(req.Event.id);
    const Events = await Event.find();
    res.json(Events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo Event mới
export const createEvent = async (req, res) => {
  try {
    // // Hash password trước khi lưu
    // const saltRounds = 10;
    // const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Tạo Event mới với password đã mã hóa
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
