import "dotenv/config";

import express from "express";
import cors from "cors";

import terraformRoutes
  from "./routes/terraform.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message:
      "AI Infrastructure as Code Generator API"
  });
});

app.use(
  "/api",
  terraformRoutes
);

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});