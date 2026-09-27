import express from "express";
import {
  generateTerraformController
} from "../controllers/terraform.controller.js";

const router = express.Router();

router.post("/generate", generateTerraformController);

export default router;