import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateSubnet = (resource) => {
  const {
    name,
    properties = {}
  } = resource;

  const {
    cidrBlock,
    availabilityZone,
    vpc,
    mapPublicIpOnLaunch = false
  } = properties;

  const terraformName = sanitizeResourceName(name);
  const terraformVpcName = sanitizeResourceName(vpc);

  return `
resource "aws_subnet" "${terraformName}" {
  vpc_id                  = aws_vpc.${terraformVpcName}.id
  cidr_block              = "${cidrBlock}"
  availability_zone       = "${availabilityZone}"
  map_public_ip_on_launch = ${mapPublicIpOnLaunch}

  tags = {
    Name = "${name}"
  }
}
`;
};