import { generateTerraform } from "../services/terraform.service.js";
import { infrastructureSchema } from "../schemas/infrastructure.schema.js";
import {
  validateInfrastructureReferences
} from "../validators/infrastructure.validator.js";

export const generateTerraformController = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Schema validation
    |--------------------------------------------------------------------------
    */

    const validationResult = infrastructureSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid infrastructure specification",
        details: validationResult.error.issues
      });
    }

    const infrastructure = validationResult.data;

    /*
    |--------------------------------------------------------------------------
    | 2. Logical validation
    |--------------------------------------------------------------------------
    */

    const logicalValidation =
      validateInfrastructureReferences(infrastructure);

    if (!logicalValidation.valid) {
      return res.status(400).json({
        success: false,
        error: "Invalid infrastructure dependencies",
        details: logicalValidation.errors
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Terraform generation
    |--------------------------------------------------------------------------
    */

    const terraformCode = generateTerraform(infrastructure);

    return res.status(200).json({
      success: true,
      terraform: terraformCode
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};