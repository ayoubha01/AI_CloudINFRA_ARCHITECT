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
| Resources
|--------------------------------------------------------------------------
*/

const resourceSchema = z.discriminatedUnion("type", [
  ec2ResourceSchema,
  s3ResourceSchema
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