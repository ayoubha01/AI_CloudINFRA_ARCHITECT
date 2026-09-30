import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateInternetGateway = (resource) => {
  const { name, properties = {} } = resource;

  const { vpc } = properties;

  const terraformName = sanitizeResourceName(name);
  const terraformVpcName = sanitizeResourceName(vpc);

  return `
resource "aws_internet_gateway" "${terraformName}" {
  vpc_id = aws_vpc.${terraformVpcName}.id

  tags = {
    Name = "${name}"
  }
}
`;
};