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

import {
  validateTerraformCode
} from "../services/terraformValidation.service.js";

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
      | 7. Terraform native validation
      |--------------------------------------------------------------------------
      */

      const terraformValidation =
        await validateTerraformCode(
          terraform
        ); 
      /*
      |--------------------------------------------------------------------------
      | 8. Return everything
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success:
          terraformValidation.valid,

        prompt,

        infrastructure,

        terraform:
          terraformValidation.terraform,

        validation: {
          terraform:
            terraformValidation.valid,

          diagnostics:
            terraformValidation.diagnostics || [],

          error:
            terraformValidation.error || null
        }
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

export const generateHCLFromPromptController =
  async (req, res) => {
    try {
      const promptValidation =
        promptSchema.safeParse(req.body);

      if (!promptValidation.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid prompt",
          details: promptValidation.error.issues
        });
      }

      const { prompt } = promptValidation.data;

      // 1. AI generation
      const aiInfrastructure =
        await generateInfrastructureFromPrompt(prompt);

      // 2. Normalize
      const normalizedInfrastructure =
        removeNullValues(aiInfrastructure);

      // 3. Zod validation
      const schemaValidation =
        infrastructureSchema.safeParse(
          normalizedInfrastructure
        );

      if (!schemaValidation.success) {
        return res.status(422).json({
          success: false,
          error:
            "AI generated an invalid infrastructure specification",
          details:
            schemaValidation.error.issues
        });
      }

      const infrastructure =
        schemaValidation.data;

      // 4. Dependency validation
      const logicalValidation =
        validateInfrastructureReferences(
          infrastructure
        );

      if (!logicalValidation.valid) {
        return res.status(422).json({
          success: false,
          error:
            "Invalid infrastructure dependencies",
          details:
            logicalValidation.errors
        });
      }

      // 5. Terraform generation
      const terraform =
        generateTerraform(infrastructure);

      // 6. fmt + init + validate
      const terraformValidation =
        await validateTerraformCode(terraform);

      if (!terraformValidation.valid) {
        return res.status(422).json({
          success: false,
          error: "Terraform validation failed",
          diagnostics:
            terraformValidation.diagnostics,
          validationError:
            terraformValidation.error
        });
      }

      // 7. Return PURE HCL
      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      );
      
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="main.tf"'
      );

      res.status(200).send(
        terraformValidation.terraform
      );

      return res.send(
        terraformValidation.terraform
      );
      
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };