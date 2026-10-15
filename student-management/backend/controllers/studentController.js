const Student = require("../models/Student");

const required = ["studentId", "name", "email", "department", "semester"];
const missing = (b) => required.filter((f) => !b[f]);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getAll = async (req, res) => {
  try {
    const q = req.query.search;
    const filter = q
      ? { $or: [
          { name: new RegExp(escape(q), "i") },
          { studentId: new RegExp(escape(q), "i") },
          { department: new RegExp(escape(q), "i") }
        ] }
      : {};
    res.json({ success: true, data: await Student.find(filter).sort({ studentId: 1 }) });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const s = await Student.findOne({ studentId: req.params.id });
    if (!s) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: s });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.create = async (req, res) => {
  const m = missing(req.body);
  if (m.length) return res.status(400).json({ success: false, message: `Missing: ${m.join(", ")}` });
  try {
    await Student.create(req.body);
    res.status(201).json({ success: true, message: "Student added successfully" });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: "Student ID already exists" });
    res.status(400).json({ success: false, message: "Invalid data" });
  }
};

exports.update = async (req, res) => {
  try {
    const { studentId, ...changes } = req.body;
    const s = await Student.findOneAndUpdate(
      { studentId: req.params.id }, changes, { new: true, runValidators: true }
    );
    if (!s) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student updated successfully", data: s });
  } catch {
    res.status(400).json({ success: false, message: "Invalid data" });
  }
};

exports.remove = async (req, res) => {
  try {
    const s = await Student.findOneAndDelete({ studentId: req.params.id });
    if (!s) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
