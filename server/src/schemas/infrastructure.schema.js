import { z } from "zod";

/*
|--------------------------------------------------------------------------
| EC2
|--------------------------------------------------------------------------
*/

const ec2PropertiesSchema = z.object({
  instanceType: z.string().min(1).default("t3.micro"),
  ami: z.string().min(1)
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
| Resource union
|--------------------------------------------------------------------------
*/

const resourceSchema = z.discriminatedUnion("type", [
  ec2ResourceSchema,
  s3ResourceSchema,
  vpcResourceSchema,
  subnetResourceSchema
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