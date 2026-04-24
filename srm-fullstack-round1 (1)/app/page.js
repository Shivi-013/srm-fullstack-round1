"use client";

import { useState } from "react";
import styles from "./page.module.css";

// ── Tree renderer ─────────────────────────────────────────────────────────────
function TreeLines({ obj, prefix = "", isRoot = true }) {
  const keys = Object.keys(obj);
  if (!keys.length) return null;

  return (
    <>
      {keys.map((key, i) => {
        const last = i === keys.length - 1;
        const connector = isRoot ? "" : last ? "└─ " : "├─ ";
        const childPrefix = isRoot ? "" : prefix + (last ? "   " : "│  ");
        const hasChildren = Object.keys(obj[key]).length > 0;
        return (
          <span key={key}>
            <span className={styles.treeLine}>
              {prefix}
              {connector}
              <span className={hasChildren ? styles.treeNode : styles.treeLeaf}>{key}</span>
            </span>
            {"\n"}
            <TreeLines obj={obj[key]} prefix={childPrefix} isRoot={false} />
          </span>
        );
      })}
    </>
  );
}

// ── Hierarchy card ────────────────────────────────────────────────────────────
function HierCard({ h, index }) {
  const isCycle = !!h.has_cycle;
  return (
    <div
      className={`${styles.hierCard} ${isCycle ? styles.cycleCard : ""}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className={styles.hierHeader}>
        <span className={`${styles.rootLabel} ${isCycle ? styles.rootOrange : ""}`}>{h.root}</span>
        <span className={`${styles.badge} ${isCycle ? styles.badgeCycle : styles.badgeTree}`}>
          {isCycle ? "CYCLE" : "TREE"}
        </span>
      </div>
      {!isCycle && (
        <p className={styles.depthRow}>
          depth <span className={styles.depthVal}>{h.depth}</span>
        </p>
      )}
      <div className={styles.treeBox}>
        {isCycle ? (
          <span className={styles.cycleMsg}>⟳ Cycle detected — no tree structure</span>
        ) : (
          <pre className={styles.treePre}>
            <TreeLines obj={h.tree} />
          </pre>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
const EXAMPLE =
  "A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->";

export default function Home() {
  const [input, setInput]     = useState(EXAMPLE);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  async function submit() {
    setError("");
    setResult(null);

    const data = input
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (!data.length) { setError("Please enter at least one node string."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.wrap}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoMark}>BF</div>
        <div>
          <h1 className={styles.title}>
            BFHL <span className={styles.titleAccent}>Tree Explorer</span>
          </h1>
          <p className={styles.subtitle}>SRM Full Stack Challenge · Round 1 · POST /api/bfhl</p>
        </div>
      </header>

      {/* Input */}
      <div className={styles.card}>
        <label className={styles.label} htmlFor="nodeInput">Node Strings</label>
        <textarea
          id="nodeInput"
          className={styles.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="A->B, A->C, B->D ..."
          rows={5}
        />
        <p className={styles.hint}>
          Comma or newline-separated. Valid format: <code className={styles.code}>X-&gt;Y</code> (single uppercase letters).
        </p>
        <button className={styles.submitBtn} onClick={submit} disabled={loading}>
          {loading && <span className={styles.spinner} />}
          {loading ? "Analysing…" : "Run Analysis"}
        </button>
      </div>

      {/* Error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Results */}
      {result && (
        <div className={styles.results}>

          {/* Identity */}
          <p className={styles.sectionTitle}>Identity</p>
          <div className={styles.identityGrid}>
            {[
              { k: "User ID",       v: result.user_id },
              { k: "Email",         v: result.email_id },
              { k: "Roll Number",   v: result.college_roll_number },
            ].map(f => (
              <div key={f.k} className={styles.idChip}>
                <div className={styles.idKey}>{f.k}</div>
                <div className={styles.idVal}>{f.v}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <p className={styles.sectionTitle}>Summary</p>
          <div className={styles.summaryGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{result.summary.total_trees}</span>
              <span className={styles.statDesc}>Valid Trees</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNum} ${styles.orange}`}>{result.summary.total_cycles}</span>
              <span className={styles.statDesc}>Cyclic Groups</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNum} ${styles.blue}`}>
                {result.summary.largest_tree_root || "—"}
              </span>
              <span className={styles.statDesc}>Deepest Tree Root</span>
            </div>
          </div>

          {/* Hierarchies */}
          <p className={styles.sectionTitle}>Hierarchies</p>
          <div className={styles.hierGrid}>
            {result.hierarchies.map((h, i) => (
              <HierCard key={h.root} h={h} index={i} />
            ))}
          </div>

          {/* Invalid entries */}
          {result.invalid_entries?.length > 0 && (
            <>
              <p className={styles.sectionTitle}>Invalid Entries</p>
              <div className={styles.tagList}>
                {result.invalid_entries.map(v => (
                  <span key={v} className={`${styles.tag} ${styles.tagInvalid}`}>{v}</span>
                ))}
              </div>
            </>
          )}

          {/* Duplicate edges */}
          {result.duplicate_edges?.length > 0 && (
            <>
              <p className={styles.sectionTitle}>Duplicate Edges</p>
              <div className={styles.tagList}>
                {result.duplicate_edges.map(v => (
                  <span key={v} className={`${styles.tag} ${styles.tagDup}`}>{v}</span>
                ))}
              </div>
            </>
          )}

          {/* Raw JSON */}
          <button className={styles.rawToggle} onClick={() => setShowRaw(p => !p)}>
            {showRaw ? "▼" : "▶"} Raw JSON Response
          </button>
          {showRaw && (
            <pre className={styles.rawJson}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </main>
  );
}
