import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateEC2 = (resource) => {
  const {
    name,
    properties = {}
  } = resource;

  const {
    instanceType = "t3.micro",
    ami,
    subnet,
    securityGroups = []
  } = properties;

  const terraformName = sanitizeResourceName(name);

  let subnetConfig = "";

  if (subnet) {
    const subnetTerraformName =
      sanitizeResourceName(subnet);

    subnetConfig = `
  subnet_id     = aws_subnet.${subnetTerraformName}.id`;
  }
  let securityGroupsConfig = "";

  if (securityGroups.length > 0) {
    const securityGroupReferences = securityGroups
      .map(
        (securityGroup) =>
          `aws_security_group.${sanitizeResourceName(
            securityGroup
          )}.id`
      )
      .join(", ");

    securityGroupsConfig = `
  vpc_security_group_ids = [${securityGroupReferences}]`;
  }

  return `
resource "aws_instance" "${terraformName}" {
  ami           = "${ami}"
  instance_type = "${instanceType}"${subnetConfig}${securityGroupsConfig}

  tags = {
    Name = "${name}"
  }
}
`;
};