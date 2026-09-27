import { z } from "zod";

const ec2PropertiesSchema = z.object({
  instanceType: z.string().min(1).default("t3.micro"),
  ami: z.string().min(1)
});

const ec2ResourceSchema = z.object({
  type: z.literal("ec2"),
  name: z.string().min(1),
  properties: ec2PropertiesSchema
});

export const infrastructureSchema = z.object({
  provider: z.literal("aws"),

  region: z.string().min(1).default("eu-west-1"),

  resources: z
    .array(ec2ResourceSchema)
    .min(1, "At least one resource is required")
});