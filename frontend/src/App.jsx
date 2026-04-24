import { useMemo, useState } from "react";
import "./App.css";

const SAMPLE = [
  "A->B",
  "A->C",
  "B->D",
  "C->E",
  "E->F",
  "X->Y",
  "Y->Z",
  "Z->X",
  "P->Q",
  "Q->R",
  "G->H",
  "G->I",
  "hello",
  "1->2",
  "A->>",
];

function App() {
  const [apiUrl, setApiUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:3000/bfhl"
  );
  const [rawInput, setRawInput] = useState(SAMPLE.join("\n"));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(0);
  const [endpointStatus, setEndpointStatus] = useState("idle");
  const [rootQuery, setRootQuery] = useState("");
  const [clusterMode, setClusterMode] = useState("all");
  const [copied, setCopied] = useState("");

  const parsedData = useMemo(
    () =>
      rawInput
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [rawInput]
  );

  async function runAnalysis() {
    if (!apiUrl.trim()) {
      setError("API endpoint is required.");
      return;
    }

    if (!parsedData.length) {
      setError("Add at least one entry before analyzing.");
      return;
    }

    setLoading(true);
    setError("");

    const start = performance.now();
    try {
      const response = await fetch(apiUrl.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: parsedData }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Request failed.");
      }

      setLatency(Math.round(performance.now() - start));
      setResult(payload);
      setCopied("");
    } catch (err) {
      setResult(null);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function pingApi() {
    if (!apiUrl.trim()) {
      setError("API endpoint is required before checking health.");
      return;
    }

    setEndpointStatus("checking");
    setError("");

    try {
      const response = await fetch(apiUrl.trim().replace(/\/bfhl\/?$/, "") + "/", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      setEndpointStatus("up");
    } catch {
      setEndpointStatus("down");
    }
  }

  async function copyRawJson() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied("json");
  }

  async function copyCurl() {
    const cmd = [
      `curl -X POST ${apiUrl.trim() || "http://localhost:3000/bfhl"}`,
      `  -H "Content-Type: application/json"`,
      `  -d '${JSON.stringify({ data: parsedData })}'`,
    ].join(" \\\n");
    await navigator.clipboard.writeText(cmd);
    setCopied("curl");
  }

  const visibleHierarchies = useMemo(() => {
    const all = result?.hierarchies || [];
    return all.filter((item) => {
      if (clusterMode === "tree" && item.has_cycle) return false;
      if (clusterMode === "cycle" && !item.has_cycle) return false;
      if (rootQuery.trim()) {
        return String(item.root || "")
          .toLowerCase()
          .includes(rootQuery.trim().toLowerCase());
      }
      return true;
    });
  }, [result, clusterMode, rootQuery]);

  const treeCount = useMemo(
    () => (result?.hierarchies || []).filter((h) => !h.has_cycle).length,
    [result]
  );
  const cycleCount = useMemo(
    () => (result?.hierarchies || []).filter((h) => h.has_cycle).length,
    [result]
  );

  function clearAll() {
    setRawInput("");
    setResult(null);
    setError("");
    setLatency(0);
  }

  return (
    <div className="page">
      <div className="float-shape float-shape-a" />
      <div className="float-shape float-shape-b" />

      <main className="shell">
        <header className="panel hero reveal">
          <p className="kicker">Tarunkumar S - Bajaj FS Frontend</p>
          <h1>Hierarchy Intelligence Console</h1>
          <p>
            Submit edge data to your BFHL endpoint and present a clear, structured,
            and fast response view for evaluators.
          </p>
        </header>

        <section className="panel controls reveal">
          <div className="top-rail">
            {/* <p className="mini-note">Evaluators love clarity and speed. This view is optimized for both.</p> */}
            <button className="btn btn-ghost" type="button" onClick={pingApi}>
              {endpointStatus === "checking"
                ? "Checking API..."
                : endpointStatus === "up"
                ? "API Online"
                : endpointStatus === "down"
                ? "API Unreachable"
                : "Check API Health"}
            </button>
          </div>

          <label className="field">
            <span>API Endpoint</span>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3000/bfhl"
            />
          </label>

          <label className="field">
            <span>Edge List</span>
            <textarea
              rows={8}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="A->B"
            />
          </label>

          <div className="action-row">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setRawInput(SAMPLE.join("\n"))}
            >
              Load Sample
            </button>
            <button className="btn btn-ghost" type="button" onClick={clearAll}>
              Clear
            </button>
            <button className="btn btn-ghost" type="button" onClick={copyCurl}>
              {copied === "curl" ? "Curl Copied" : "Copy Curl"}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={runAnalysis}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </section>

        <section className={`panel status ${error ? "status-error" : "status-ok"} reveal`}>
          {error
            ? `Request failed: ${error}`
            : loading
            ? "Running analysis..."
            : "Ready to analyze. Use sample data or paste your own."}
        </section>

        {result && (
          <section className="result-grid reveal">
            <div className="metric-row">
              <Metric label="Total Trees" value={result.summary?.total_trees ?? 0} />
              <Metric label="Total Cycles" value={result.summary?.total_cycles ?? 0} />
              <Metric
                label="Largest Tree Root"
                value={result.summary?.largest_tree_root || "-"}
              />
              <Metric label="Latency" value={`${latency} ms`} />
            </div>

            <div className="panel filter-strip">
              <div className="filter-tabs">
                <button
                  type="button"
                  className={`tab-btn ${clusterMode === "all" ? "tab-active" : ""}`}
                  onClick={() => setClusterMode("all")}
                >
                  All ({(result.hierarchies || []).length})
                </button>
                <button
                  type="button"
                  className={`tab-btn ${clusterMode === "tree" ? "tab-active" : ""}`}
                  onClick={() => setClusterMode("tree")}
                >
                  Trees ({treeCount})
                </button>
                <button
                  type="button"
                  className={`tab-btn ${clusterMode === "cycle" ? "tab-active" : ""}`}
                  onClick={() => setClusterMode("cycle")}
                >
                  Cycles ({cycleCount})
                </button>
              </div>

              <label className="root-search">
                <span>Find root</span>
                <input
                  type="text"
                  value={rootQuery}
                  placeholder="Type root label"
                  onChange={(e) => setRootQuery(e.target.value)}
                />
              </label>
            </div>

            <div className="panel split-panel">
              <div>
                <h2>Invalid Entries</h2>
                <ChipList items={result.invalid_entries || []} emptyText="None" />
              </div>
              <div>
                <h2>Duplicate Edges</h2>
                <ChipList items={result.duplicate_edges || []} emptyText="None" />
              </div>
            </div>

            <div className="panel">
              <div className="hierarchy-title-row">
                <h2>Hierarchies</h2>
                <button className="btn btn-ghost small" type="button" onClick={copyRawJson}>
                  {copied === "json" ? "JSON Copied" : "Copy JSON"}
                </button>
              </div>
              <div className="hierarchy-grid">
                {visibleHierarchies.map((item, index) => (
                  <details
                    className="hierarchy-card"
                    key={`${item.root}-${index}`}
                    open={index < 2}
                  >
                    <summary className="hierarchy-head">
                      <span className="tag tag-root">Root {item.root}</span>
                      {item.has_cycle ? (
                        <span className="tag tag-cycle">Cycle</span>
                      ) : (
                        <span className="tag tag-depth">Depth {item.depth}</span>
                      )}
                    </summary>
                    {item.has_cycle ? (
                      <p className="muted">Cycle detected. Tree omitted by API rule.</p>
                    ) : (
                      <TreeView node={item.tree || {}} />
                    )}
                  </details>
                ))}

                {!visibleHierarchies.length && (
                  <p className="muted">No hierarchy matches this filter.</p>
                )}
              </div>
            </div>

            <details className="panel json-panel">
              <summary>Raw API Response</summary>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <article className="metric">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{String(value)}</p>
    </article>
  );
}

function ChipList({ items, emptyText }) {
  if (!items.length) {
    return <p className="muted">{emptyText}</p>;
  }

  return (
    <div className="chip-list">
      {items.map((item, i) => (
        <span className="chip" key={`${item}-${i}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function TreeView({ node }) {
  const roots = Object.keys(node);
  if (!roots.length) {
    return <p className="muted">No tree data.</p>;
  }

  return (
    <ul className="tree">
      {roots.map((root) => (
        <TreeNode key={root} label={root} childrenNode={node[root]} />
      ))}
    </ul>
  );
}

function TreeNode({ label, childrenNode }) {
  const children = Object.keys(childrenNode || {});

  return (
    <li>
      <span className="node-pill">{label}</span>
      {children.length > 0 && (
        <ul className="tree">
          {children.map((child) => (
            <TreeNode key={child} label={child} childrenNode={childrenNode[child]} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default App;
