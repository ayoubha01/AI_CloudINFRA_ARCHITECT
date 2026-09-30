import { generateEC2 } from "../generators/aws/ec2.generator.js";
import { generateS3 } from "../generators/aws/s3.generator.js";
import { generateVPC } from "../generators/aws/vpc.generator.js";
import { generateSubnet } from "../generators/aws/subnet.generator.js";
import { generateSecurityGroup } from "../generators/aws/securityGroup.generator.js";
import { generateInternetGateway } from "../generators/aws/internetGateway.generator.js";
import { generateRouteTable } from "../generators/aws/routeTable.generator.js";

export const generateTerraform = (infrastructure) => {
  const {
    provider,
    region = "eu-west-1",
    resources = []
  } = infrastructure;

  if (provider !== "aws") {
    throw new Error(
      `Provider "${provider}" is not supported yet.`
    );
  }

  const providerConfig = generateProviderConfig(region);

  const resourcesCode = resources
    .map((resource) => generateResource(resource))
    .join("\n");

  return `${providerConfig}\n${resourcesCode}`;
};

const generateProviderConfig = (region) => {
  return `
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "${region}"
}
`;
};

const generateResource = (resource) => {
  switch (resource.type) {
    case "ec2":
      return generateEC2(resource);

    case "s3":
      return generateS3(resource);

    case "vpc":
      return generateVPC(resource);

    case "subnet":
      return generateSubnet(resource);

    case "securityGroup":
      return generateSecurityGroup(resource);
      
    case "internetGateway":
      return generateInternetGateway(resource);

    case "routeTable":
      return generateRouteTable(resource);

    default:
      throw new Error(
        `Resource type "${resource.type}" is not supported yet.`
      );
  }
};