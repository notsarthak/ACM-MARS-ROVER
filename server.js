const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

let app = express();
app.use(express.json({ extended: false }));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((_) => console.log("Connected to mongoDB"))
  .catch((err) => console.log(err));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));

let PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Started on port ${PORT}`));
