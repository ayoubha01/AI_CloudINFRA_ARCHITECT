import { sanitizeResourceName } from "../../utils/terraform.utils.js";

export const generateRouteTable = (resource) => {
  const { name, properties = {} } = resource;

  const {
    vpc,
    routes = [],
    subnets = []
  } = properties;

  const terraformName = sanitizeResourceName(name);
  const terraformVpcName = sanitizeResourceName(vpc);

  let terraformCode = `
resource "aws_route_table" "${terraformName}" {
  vpc_id = aws_vpc.${terraformVpcName}.id

  tags = {
    Name = "${name}"
  }
}
`;

  /*
  |--------------------------------------------------------------------------
  | Routes
  |--------------------------------------------------------------------------
  */

  routes.forEach((route, index) => {
    terraformCode += generateRoute(
      terraformName,
      route,
      index
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Subnet associations
  |--------------------------------------------------------------------------
  */

  subnets.forEach((subnet, index) => {
    terraformCode += generateSubnetAssociation(
      terraformName,
      subnet,
      index
    );
  });

  return terraformCode;
};

const generateRoute = (
  routeTableName,
  route,
  index
) => {
  const {
    destinationCidrBlock,
    internetGateway
  } = route;

  const gatewayTerraformName =
    sanitizeResourceName(internetGateway);

  return `
resource "aws_route" "${routeTableName}_route_${index}" {
  route_table_id         = aws_route_table.${routeTableName}.id
  destination_cidr_block = "${destinationCidrBlock}"
  gateway_id             = aws_internet_gateway.${gatewayTerraformName}.id
}
`;
};

const generateSubnetAssociation = (
  routeTableName,
  subnet,
  index
) => {
  const subnetTerraformName =
    sanitizeResourceName(subnet);

  return `
resource "aws_route_table_association" "${routeTableName}_association_${index}" {
  subnet_id      = aws_subnet.${subnetTerraformName}.id
  route_table_id = aws_route_table.${routeTableName}.id
}
`;
};