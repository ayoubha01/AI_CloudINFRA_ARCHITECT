import { generateTerraform } from "../services/terraform.service.js";

export const generateTerraformController = async (req, res) => {
  try {
    const infrastructure = req.body;

    const terraformCode = generateTerraform(infrastructure);

    res.status(200).json({
      success: true,
      terraform: terraformCode
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};