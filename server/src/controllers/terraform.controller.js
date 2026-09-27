import { generateTerraform } from "../services/terraform.service.js";
import { infrastructureSchema } from "../schemas/infrastructure.schema.js";

export const generateTerraformController = async (req, res) => {
  try {
    const validationResult = infrastructureSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid infrastructure specification",
        details: validationResult.error.issues
      });
    }

    const infrastructure = validationResult.data;

    const terraformCode = generateTerraform(infrastructure);

    res.status(200).json({
      success: true,
      terraform: terraformCode
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};