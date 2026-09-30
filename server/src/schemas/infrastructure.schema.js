import { z } from "zod";

/*
|--------------------------------------------------------------------------
| EC2
|--------------------------------------------------------------------------
*/

const ec2PropertiesSchema = z.object({
  instanceType: z
    .string()
    .min(1)
    .default("t3.micro"),

  ami: z
    .string()
    .min(1),

  subnet: z
    .string()
    .min(1)
    .optional(),
  securityGroups: z
    .array(z.string().min(1))
    .default([])  
});

const ec2ResourceSchema = z.object({
  type: z.literal("ec2"),

  name: z
    .string()
    .min(1, "EC2 resource name is required"),

  properties: ec2PropertiesSchema
});

/*
|--------------------------------------------------------------------------
| S3
|--------------------------------------------------------------------------
*/

const s3PropertiesSchema = z.object({
  versioning: z.boolean().default(false)
});

const s3ResourceSchema = z.object({
  type: z.literal("s3"),

  name: z
    .string()
    .min(3, "S3 bucket name must contain at least 3 characters"),

  properties: s3PropertiesSchema
});

/*
|--------------------------------------------------------------------------
| VPC
|--------------------------------------------------------------------------
*/

const vpcPropertiesSchema = z.object({
  cidrBlock: z
    .string()
    .min(1)
    .default("10.0.0.0/16"),

  enableDnsSupport: z
    .boolean()
    .default(true),

  enableDnsHostnames: z
    .boolean()
    .default(true)
});

const vpcResourceSchema = z.object({
  type: z.literal("vpc"),

  name: z
    .string()
    .min(1, "VPC resource name is required"),

  properties: vpcPropertiesSchema
});

/*
|--------------------------------------------------------------------------
| Subnet
|--------------------------------------------------------------------------
*/

const subnetPropertiesSchema = z.object({
  cidrBlock: z
    .string()
    .min(1, "Subnet CIDR block is required"),

  availabilityZone: z
    .string()
    .min(1, "Availability Zone is required"),

  vpc: z
    .string()
    .min(1, "VPC reference is required"),

  mapPublicIpOnLaunch: z
    .boolean()
    .default(false)
});

const subnetResourceSchema = z.object({
  type: z.literal("subnet"),

  name: z
    .string()
    .min(1, "Subnet resource name is required"),

  properties: subnetPropertiesSchema
});

/*
|--------------------------------------------------------------------------
| Security Group
|--------------------------------------------------------------------------
*/

const securityGroupRuleSchema = z
  .object({
    protocol: z
      .string()
      .min(1),

    fromPort: z
      .number()
      .int()
      .min(0)
      .max(65535)
      .optional(),

    toPort: z
      .number()
      .int()
      .min(0)
      .max(65535)
      .optional(),

    cidr: z
      .string()
      .min(1),

    description: z
      .string()
      .optional()
  })
  .superRefine((rule, ctx) => {
    if (rule.protocol !== "-1") {
      if (rule.fromPort === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["fromPort"],
          message:
            "fromPort is required when protocol is not -1"
        });
      }

      if (rule.toPort === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["toPort"],
          message:
            "toPort is required when protocol is not -1"
        });
      }
    }

    if (
      rule.fromPort !== undefined &&
      rule.toPort !== undefined &&
      rule.fromPort > rule.toPort
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["toPort"],
        message:
          "toPort must be greater than or equal to fromPort"
      });
    }
  });

const securityGroupPropertiesSchema = z.object({
  vpc: z
    .string()
    .min(1, "VPC reference is required"),

  description: z
    .string()
    .default("Managed by AI IaC Generator"),

  ingress: z
    .array(securityGroupRuleSchema)
    .default([]),

  egress: z
    .array(securityGroupRuleSchema)
    .default([])
});

const securityGroupResourceSchema = z.object({
  type: z.literal("securityGroup"),

  name: z
    .string()
    .min(1, "Security Group name is required"),

  properties: securityGroupPropertiesSchema
});

/*
|--------------------------------------------------------------------------
| Resource union
|--------------------------------------------------------------------------
*/

const resourceSchema = z.discriminatedUnion("type", [
  ec2ResourceSchema,
  s3ResourceSchema,
  vpcResourceSchema,
  subnetResourceSchema,
  securityGroupResourceSchema
]);

/*
|--------------------------------------------------------------------------
| Infrastructure
|--------------------------------------------------------------------------
*/

export const infrastructureSchema = z.object({
  provider: z.literal("aws"),

  region: z
    .string()
    .min(1)
    .default("eu-west-1"),

  resources: z
    .array(resourceSchema)
    .min(1, "At least one resource is required")
});