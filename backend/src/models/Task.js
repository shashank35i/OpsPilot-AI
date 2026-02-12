const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Todo", "In Progress", "Done"], default: "Todo" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dueAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
