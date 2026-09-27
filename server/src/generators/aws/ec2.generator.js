import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateEC2 = (resource) => {
  const {
    name,
    properties = {}
  } = resource;

  const {
    instanceType = "t3.micro",
    ami = "ami-xxxxxxxx"
  } = properties;

  const terraformName = sanitizeResourceName(name);

  return `
resource "aws_instance" "${terraformName}" {
  ami           = "${ami}"
  instance_type = "${instanceType}"

  tags = {
    Name = "${name}"
  }
}
`;
};