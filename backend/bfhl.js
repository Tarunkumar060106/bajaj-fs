const express = require("express");
const {
  USER_ID,
  EMAIL_ID,
  COLLEGE_ROLL_NUMBER,
} = require("./constants");

const router = express.Router();

function isValidEdge(text) {
  return /^[A-Z]->[A-Z]$/.test(text);
}

function buildTree(root, childrenMap) {
  const children = Array.from(childrenMap.get(root) || []).sort();
  const treeNode = {};

  for (const child of children) {
    treeNode[child] = buildTree(child, childrenMap);
  }

  return treeNode;
}

function computeDepth(root, childrenMap) {
  const children = Array.from(childrenMap.get(root) || []);
  if (children.length === 0) {
    return 1;
  }

  let maxDepth = 0;
  for (const child of children) {
    maxDepth = Math.max(maxDepth, computeDepth(child, childrenMap));
  }

  return maxDepth + 1;
}

function componentHasCycle(nodes, childrenMap) {
  const state = new Map();
  for (const node of nodes) {
    state.set(node, 0);
  }

  function dfs(node) {
    state.set(node, 1);
    const children = Array.from(childrenMap.get(node) || []);

    for (const child of children) {
      const childState = state.get(child) || 0;
      if (childState === 1) {
        return true;
      }
      if (childState === 0 && dfs(child)) {
        return true;
      }
    }

    state.set(node, 2);
    return false;
  }

  for (const node of Array.from(nodes).sort()) {
    if (state.get(node) === 0 && dfs(node)) {
      return true;
    }
  }

  return false;
}

router.post("/", (req, res) => {
  const { data } = req.body || {};

  if (!Array.isArray(data)) {
    return res.status(400).json({
      error: "Request body must be of shape: { data: string[] }",
    });
  }

  const invalidEntries = [];
  const duplicateEdgesSet = new Set();
  const seenEdges = new Set();
  const childToParent = new Map();
  const acceptedEdges = [];

  for (const value of data) {
    const raw = typeof value === "string" ? value : String(value);
    const edgeText = raw.trim();

    if (!isValidEdge(edgeText)) {
      invalidEntries.push(edgeText);
      continue;
    }

    const [parent, child] = edgeText.split("->");
    if (parent === child) {
      invalidEntries.push(edgeText);
      continue;
    }

    if (seenEdges.has(edgeText)) {
      duplicateEdgesSet.add(edgeText);
      continue;
    }
    seenEdges.add(edgeText);

    const existingParent = childToParent.get(child);
    if (existingParent && existingParent !== parent) {
      continue;
    }

    childToParent.set(child, parent);
    acceptedEdges.push([parent, child]);
  }

  const childrenMap = new Map();
  const undirectedMap = new Map();
  const allNodes = new Set();
  const allChildren = new Set();

  for (const [parent, child] of acceptedEdges) {
    allNodes.add(parent);
    allNodes.add(child);
    allChildren.add(child);

    if (!childrenMap.has(parent)) {
      childrenMap.set(parent, new Set());
    }
    if (!childrenMap.has(child)) {
      childrenMap.set(child, new Set());
    }
    childrenMap.get(parent).add(child);

    if (!undirectedMap.has(parent)) {
      undirectedMap.set(parent, new Set());
    }
    if (!undirectedMap.has(child)) {
      undirectedMap.set(child, new Set());
    }
    undirectedMap.get(parent).add(child);
    undirectedMap.get(child).add(parent);
  }

  const components = [];
  const visited = new Set();

  for (const start of Array.from(allNodes).sort()) {
    if (visited.has(start)) {
      continue;
    }

    const queue = [start];
    const componentNodes = new Set();
    visited.add(start);

    while (queue.length > 0) {
      const node = queue.shift();
      componentNodes.add(node);

      for (const next of undirectedMap.get(node) || []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }

    components.push(componentNodes);
  }

  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let bestRoot = "";
  let bestDepth = -1;

  for (const nodes of components) {
    const roots = Array.from(nodes)
      .filter((node) => !allChildren.has(node))
      .sort();
    const root = roots.length > 0 ? roots[0] : Array.from(nodes).sort()[0];

    const hasCycle = componentHasCycle(nodes, childrenMap);
    if (hasCycle) {
      totalCycles += 1;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    const tree = {
      [root]: buildTree(root, childrenMap),
    };
    const depth = computeDepth(root, childrenMap);
    totalTrees += 1;

    if (
      depth > bestDepth ||
      (depth === bestDepth && (bestRoot === "" || root < bestRoot))
    ) {
      bestDepth = depth;
      bestRoot = root;
    }

    hierarchies.push({
      root,
      tree,
      depth,
    });
  }

  return res.json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: Array.from(duplicateEdgesSet).sort(),
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: bestRoot,
    },
  });
});

module.exports = router;
