// ── Identity — update these before deploying ─────────────────────────────────
export const USER_ID         = "johndoe_17091999";      // fullname_ddmmyyyy
export const EMAIL_ID        = "john.doe@srmist.edu.in";
export const COLLEGE_ROLL    = "21CS1001";

// ── Validation ───────────────────────────────────────────────────────────────
const EDGE_RE = /^([A-Z])->([A-Z])$/;

function validateEntry(raw) {
  const s = raw.trim();
  if (!s) return { valid: false };
  const m = s.match(EDGE_RE);
  if (!m) return { valid: false };
  const [, parent, child] = m;
  if (parent === child) return { valid: false }; // self-loop
  return { valid: true, parent, child, edge: `${parent}->${child}` };
}

// ── Union-Find ────────────────────────────────────────────────────────────────
function makeUF() {
  const p = {};
  function find(x) {
    if (p[x] === undefined) p[x] = x;
    if (p[x] !== x) p[x] = find(p[x]);
    return p[x];
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) p[ra] = rb;
  }
  return { find, union };
}

function groupNodes(edges) {
  const uf = makeUF();
  for (const { parent, child } of edges) uf.union(parent, child);

  const allNodes = new Set([...edges.map(e => e.parent), ...edges.map(e => e.child)]);
  const groups = {};
  for (const n of allNodes) {
    const r = uf.find(n);
    if (!groups[r]) groups[r] = new Set();
    groups[r].add(n);
  }
  return Object.values(groups);
}

// ── Cycle detection (DFS) ─────────────────────────────────────────────────────
function hasCycle(nodes, edgeMap) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  for (const n of nodes) color[n] = WHITE;

  function dfs(u) {
    color[u] = GRAY;
    for (const v of (edgeMap[u] ?? [])) {
      if (color[v] === GRAY) return true;
      if (color[v] === WHITE && dfs(v)) return true;
    }
    color[u] = BLACK;
    return false;
  }
  for (const n of nodes) {
    if (color[n] === WHITE && dfs(n)) return true;
  }
  return false;
}

// ── Tree construction ─────────────────────────────────────────────────────────
function buildTree(root, edgeMap) {
  const visited = new Set();
  function recurse(node) {
    visited.add(node);
    const obj = {};
    for (const child of (edgeMap[node] ?? [])) {
      if (!visited.has(child)) obj[child] = recurse(child);
    }
    return obj;
  }
  return { [root]: recurse(root) };
}

function calcDepth(node, edgeMap, visited = new Set()) {
  visited.add(node);
  let max = 0;
  for (const child of (edgeMap[node] ?? [])) {
    if (!visited.has(child)) max = Math.max(max, calcDepth(child, edgeMap, new Set(visited)));
  }
  return 1 + max;
}

// ── Main processor ────────────────────────────────────────────────────────────
export function processData(data) {
  const invalidEntries  = [];
  const duplicateEdges  = [];
  const seenEdges       = new Set();
  const childSet        = new Set(); // diamond rule: first parent wins
  const validEdges      = [];

  for (const raw of data) {
    const result = validateEntry(raw);
    if (!result.valid) {
      invalidEntries.push(raw.trim() === "" ? raw : raw.trim());
      continue;
    }
    const { parent, child, edge } = result;

    if (seenEdges.has(edge)) {
      if (!duplicateEdges.includes(edge)) duplicateEdges.push(edge);
      continue;
    }
    seenEdges.add(edge);

    // Diamond rule: silently discard if child already has a parent
    if (childSet.has(child)) continue;
    childSet.add(child);

    validEdges.push({ parent, child });
  }

  // Build adjacency map
  const edgeMap   = {};
  const allNodes  = new Set();
  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);
    if (!edgeMap[parent]) edgeMap[parent] = [];
    edgeMap[parent].push(child);
  }

  const groups = validEdges.length > 0 ? groupNodes(validEdges) : [];

  const hierarchies = groups.map((group) => {
    const nodes = [...group];

    const childrenInGroup = new Set(
      validEdges
        .filter(e => group.has(e.parent) || group.has(e.child))
        .map(e => e.child)
    );
    const roots = nodes.filter(n => !childrenInGroup.has(n)).sort();

    if (hasCycle(nodes, edgeMap)) {
      const root = nodes.sort()[0];
      return { root, tree: {}, has_cycle: true };
    }

    const root = roots.length > 0 ? roots[0] : nodes.sort()[0];
    const tree  = buildTree(root, edgeMap);
    const depth = calcDepth(root, edgeMap);
    return { root, tree, depth };
  });

  // Sort: trees first (by root), then cycles (by root)
  hierarchies.sort((a, b) => {
    if (a.has_cycle && !b.has_cycle) return 1;
    if (!a.has_cycle && b.has_cycle) return -1;
    return a.root.localeCompare(b.root);
  });

  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic    = hierarchies.filter(h =>  h.has_cycle);

  const largestTreeRoot = nonCyclic.length > 0
    ? [...nonCyclic].sort((a, b) => b.depth - a.depth || a.root.localeCompare(b.root))[0].root
    : "";

  return {
    user_id:              USER_ID,
    email_id:             EMAIL_ID,
    college_roll_number:  COLLEGE_ROLL,
    hierarchies,
    invalid_entries:      invalidEntries,
    duplicate_edges:      duplicateEdges,
    summary: {
      total_trees:       nonCyclic.length,
      total_cycles:      cyclic.length,
      largest_tree_root: largestTreeRoot,
    },
  };
}
