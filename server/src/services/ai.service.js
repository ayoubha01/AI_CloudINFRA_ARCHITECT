import OpenAI from "openai";

import {
  zodTextFormat
} from "openai/helpers/zod";

import {
  aiInfrastructureSchema
} from "../schemas/aiInfrastructure.schema.js";

const SYSTEM_PROMPT = `
You are an expert AWS Cloud Architect.

Your job is to convert natural-language infrastructure requirements
into a structured AWS infrastructure specification.

You MUST only use the resource types supported by the application:

- vpc
- subnet
- internetGateway
- routeTable
- securityGroup
- ec2
- s3

Rules:

1. Never generate Terraform or HCL.
2. Only generate the structured infrastructure specification.
3. Provider must always be "aws".
4. If the user does not specify a region, use "eu-west-1".
5. Resource names must be simple and descriptive.
6. References between resources MUST use the exact resource names.

Example:

If a VPC is named:

"main-vpc"

then a subnet belonging to it must contain:

"vpc": "main-vpc"

7. A public subnet normally requires:
   - a VPC
   - an Internet Gateway
   - a Route Table
   - a route to 0.0.0.0/0 through the Internet Gateway
   - association between the Route Table and subnet
   - mapPublicIpOnLaunch = true

8. Do not expose SSH port 22 to 0.0.0.0/0 unless the user explicitly requests it.

9. For unrestricted outbound traffic use:
   protocol = "-1"
   cidr = "0.0.0.0/0"
   fromPort = null
   toPort = null

10. When protocol is TCP or UDP, provide fromPort and toPort.

11. If EC2 is inside a subnet, reference that subnet using its exact resource name.

12. If EC2 uses Security Groups, reference them using their exact resource names.

13. Do not invent unsupported AWS resources.

14. If the user does not request S3, do not create S3.

15. Keep the architecture as simple as possible while satisfying the request.
`;

export const generateInfrastructureFromPrompt =
  async (userPrompt) => {

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not configured."
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const model =
      process.env.OPENAI_MODEL ||
      "gpt-5.6-luna";

    const response =
      await client.responses.parse({
        model,

        instructions: SYSTEM_PROMPT,

        input: userPrompt,

        text: {
          format: zodTextFormat(
            aiInfrastructureSchema,
            "aws_infrastructure"
          )
        }
      });

    if (
      response.status !== "completed" ||
      !response.output_parsed
    ) {
      throw new Error(
        "The AI model did not return a valid infrastructure specification."
      );
    }

    return response.output_parsed;
  };