import Organizer  from '../models/Organizer.js';
import Event      from '../models/Event.js';


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
