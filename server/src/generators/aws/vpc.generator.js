import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateVPC = (resource) => {
  const {
    name,
    properties = {}
  } = resource;

  const {
    cidrBlock = "10.0.0.0/16",
    enableDnsSupport = true,
    enableDnsHostnames = true
  } = properties;

  const terraformName = sanitizeResourceName(name);

  return `
resource "aws_vpc" "${terraformName}" {
  cidr_block           = "${cidrBlock}"
  enable_dns_support   = ${enableDnsSupport}
  enable_dns_hostnames = ${enableDnsHostnames}

  tags = {
    Name = "${name}"
  }
}
`;
};