import {
  promptSchema
} from "../schemas/prompt.schema.js";

import {
  infrastructureSchema
} from "../schemas/infrastructure.schema.js";

import {
  generateInfrastructureFromPrompt
} from "../services/ai.service.js";

import {
  generateTerraform
} from "../services/terraform.service.js";

import {
  validateInfrastructureReferences
} from "../validators/infrastructure.validator.js";

import {
  removeNullValues
} from "../utils/object.utils.js";

export const generateTerraformFromPromptController =
  async (req, res) => {

    try {

      /*
      |--------------------------------------------------------------------------
      | 1. Validate user prompt
      |--------------------------------------------------------------------------
      */

      const promptValidation =
        promptSchema.safeParse(req.body);

      if (!promptValidation.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid prompt",
          details:
            promptValidation.error.issues
        });
      }

      const { prompt } =
        promptValidation.data;

      /*
      |--------------------------------------------------------------------------
      | 2. Ask AI for infrastructure specification
      |--------------------------------------------------------------------------
      */

      const aiInfrastructure =
        await generateInfrastructureFromPrompt(
          prompt
        );

      /*
      |--------------------------------------------------------------------------
      | 3. Normalize AI response
      |--------------------------------------------------------------------------
      */

      const normalizedInfrastructure =
        removeNullValues(
          aiInfrastructure
        );

      /*
      |--------------------------------------------------------------------------
      | 4. Validate using our business schema
      |--------------------------------------------------------------------------
      */

      const schemaValidation =
        infrastructureSchema.safeParse(
          normalizedInfrastructure
        );

      if (!schemaValidation.success) {
        return res.status(422).json({
          success: false,

          error:
            "AI generated an invalid infrastructure specification",

          infrastructure:
            normalizedInfrastructure,

          details:
            schemaValidation.error.issues
        });
      }

      const infrastructure =
        schemaValidation.data;

      /*
      |--------------------------------------------------------------------------
      | 5. Logical dependency validation
      |--------------------------------------------------------------------------
      */

      const logicalValidation =
        validateInfrastructureReferences(
          infrastructure
        );

      if (!logicalValidation.valid) {
        return res.status(422).json({
          success: false,

          error:
            "AI generated invalid infrastructure dependencies",

          infrastructure,

          details:
            logicalValidation.errors
        });
      }

      /*
      |--------------------------------------------------------------------------
      | 6. Generate Terraform
      |--------------------------------------------------------------------------
      */

      const terraform =
        generateTerraform(
          infrastructure
        );

      /*
      |--------------------------------------------------------------------------
      | 7. Return everything
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,

        prompt,

        infrastructure,

        terraform
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };