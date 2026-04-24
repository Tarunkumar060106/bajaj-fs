const express = require("express");
const cors = require("cors");

const { PORT } = require("./constants");
const bfhlRouter = require("./bfhl");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

app.use("/bfhl", bfhlRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
