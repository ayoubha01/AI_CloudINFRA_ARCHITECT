import "dotenv/config";

import {
  validateTerraformCode
} from "./src/services/terraformValidation.service.js";


const validTerraform = `
terraform {
  required_version = ">= 1.0.0"
}

variable "application_name" {
  type = string
}
`;


const invalidTerraform = `
terraform {
  required_version = ">= 1.0.0"
}

variable "application_name" {
  type = string

`;

const runTests = async () => {

  console.log("========== VALID TERRAFORM ==========");

  const validResult =
    await validateTerraformCode(validTerraform);

  console.log(validResult);


  console.log("\n========== INVALID TERRAFORM ==========");

  const invalidResult =
    await validateTerraformCode(invalidTerraform);

  console.log(invalidResult);
};

runTests();