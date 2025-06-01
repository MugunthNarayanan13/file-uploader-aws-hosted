const express = require("express");
const cors = require("cors");
const app = express();
const uploadRouter = require("./routes/upload");
const deleteRouter = require("./routes/delete");

app.use(cors());
app.use(express.json());
app.use("/upload", uploadRouter);
app.use("/delete", deleteRouter);

module.exports = app;
