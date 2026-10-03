import express from "express";
import { generateTerraformController } from "../controllers/terraform.controller.js";
import { generateTerraformFromPromptController } from "../controllers/ai.controller.js";
import {
  generateHCLFromPromptController
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/generate", generateTerraformController);
router.post("/generate-from-prompt", generateTerraformFromPromptController);
router.post("/generate-hcl",generateHCLFromPromptController);
export default router;