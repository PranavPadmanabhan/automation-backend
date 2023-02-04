const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParse = require("body-parser");
const TaskCreateRoute = require("./routes/createAutomation");
const TaskDeleteRoute = require("./routes/delete");
const {
  checkAutomationState,
  listenToNewTasks,
} = require("./utils/helper-functions");

dotenv.config();

const http = require("http");
const app = express();
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "solmate-backend",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

app.use(cors());

///  Routes

app.use("/create", TaskCreateRoute);
app.use("/delete", TaskDeleteRoute);

app.get("/", (req, res) => {
  res.send("Hello");
});

/// listening to changes

mongoose
  .connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDb connection successfull");
    checkAutomationState();
    listenToNewTasks();
  })
  .catch((err) => console.log(err));

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
