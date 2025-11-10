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

// API riêng cho ticket (nếu cần route)
export const addTicket = async (req, res) => {
  try {
    const newTicket = new Ticket({ ...req.body });
    await newTicket.save();
    res.status(201).json(newTicket);
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

// Lấy tất cả Ticket của TicketClass cụ thể
export const getAllTickets = async (req, res) => { 
  try {
    // console.log(req.Ticket.id);
    const Tickets = await TicketClass.find();
    res.json(Tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy Ticket theo ID
export const getTicket = async (req, res) => {
  try {
    // const Ticket = await Ticket.findById(req.params.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật Ticket
export const updateTicket = async (req, res) => {
  try {
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa Ticket
export const deleteTicket = async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};