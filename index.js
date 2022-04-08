const express = require("express");
const cors = require("cors");
const app = express();
const fileProcessor = require("./routes/fileProcessor");

app.use(cors())
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use("/", fileProcessor)
    .listen(9999, () => "Listening on 9999");
