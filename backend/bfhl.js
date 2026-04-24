const express = require("express");
const { USER_ID, EMAIL_ID, COLLEGE_ROLL_NUMBER } = require("./constants");

const router = express.Router();
// to make sure the node format is proper, we can be a bit strict since it is mandatory
function looksLikeNodeLink(text) {
  return /^[A-Z]->[A-Z]$/.test(text);
}

function hierarchyObj(nodeKey, downMap) {
  const kids = Array.from(downMap.get(nodeKey) || []).sort();
  const out = {};
  for (const k of kids) {
    out[k] = hierarchyObj(k, downMap);
  }
  return out;
}

function longestChainLen(startNode, downMap) {
  const kids = Array.from(downMap.get(startNode) || []);
  if (!kids.length) return 1;

  let m = 0;
  for (const k of kids) {
    const d = longestChainLen(k, downMap);
    if (d > m) m = d;
  }
  return m + 1;
}

function hasLoopInCluster(clusterNodes, downMap) {
  // following old school dfs method to detect the cylces in the graph
  const mark = new Map();
  for (const n of clusterNodes) mark.set(n, 0);

  function dfs(node) {
    mark.set(node, 1);
    for (const child of downMap.get(node) || []) {
      const s = mark.get(child) ?? 0;
      if (s === 1) return true;
      if (s === 0 && dfs(child)) return true;
    }
    mark.set(node, 2);
    return false;
  }

  for (const n of Array.from(clusterNodes).sort()) {
    if (mark.get(n) === 0 && dfs(n)) return true;
  }
  return false;
}

router.post("/", (req, res) => {
  const { data } = req.body || {};

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "must have { data: string[] } in the request body" });
  }

  const badRows = [];
  const repeatedLinks = new Set();
  const seenLinks = new Set();
  const firstParentFor = new Map();
  const acceptedLinks = [];

  for (const val of data) {
    const raw = typeof val === "string" ? val : String(val);
    const link = raw.trim();

    if (!looksLikeNodeLink(link)) {
      badRows.push(link);
      continue;
    }

    const [from, to] = link.split("->");

    if (from === to) {
      badRows.push(link);
      continue;
    }

    if (seenLinks.has(link)) {
      repeatedLinks.add(link);
      continue;
    }
    seenLinks.add(link);

    // business rule: if child already got a parent, keep first one and drop rest quietly
    if (firstParentFor.has(to) && firstParentFor.get(to) !== from) continue;

    firstParentFor.set(to, from);
    acceptedLinks.push([from, to]);
  }

  const downMap = new Map();
  const neighbors = new Map();
  const everyNode = new Set();
  const childSet = new Set();

  for (const [from, to] of acceptedLinks) {
    everyNode.add(from);
    everyNode.add(to);
    childSet.add(to);

    if (!downMap.has(from)) downMap.set(from, new Set());
    if (!downMap.has(to)) downMap.set(to, new Set());
    downMap.get(from).add(to);

    if (!neighbors.has(from)) neighbors.set(from, new Set());
    if (!neighbors.has(to)) neighbors.set(to, new Set());
    neighbors.get(from).add(to);
    neighbors.get(to).add(from);
  }

  const visited = new Set();
  const clusters = [];

  for (const start of Array.from(everyNode).sort()) {
    if (visited.has(start)) continue;

    const q = [start];
    const cluster = new Set();
    visited.add(start);

    while (q.length) {
      const node = q.shift();
      cluster.add(node);
      for (const nb of neighbors.get(node) || []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          q.push(nb);
        }
      }
    }
    clusters.push(cluster);
  }

  const hierarchies = [];
  let treeCount = 0;
  let cycleCount = 0;
  let topRoot = "";
  let topDepth = -1;

  for (const cluster of clusters) {
    const possibleRoots = Array.from(cluster)
      .filter((n) => !childSet.has(n))
      .sort();
    const root = possibleRoots.length
      ? possibleRoots[0]
      : Array.from(cluster).sort()[0];

    if (hasLoopInCluster(cluster, downMap)) {
      cycleCount++;
      hierarchies.push({ root, tree: {}, has_cycle: true });
      continue;
    }

    const tree = { [root]: hierarchyObj(root, downMap) };
    const depth = longestChainLen(root, downMap);
    treeCount++;

    if (
      depth > topDepth ||
      (depth === topDepth && (topRoot === "" || root < topRoot))
    ) {
      topDepth = depth;
      topRoot = root;
    }

    hierarchies.push({ root, tree, depth });
  }

  return res.json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: badRows,
    duplicate_edges: Array.from(repeatedLinks).sort(),
    summary: {
      total_trees: treeCount,
      total_cycles: cycleCount,
      largest_tree_root: topRoot,
    },
  });
});

module.exports = router;