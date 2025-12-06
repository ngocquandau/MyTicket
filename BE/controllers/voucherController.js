import Voucher        from '../models/Voucher.js';

// Lấy tất cả Voucher
export const getAllVouchers = async (req, res) => {
  try {
    const Vouchers = await Voucher.find();
    res.json(Vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy Voucher theo ID
export const getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Tạo Voucher mới
export const createVoucher = async (req, res) => {
  try {
    const newVoucher = new Voucher({
      ...req.body
    });

    await newVoucher.save();
    res.status(201).json(newVoucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật Voucher
export const updateVoucher = async (req, res) => {
  try {
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedVoucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa Voucher
export const deleteVoucher = async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Voucher deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};