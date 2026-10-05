import { useState } from "react";
import {
  Cloud,
  Sparkles,
  Send,
  Copy,
  Check,
  Code2,
  Network,
  LoaderCircle,
  ShieldCheck,
  Server,
} from "lucide-react";

import "./App.css";

const examples = [
  "Create a public EC2 instance accessible through HTTP",
  "Create a VPC with a public subnet and an S3 bucket",
  "Create an AWS web server in eu-west-2 with HTTP access",
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("terraform");
  const [copied, setCopied] = useState(false);

  const generateInfrastructure = async () => {
    if (!prompt.trim()) {
      setError("Please describe the infrastructure you want to generate.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/generate-from-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Infrastructure generation failed."
        );
      }

      setResult(data);
      setActiveTab("terraform");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyTerraform = async () => {
    if (!result?.terraform) return;

    await navigator.clipboard.writeText(result.terraform);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      generateInfrastructure();
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Cloud size={24} />
          </div>

          <div>
            <span className="brand-name">InfraMind</span>
            <span className="brand-tag">AI</span>
          </div>
        </div>

        <div className="navbar-status">
          <span className="status-dot"></span>
          AI IaC Generator
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <div className="hero-badge">
            <Sparkles size={15} />
            AI-powered Infrastructure as Code
          </div>

          <h1>
            Describe your infrastructure.
            <span> We'll build the Terraform.</span>
          </h1>

          <p>
            Turn natural-language cloud requirements into structured,
            validated AWS Infrastructure as Code.
          </p>
        </section>

        <section className="workspace">
          <div className="prompt-card">
            <div className="card-heading">
              <div>
                <span className="step-number">01</span>
                <h2>Describe your infrastructure</h2>
              </div>

              <span className="provider-badge">
                AWS
              </span>
            </div>

            <div className="prompt-wrapper">
              <textarea
                value={prompt}
                onChange={(event) =>
                  setPrompt(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Example: Create an AWS infrastructure in eu-west-2 with a VPC 10.0.0.0/16, a public subnet, an Internet Gateway, HTTP access and a t3.micro EC2 instance..."
                maxLength={3000}
              />

              <div className="prompt-footer">
                <span>
                  {prompt.length} / 3000
                </span>

                <span>
                  Ctrl + Enter to generate
                </span>
              </div>
            </div>

            <div className="examples">
              <span className="examples-title">
                Try an example
              </span>

              <div className="example-list">
                {examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <button
              className="generate-button"
              onClick={generateInfrastructure}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="spinner"
                  />
                  Designing infrastructure...
                </>
              ) : (
                <>
                  <Sparkles size={19} />
                  Generate Infrastructure
                  <Send size={17} />
                </>
              )}
            </button>
          </div>

          {!result && !loading && (
            <div className="empty-state">
              <div className="empty-icon">
                <Network size={34} />
              </div>

              <h3>Your infrastructure will appear here</h3>

              <p>
                Describe what you need and the AI architect will
                generate the infrastructure specification and
                Terraform code.
              </p>

              <div className="features">
                <div>
                  <Server size={18} />
                  AWS Resources
                </div>

                <div>
                  <ShieldCheck size={18} />
                  Validated
                </div>

                <div>
                  <Code2 size={18} />
                  Terraform HCL
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="generation-state">
              <div className="generation-animation">
                <Cloud size={34} />
              </div>

              <h3>Designing your infrastructure</h3>

              <p>
                The AI architect is translating your requirements
                into AWS resources.
              </p>

              <div className="progress-line">
                <span></span>
              </div>
            </div>
          )}

          {result && (
            <section className="result-card">
              <div className="result-header">
                <div>
                  <span className="step-number success">
                    ✓
                  </span>

                  <div>
                    <h2>Infrastructure generated</h2>
                    <p>
                      {result.infrastructure.resources.length} resources
                    </p>
                  </div>
                </div>

                {result.validation?.terraform && (
                  <span className="validated-badge">
                    <ShieldCheck size={15} />
                    Terraform Valid
                  </span>
                )}
              </div>

              <div className="tabs">
                <button
                  className={
                    activeTab === "terraform"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab("terraform")
                  }
                >
                  <Code2 size={16} />
                  Terraform
                </button>

                <button
                  className={
                    activeTab === "architecture"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab("architecture")
                  }
                >
                  <Network size={16} />
                  Infrastructure
                </button>
              </div>

              {activeTab === "terraform" && (
                <div className="code-panel">
                  <div className="code-toolbar">
                    <span>main.tf</span>

                    <button onClick={copyTerraform}>
                      {copied ? (
                        <>
                          <Check size={15} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={15} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <pre>
                    <code>{result.terraform}</code>
                  </pre>
                </div>
              )}

              {activeTab === "architecture" && (
                <div className="code-panel">
                  <div className="code-toolbar">
                    <span>infrastructure.json</span>
                  </div>

                  <pre>
                    <code>
                      {JSON.stringify(
                        result.infrastructure,
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>
              )}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;