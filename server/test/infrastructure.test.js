import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { validateInfrastructureReferences } from "../src/validators/infrastructure.validator.js";
import { generateTerraform } from "../src/services/terraform.service.js";

const vpc = {
  type: "vpc",
  name: "main-vpc",
  properties: { cidrBlock: "10.0.0.0/16" }
};

const subnet = (vpcName = "main-vpc") => ({
  type: "subnet",
  name: "public-subnet",
  properties: {
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "eu-west-1a",
    vpc: vpcName
  }
});

const internetGateway = (vpcName = "main-vpc") => ({
  type: "internetGateway",
  name: "igw",
  properties: { vpc: vpcName }
});

describe("validateInfrastructureReferences", () => {
  test("accepts resources that reference existing resources", () => {
    const result = validateInfrastructureReferences({
      resources: [vpc, subnet()]
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  test("accepts an empty specification", () => {
    assert.equal(validateInfrastructureReferences({}).valid, true);
  });

  test("rejects a subnet whose VPC does not exist", () => {
    const result = validateInfrastructureReferences({
      resources: [subnet("missing-vpc")]
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
  });

  // Regression: validateInternetGateway used to be called without `errors`,
  // so this case threw a TypeError instead of returning a validation error.
  test("reports an internet gateway pointing to a missing VPC without throwing", () => {
    const result = validateInfrastructureReferences({
      resources: [internetGateway("missing-vpc")]
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
  });
});

describe("generateTerraform", () => {
  test("writes the AWS provider with the requested region", () => {
    const hcl = generateTerraform({
      provider: "aws",
      region: "us-east-1",
      resources: []
    });

    assert.match(hcl, /provider "aws" \{\s*region = "us-east-1"/);
    assert.match(hcl, /version = "~> 6\.0"/);
  });

  test("defaults the region to eu-west-1", () => {
    const hcl = generateTerraform({ provider: "aws", resources: [] });

    assert.match(hcl, /region = "eu-west-1"/);
  });

  test("generates a VPC and a subnet that references it", () => {
    const hcl = generateTerraform({
      provider: "aws",
      resources: [vpc, subnet()]
    });

    assert.match(hcl, /resource "aws_vpc" "main_vpc"/);
    assert.match(hcl, /resource "aws_subnet" "public_subnet"/);
    assert.match(hcl, /vpc_id\s+= aws_vpc\.main_vpc\.id/);
  });

  test("rejects providers other than aws", () => {
    assert.throws(
      () => generateTerraform({ provider: "gcp", resources: [] }),
      /not supported yet/
    );
  });

  test("rejects unknown resource types", () => {
    assert.throws(
      () =>
        generateTerraform({
          provider: "aws",
          resources: [{ type: "rds", name: "db", properties: {} }]
        }),
      /not supported yet/
    );
  });
});