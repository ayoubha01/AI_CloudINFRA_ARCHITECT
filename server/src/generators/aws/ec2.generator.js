import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateEC2 = (resource) => {
  const {
    name,
    properties = {}
  } = resource;

  const {
    instanceType = "t3.micro",
    ami,
    subnet
  } = properties;

  const terraformName = sanitizeResourceName(name);

  let subnetConfig = "";

  if (subnet) {
    const subnetTerraformName =
      sanitizeResourceName(subnet);

    subnetConfig = `
  subnet_id     = aws_subnet.${subnetTerraformName}.id`;
  }

  return `
resource "aws_instance" "${terraformName}" {
  ami           = "${ami}"
  instance_type = "${instanceType}"${subnetConfig}

  tags = {
    Name = "${name}"
  }
}
`;
};