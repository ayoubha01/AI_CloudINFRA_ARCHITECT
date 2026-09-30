import { z } from "zod";

/*
|--------------------------------------------------------------------------
| EC2
|--------------------------------------------------------------------------
*/

const aiEC2Schema = z.object({
  type: z.literal("ec2"),

  name: z
    .string()
    .describe("Unique logical name of the EC2 instance"),

  properties: z.object({
    instanceType: z
      .string()
      .describe("AWS EC2 instance type such as t3.micro"),

    ami: z
      .string()
      .describe("AMI identifier requested by the user"),

    subnet: z
      .string()
      .nullable()
      .describe(
        "Name of an existing subnet resource or null"
      ),

    securityGroups: z
      .array(z.string())
      .describe(
        "Names of Security Group resources attached to the EC2 instance"
      )
  })
});

/*
|--------------------------------------------------------------------------
| S3
|--------------------------------------------------------------------------
*/

const aiS3Schema = z.object({
  type: z.literal("s3"),

  name: z.string(),

  properties: z.object({
    versioning: z.boolean()
  })
});

/*
|--------------------------------------------------------------------------
| VPC
|--------------------------------------------------------------------------
*/

const aiVPCSchema = z.object({
  type: z.literal("vpc"),

  name: z.string(),

  properties: z.object({
    cidrBlock: z.string(),

    enableDnsSupport: z.boolean(),

    enableDnsHostnames: z.boolean()
  })
});

/*
|--------------------------------------------------------------------------
| Subnet
|--------------------------------------------------------------------------
*/

const aiSubnetSchema = z.object({
  type: z.literal("subnet"),

  name: z.string(),

  properties: z.object({
    cidrBlock: z.string(),

    availabilityZone: z.string(),

    vpc: z
      .string()
      .describe(
        "Exact name of the VPC resource referenced by this subnet"
      ),

    mapPublicIpOnLaunch: z.boolean()
  })
});

/*
|--------------------------------------------------------------------------
| Security Group rule
|--------------------------------------------------------------------------
*/

const aiSecurityGroupRuleSchema = z.object({
  protocol: z
    .string()
    .describe(
      'Protocol such as "tcp", "udp", "icmp" or "-1"'
    ),

  fromPort: z
    .number()
    .nullable(),

  toPort: z
    .number()
    .nullable(),

  cidr: z.string(),

  description: z
    .string()
    .nullable()
});

/*
|--------------------------------------------------------------------------
| Security Group
|--------------------------------------------------------------------------
*/

const aiSecurityGroupSchema = z.object({
  type: z.literal("securityGroup"),

  name: z.string(),

  properties: z.object({
    vpc: z
      .string()
      .describe(
        "Exact name of the VPC resource"
      ),

    description: z.string(),

    ingress: z.array(aiSecurityGroupRuleSchema),

    egress: z.array(aiSecurityGroupRuleSchema)
  })
});

/*
|--------------------------------------------------------------------------
| Internet Gateway
|--------------------------------------------------------------------------
*/

const aiInternetGatewaySchema = z.object({
  type: z.literal("internetGateway"),

  name: z.string(),

  properties: z.object({
    vpc: z
      .string()
      .describe(
        "Exact name of the VPC resource"
      )
  })
});

/*
|--------------------------------------------------------------------------
| Route
|--------------------------------------------------------------------------
*/

const aiRouteSchema = z.object({
  destinationCidrBlock: z.string(),

  internetGateway: z
    .string()
    .describe(
      "Exact name of the Internet Gateway resource"
    )
});

/*
|--------------------------------------------------------------------------
| Route Table
|--------------------------------------------------------------------------
*/

const aiRouteTableSchema = z.object({
  type: z.literal("routeTable"),

  name: z.string(),

  properties: z.object({
    vpc: z
      .string()
      .describe(
        "Exact name of the VPC resource"
      ),

    routes: z.array(aiRouteSchema),

    subnets: z
      .array(z.string())
      .describe(
        "Exact names of the subnets associated with this route table"
      )
  })
});

/*
|--------------------------------------------------------------------------
| Resource
|--------------------------------------------------------------------------
*/

const aiResourceSchema = z.discriminatedUnion(
  "type",
  [
    aiEC2Schema,
    aiS3Schema,
    aiVPCSchema,
    aiSubnetSchema,
    aiSecurityGroupSchema,
    aiInternetGatewaySchema,
    aiRouteTableSchema
  ]
);

/*
|--------------------------------------------------------------------------
| Complete Infrastructure
|--------------------------------------------------------------------------
*/

export const aiInfrastructureSchema = z.object({
  provider: z.literal("aws"),

  region: z.string(),

  resources: z.array(aiResourceSchema)
});