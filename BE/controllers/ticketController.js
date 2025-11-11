import Ticket from '../models/Ticket.js';
import TicketClass from '../models/TicketClass.js';

// Hàm dùng nội bộ (không cần req/res)
const createTicket = async (ticketData) => {
  const newTicket = new Ticket(ticketData);
  return await newTicket.save();
};

// API tạo TicketClass
export const createTicketClass = async (req, res) => {
  try {
    // Nếu có danh sách vé và loại ghế là 'reserved', đặt totalQuantity dựa trên độ dài danh sách vé
    if (req.body.ticketList && req.body.seatType === 'reserved') { 
      req.body.totalQuantity = req.body.ticketList.length;
    }
    const newTicketClass = new TicketClass({ ...req.body });
    await newTicketClass.save();

    // Nếu là loại có ghế (reserved)
    if (req.body.ticketList && req.body.seatType === 'reserved') {
      for (const ticket of req.body.ticketList) {
        ticket.ticketClass = newTicketClass._id;
        await createTicket(ticket);
      }
    }

    res.status(201).json(newTicketClass);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy tất cả Ticket
export const getAllTicketClasses = async (req, res) => {
  try {
    const ticketClasses = await TicketClass.find().lean(); // .lean() để trả về object thuần
    const results = await Promise.all(ticketClasses.map(async tc => {
      if (tc.seatType === 'reserved') {
        const tickets = await Ticket.find({ ticketClass: tc._id });
        return { ...tc, ticketList: tickets };
      }
      return tc; // Nếu không phải reserved thì giữ nguyên, không có ticketList
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Lấy Ticket theo ID
export const getTicketClass = async (req, res) => {
  try {
    const tc = await TicketClass.findById(req.params.id).lean();
    if (!tc) return res.status(404).json({ message: 'TicketClass not found' });

    // Nếu seatType là 'reserved' thì lấy danh sách ticket tương ứng
    if (tc.seatType === 'reserved') {
      const tickets = await Ticket.find({ ticketClass: tc._id });
      return res.json({ ...tc, ticketList: tickets });
    }

    // Nếu không phải reserved thì trả nguyên object
    res.json(tc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật Ticket
export const updateTicketClass = async (req, res) => {
  try {
    const { ticketList, ...ticketClassData } = req.body;
    // Cập nhật thông tin TicketClass chính
    const updatedTicketClass = await TicketClass.findByIdAndUpdate(
      req.params.id,
      ticketClassData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedTicketClass)
      return res.status(404).json({ message: 'TicketClass not found' });

    // Nếu là reserved và có gửi ticketList thì xử lý thêm
    if (updatedTicketClass.seatType === 'reserved' && Array.isArray(ticketList)) {
      // Xóa tất cả ticket cũ thuộc ticketClass này
      await Ticket.deleteMany({ ticketClass: updatedTicketClass._id });

      // Thêm lại danh sách ticket mới
      const newTickets = ticketList.map(t => ({
        ...t,
        ticketClass: updatedTicketClass._id
      }));
      await Ticket.insertMany(newTickets);

      // Lấy lại danh sách ticket mới để trả về
      const tickets = await Ticket.find({ ticketClass: updatedTicketClass._id });
      return res.json({ ...updatedTicketClass, ticketList: tickets });
    }

    // Nếu không có ticketList hoặc không phải reserved
    res.json(updatedTicketClass);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa Ticket
export const deleteTicketClass = async (req, res) => {
  try {
    const ticketClass = await TicketClass.findById(req.params.id);

    if (!ticketClass) {
      return res.status(404).json({ message: 'TicketClass not found' });
    }

    // Nếu seatType là 'reserved' thì xóa toàn bộ ticket thuộc class này
    if (ticketClass.seatType === 'reserved') {
      await Ticket.deleteMany({ ticketClass: ticketClass._id });
    }

    // Xóa TicketClass chính
    await TicketClass.findByIdAndDelete(req.params.id);

    res.json({ message: 'TicketClass and related tickets deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
