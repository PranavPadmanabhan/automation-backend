const router = require("express").Router();
const mongoose = require("mongoose");
const AutoTask = require("../models/AutoTask");

router.post("/", async (req, res) => {
  const request = JSON.parse(req.body.data);
  if (mongoose.ConnectionStates.connected && request.address) {
    await AutoTask.deleteOne({ address: request.address });
    res.send("Done");
  } else {
    res.status(400).json({ eror: "Something went wrong" });
  }
});

router.get("/", async (req, res) => {
  res.status(200).send("delete");
});

module.exports = router;
