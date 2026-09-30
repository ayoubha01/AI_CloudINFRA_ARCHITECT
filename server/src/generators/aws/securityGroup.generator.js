import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateSecurityGroup = (resource) => {
  const {
    name,
    properties = {}
  } = resource;

  const {
    vpc,
    description = "Managed by AI IaC Generator",
    ingress = [],
    egress = []
  } = properties;

  const terraformName = sanitizeResourceName(name);
  const terraformVpcName = sanitizeResourceName(vpc);

  let terraformCode = `
resource "aws_security_group" "${terraformName}" {
  name        = "${name}"
  description = "${description}"
  vpc_id      = aws_vpc.${terraformVpcName}.id

  tags = {
    Name = "${name}"
  }
}
`;

  ingress.forEach((rule, index) => {
    terraformCode += generateIngressRule(
      terraformName,
      rule,
      index
    );
  });

  egress.forEach((rule, index) => {
    terraformCode += generateEgressRule(
      terraformName,
      rule,
      index
    );
  });

  return terraformCode;
};

const generateIngressRule = (
  securityGroupName,
  rule,
  index
) => {
  const {
    protocol,
    fromPort,
    toPort,
    cidr,
    description
  } = rule;

  const portConfiguration =
    protocol === "-1"
      ? ""
      : `
  from_port   = ${fromPort}
  to_port     = ${toPort}`;

  const descriptionConfiguration = description
    ? `
  description = "${description}"`
    : "";

  return `
resource "aws_vpc_security_group_ingress_rule" "${securityGroupName}_ingress_${index}" {
  security_group_id = aws_security_group.${securityGroupName}.id
  cidr_ipv4         = "${cidr}"
  ip_protocol       = "${protocol}"${portConfiguration}${descriptionConfiguration}
}
`;
};

const generateEgressRule = (
  securityGroupName,
  rule,
  index
) => {
  const {
    protocol,
    fromPort,
    toPort,
    cidr,
    description
  } = rule;

  const portConfiguration =
    protocol === "-1"
      ? ""
      : `
  from_port   = ${fromPort}
  to_port     = ${toPort}`;

  const descriptionConfiguration = description
    ? `
  description = "${description}"`
    : "";

  return `
resource "aws_vpc_security_group_egress_rule" "${securityGroupName}_egress_${index}" {
  security_group_id = aws_security_group.${securityGroupName}.id
  cidr_ipv4         = "${cidr}"
  ip_protocol       = "${protocol}"${portConfiguration}${descriptionConfiguration}
}
`;
};