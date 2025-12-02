import Interaction        from '../models/Interaction.js';

// Lấy tất cả Interaction
export const getAllInteractions = async (req, res) => {
  try {
    const interactions = await Interaction.find();
    res.json(interactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy Interaction theo ID
export const getInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);
    if (!interaction) return res.status(404).json({ message: 'Interaction not found' });
    res.json(interaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Tạo Interaction mới
export const createInteraction = async (req, res) => {
  try {
    const newInteraction = new Interaction({
      ...req.body
    });

    await newInteraction.save();
    res.status(201).json(newInteraction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật Interaction
export const updateInteraction = async (req, res) => {
  try {
    const updatedInteraction = await Interaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedInteraction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa Interaction
export const deleteInteraction = async (req, res) => {
  try {
    await Interaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Interaction deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};