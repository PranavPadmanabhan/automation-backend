const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  address: { type: String, required: true, unique: true },
  abi: { type: Object, required: true },
  functionName: { type: String, required: true },
  executorAddress: { type: String, required: true },
  executorKey: { type: String, required: true },
});

module.exports = mongoose.model("AutoTask", taskSchema);
