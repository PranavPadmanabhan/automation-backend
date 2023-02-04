const router = require("express").Router();
const mongoose = require("mongoose");
const AutoTask = require("../models/AutoTask");
const { v4: uuidv4 } = require("uuid");
const { ethers } = require("ethers");

router.post("/", async (req, res) => {
  const request = JSON.parse(req.body.data);
  if (request.address && request.abi) {
    const task = await AutoTask.findOne({ address: request.address });
    if (!task) {
      const wallet = new ethers.Wallet.createRandom();
      const newTask = new AutoTask({
        id: uuidv4(),
        address: request.address,
        abi: request.abi,
        functionName: request.functionName,
        executorAddress: wallet.address,
        executorKey: wallet.privateKey,
      });
      const data = await newTask.save();
      res.status(200).json({ message: "Success", data });
    }
  } else {
    res.status(400).json({ eror: "Something went wrong" });
  }
});

router.get("/", async (req, res) => {
  res.status(200).send("Create");
});

module.exports = router;
