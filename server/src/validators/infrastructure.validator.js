export const validateInfrastructureReferences = (infrastructure) => {
  const { resources = [] } = infrastructure;

  const errors = [];

  const resourceIndex = buildResourceIndex(resources);

  for (const resource of resources) {
    switch (resource.type) {
      case "subnet":
        validateSubnet(resource, resourceIndex, errors);
        break;

      default:
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const buildResourceIndex = (resources) => {
  const index = {};

  for (const resource of resources) {
    if (!index[resource.type]) {
      index[resource.type] = new Map();
    }

    index[resource.type].set(resource.name, resource);
  }

  return index;
};

const validateSubnet = (resource, resourceIndex, errors) => {
  const referencedVpc = resource.properties.vpc;

  const vpcs = resourceIndex.vpc;

  if (!vpcs || !vpcs.has(referencedVpc)) {
    errors.push({
      resource: resource.name,
      type: resource.type,
      field: "properties.vpc",
      message: `Subnet "${resource.name}" references VPC "${referencedVpc}", but this VPC does not exist.`
    });
  }
};