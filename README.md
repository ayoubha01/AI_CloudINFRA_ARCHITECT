# AI Cloud Infra Architect

Describe an AWS infrastructure in plain English and get validated Terraform back.

The LLM never writes the Terraform. It only proposes a structured specification. The application validates that specification, generates the HCL deterministically, then checks the result with the Terraform CLI.

> AI proposes the infrastructure; the application controls what is accepted.

## How it works

```text
Prompt
  → LLM (structured output)
  → Schema validation (Zod)
  → Dependency validation
  → Deterministic Terraform generator
  → terraform fmt / init / validate
  → HCL + diagnostics
```

| Step | What happens | Code (`server/src/`) |
|------|--------------|----------------------|
| 1 | The prompt is validated | `schemas/prompt.schema.js` |
| 2 | The LLM returns a specification constrained to the supported resource types | `services/ai.service.js`, `schemas/aiInfrastructure.schema.js` |
| 3 | The specification is checked against the business schema: required fields, types, port ranges, defaults | `schemas/infrastructure.schema.js` |
| 4 | References between resources are checked, for example a subnet must point to a VPC that exists | `validators/infrastructure.validator.js` |
| 5 | HCL is generated, one generator per resource type | `services/terraform.service.js`, `generators/aws/` |
| 6 | `terraform fmt`, `terraform init -backend=false` and `terraform validate` run in a temporary directory | `services/terraformValidation.service.js` |

Nothing is ever deployed: the application generates and validates code, it does not run `terraform apply`.

## Supported AWS resources

| Specification type | Terraform resources generated |
|--------------------|-------------------------------|
| `vpc` | `aws_vpc` |
| `subnet` | `aws_subnet` |
| `internetGateway` | `aws_internet_gateway` |
| `routeTable` | `aws_route_table`, `aws_route`, `aws_route_table_association` |
| `securityGroup` | `aws_security_group`, `aws_vpc_security_group_ingress_rule`, `aws_vpc_security_group_egress_rule` |
| `ec2` | `aws_instance` |
| `s3` | `aws_s3_bucket`, `aws_s3_bucket_versioning` |

Dependency checks cover subnet → VPC, security group → VPC, internet gateway → VPC, route table → VPC / internet gateway / subnets (all in the same VPC), and EC2 → subnet / security groups.

## Tech stack

- **Backend:** Node.js, Express 5, Zod 4, the OpenAI SDK pointed at Groq's OpenAI-compatible API, Terraform CLI
- **Frontend:** React 19, Vite 8
- **Generated code:** Terraform with the AWS provider `~> 6.0`
- **Packaging:** Docker, Docker Compose, Kubernetes manifests

## Configuration

| Variable | Used by | Required | Default | Purpose |
|----------|---------|----------|---------|---------|
| `GROQ_API_KEY` | backend | yes | none | Groq API key |
| `OPENAI_MODEL` | backend | no | `openai/gpt-oss-20b` | Model name sent to Groq |
| `PORT` | backend | no | `5000` | API port |
| `VITE_API_PROXY_TARGET` | frontend | no | `http://backend:5000` | Where the Vite dev server forwards `/api` |

For Docker Compose and local runs, the backend variables live in `server/.env`:

```env
GROQ_API_KEY=your_groq_api_key
OPENAI_MODEL=openai/gpt-oss-20b
PORT=5000
```

Never commit this file. It is already covered by `.gitignore` and `.dockerignore`.

## Getting started

```bash
git clone https://github.com/ayoubha01/AI_CloudINFRA_ARCHITECT.git
cd AI_CloudINFRA_ARCHITECT
```

### Option 1: Docker Compose

Create `server/.env` as shown above, then:

```bash
docker compose up --build
```

Open <http://localhost:5173>. The API is also exposed on <http://localhost:5000>.

### Option 2: Local development

Requires Node.js 24 and the `terraform` CLI on your `PATH`.

Backend, with `server/.env` in place:

```bash
cd server
npm install
npm run dev
```

Frontend, in a second terminal. The proxy target must point to your local backend:

```bash
cd frontend
npm install
VITE_API_PROXY_TARGET=http://localhost:5000 npm run dev
```

On PowerShell, replace the last line with:

```powershell
$env:VITE_API_PROXY_TARGET = "http://localhost:5000"; npm run dev
```

### Option 3: Kubernetes

The manifests expect two local images and use `imagePullPolicy: IfNotPresent`, so your cluster must be able to find them without a registry. The project is developed on Docker Desktop's built-in Kubernetes.

```bash
docker build -f dockerfiles/Dockerfile.ai-backend  -t ai-backend:latest  .
docker build -f dockerfiles/Dockerfile.ai-frontend -t ai-frontend:latest .
```

Deploy in this order. The Secret is created by command so the key never reaches Git:

```bash
kubectl apply -f kubernetes/namespace.yaml

kubectl create secret generic ai-backend-secret \
  -n ai-cloud-architect \
  --from-literal=GROQ_API_KEY=your_groq_api_key

kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/
```

Then open a tunnel to the frontend and browse to <http://localhost:5173>:

```bash
kubectl port-forward -n ai-cloud-architect svc/ai-frontend-service 5173:5173
```

| Object | Name | Notes |
|--------|------|-------|
| Namespace | `ai-cloud-architect` | |
| Deployment | `ai-backend-deployment` | 3 replicas, port 5000 |
| Deployment | `ai-frontend-deployment` | 2 replicas, port 5173 |
| Service | `ai-backend-service` | ClusterIP, 5000 |
| Service | `ai-frontend-service` | ClusterIP, 5173 |
| ConfigMap | `ai-backend-config`, `ai-frontend-config` | Non-sensitive settings |
| Secret | `ai-backend-secret` | `GROQ_API_KEY` |

## API

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `GET` | `/` | none | A JSON welcome message |
| `POST` | `/api/generate` | An infrastructure specification | `{ success, terraform }`, without the Terraform CLI check |
| `POST` | `/api/generate-from-prompt` | `{ "prompt": "..." }` | The specification, the HCL and the validation diagnostics |
| `POST` | `/api/generate-hcl` | `{ "prompt": "..." }` | `main.tf` as plain text |

Status codes: `400` for invalid input, `422` when the generated specification fails validation, `500` for unexpected errors such as a missing API key.

Example:

```bash
curl -X POST http://localhost:5000/api/generate-from-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a VPC with a public subnet and an EC2 instance reachable over HTTP"}'
```

```json
{
  "success": true,
  "prompt": "Create a VPC with a public subnet and an EC2 instance reachable over HTTP",
  "infrastructure": {
    "provider": "aws",
    "region": "eu-west-1",
    "resources": []
  },
  "terraform": "...",
  "validation": {
    "terraform": true,
    "diagnostics": [],
    "error": null
  }
}
```

A specification sent to `/api/generate` has this shape:

```json
{
  "provider": "aws",
  "region": "eu-west-1",
  "resources": [
    {
      "type": "vpc",
      "name": "main-vpc",
      "properties": { "cidrBlock": "10.0.0.0/16" }
    },
    {
      "type": "subnet",
      "name": "public-subnet",
      "properties": {
        "cidrBlock": "10.0.1.0/24",
        "availabilityZone": "eu-west-1a",
        "vpc": "main-vpc",
        "mapPublicIpOnLaunch": true
      }
    }
  ]
}
```

Resources reference each other by `name`.

## Project structure

```text
.
├── docker-compose.yaml
├── dockerfiles/
│   ├── Dockerfile.ai-backend       # Node.js + Terraform CLI
│   └── Dockerfile.ai-frontend      # Vite dev server
├── frontend/                       # React UI
│   ├── src/App.jsx
│   └── vite.config.js              # /api proxy
├── kubernetes/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── deployments/
│   └── services/
└── server/
    ├── test-terraform-validation.js  # manual check of the Terraform CLI step
    └── src/
        ├── app.js                  # Express entry point
        ├── routes/
        ├── controllers/
        ├── schemas/                # Zod: prompt, LLM output, business rules
        ├── services/               # LLM call, generation, Terraform CLI validation
        ├── validators/             # checks between resources
        ├── generators/aws/         # one HCL generator per resource type
        └── utils/
```

## Current limitations

- Both containers run in development mode (nodemon and the Vite dev server).
- `terraform init` downloads the AWS provider on every request, so a generation can take a minute or more.
- The API has no authentication or rate limiting.
- AWS only, and routes can only target an internet gateway.
- There are no automated tests yet.

## Roadmap

- [x] Deterministic Terraform generation for seven AWS resource types
- [x] Schema and dependency validation
- [x] Natural-language input with structured LLM output
- [x] Terraform CLI validation with diagnostics
- [x] React interface: prompt editor, Terraform and JSON views
- [x] Docker images and Docker Compose
- [x] Kubernetes: namespace, deployments, services, ConfigMap, Secret
- [ ] Kubernetes: Ingress, health probes, resource limits
- [ ] Production images (no dev servers, cached Terraform provider)
- [ ] Security checks (Checkov, TFLint) and risky-rule detection
- [ ] Cost estimation (Infracost)
- [ ] More AWS services (NAT gateway, RDS, load balancers, IAM)
- [ ] Other cloud providers