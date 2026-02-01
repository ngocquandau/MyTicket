import Event        from '../models/Event.js';
import TicketClass  from '../models/TicketClass.js';
import Ticket       from '../models/Ticket.js';

// Lấy tất cả Event
// export const getAllEvents = async (req, res) => {
//   try {
//     // console.log(req.Event.id);
//     const Events = await Event.find();
//     res.json(Events);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
export const getAllEvents = async (req, res) => { 
  try { 
    // Lấy tham số từ query string 
    const {      
      limit = 10,         // số lượng record mỗi lần load 
      direction = 'asc',  // hướng sort: asc hoặc desc 
      sortField = '_id',  // field chính để sort 
      ...filters          // gom các query param còn lại thành object filter 
    } = req.query; 

    // Lấy cursor từ header 
    const cursor = req.headers['cursor'] || null; // con trỏ để phân trang (ví dụ _id cuối cùng của trang trước)
    
    // Xác định hướng sort 
    const sortOrder = direction === 'desc' ? -1 : 1; 
    
    // Điều kiện lọc 
    const query = { ...filters }; 
    
    // Áp dụng cursor để phân trang 
    if (cursor) { 
      query[sortField] = sortOrder === 1 ? { $gt: cursor } : { $lt: cursor }; 
    } 
    
    // Query MongoDB với sort + limit 
    const events = await Event.find(query) 
      .sort({ [sortField]: sortOrder, _id: sortOrder }) // _id làm tie-breaker 
      .limit(parseInt(limit, 10)) 
      .select(`_id title posterURL startDateTime endDateTime ${sortField}`); 
      
    // Xác định cursor tiếp theo 
    const nextCursor = events.length > 0 ? events[events.length - 1][sortField] : null; 
    
    // Trả về kết quả 
    res.json({ events, nextCursor }); 
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
