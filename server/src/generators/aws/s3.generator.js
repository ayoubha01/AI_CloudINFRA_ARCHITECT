import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateS3 = (resource) => {
  const {
    name,
    properties = {}
  } = resource;

  const {
    versioning = false
  } = properties;

  const terraformName = sanitizeResourceName(name);

  let terraformCode = `
resource "aws_s3_bucket" "${terraformName}" {
  bucket = "${name}"

  tags = {
    Name = "${name}"
  }
}
`;

  if (versioning) {
    terraformCode += `
resource "aws_s3_bucket_versioning" "${terraformName}_versioning" {
  bucket = aws_s3_bucket.${terraformName}.id

  versioning_configuration {
    status = "Enabled"
  }
}
`;
  }

  return terraformCode;
};