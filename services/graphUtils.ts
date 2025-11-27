import { GraphData, Node, Link, AlgoResult, PriorityQueueItem, VisitedStep } from '../types';

// Helper to calculate Euclidean distance between two 3D points
const getDistance = (n1: Node, n2: Node) => {
  return Math.sqrt(
    Math.pow(n1.x - n2.x, 2) +
    Math.pow(n1.y - n2.y, 2) +
    Math.pow(n1.z - n2.z, 2)
  );
};

export const generateRandomGraph = (nodeCount: number = 200, connectionRadius: number = 30): GraphData => {
  const nodes: Node[] = [];
  const links: Link[] = [];

  // 1. Generate random nodes in a 3D space
  for (let i = 0; i < nodeCount; i++) {
    const x = Math.random() * 120 - 60;
    const y = Math.random() * 120 - 60;
    const z = Math.random() * 120 - 60;
    
    // 15% chance to be a bomb
    const isBomb = Math.random() < 0.15;

    nodes.push({
      id: `node-${i}`,
      x, 
      y, 
      z,
      // Important: Lock positions so the force engine doesn't move them
      fx: x,
      fy: y,
      fz: z,
      val: 1,
      isBomb
    });
  }

  // 2. Connect nodes that are close to each other
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = getDistance(nodes[i], nodes[j]);
      if (dist < connectionRadius) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          distance: dist, 
        });
      }
    }
  }

  return { nodes, links };
};

// Priority Queue implementation (Min Heap)
class PriorityQueue {
  items: PriorityQueueItem[];

  constructor() {
    this.items = [];
  }

  enqueue(id: string, priority: number) {
    this.items.push({ id, priority });
    this.items.sort((a, b) => a.priority - b.priority); 
  }

  dequeue(): PriorityQueueItem | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const buildAdjacencyList = (graph: GraphData) => {
  const adj: Record<string, { id: string; weight: number }[]> = {};
  graph.nodes.forEach(n => {
    adj[n.id] = [];
  });
  
  graph.links.forEach(l => {
    const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;

    if (adj[sourceId] && adj[targetId]) {
      adj[sourceId].push({ id: targetId, weight: l.distance });
      adj[targetId].push({ id: sourceId, weight: l.distance }); // Undirected
    }
  });
  return adj;
};

export const runDijkstra = (graph: GraphData, startId: string, endId: string): AlgoResult => {
  const adj = buildAdjacencyList(graph);
  const nodeMap = new Map<string, Node>();
  graph.nodes.forEach(n => nodeMap.set(n.id, n));

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visitedHistory: VisitedStep[] = [];
  const pq = new PriorityQueue();

  graph.nodes.forEach(n => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
  });

  distances[startId] = 0;
  pq.enqueue(startId, 0);

  const visitedSet = new Set<string>();

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;
    const { id: u } = current;

    if (visitedSet.has(u)) continue;
    visitedSet.add(u);

    visitedHistory.push({ id: u, from: previous[u] });

    // BOMB CHECK
    const currentNode = nodeMap.get(u);
    if (currentNode && currentNode.isBomb && u !== startId && u !== endId) {
      return { path: [], visitedHistory, cost: 0, explodedAt: u };
    }

    if (u === endId) break;

    if (adj[u]) {
      adj[u].forEach(neighbor => {
        const alt = distances[u] + neighbor.weight;
        if (alt < distances[neighbor.id]) {
          distances[neighbor.id] = alt;
          previous[neighbor.id] = u;
          pq.enqueue(neighbor.id, alt);
        }
      });
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = endId;
  
  if (distances[endId] === Infinity) {
    return { path: [], visitedHistory, cost: 0 };
  }

  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
    if (path.length > graph.nodes.length) break; 
  }

  if (path[0] !== startId) {
     return { path: [], visitedHistory, cost: 0 };
  }

  return { path, visitedHistory, cost: distances[endId] };
};

export const runAStar = (graph: GraphData, startId: string, endId: string): AlgoResult => {
  const adj = buildAdjacencyList(graph);
  const nodeMap = new Map<string, Node>();
  graph.nodes.forEach(n => nodeMap.set(n.id, n));

  const endNode = nodeMap.get(endId);
  if (!endNode) return { path: [], visitedHistory: [], cost: 0 };

  const heuristic = (id: string): number => {
    const n = nodeMap.get(id);
    if (!n) return 0;
    return getDistance(n, endNode);
  };

  const gScore: Record<string, number> = {}; 
  const fScore: Record<string, number> = {}; 
  const previous: Record<string, string | null> = {};
  const visitedHistory: VisitedStep[] = [];
  const pq = new PriorityQueue();

  graph.nodes.forEach(n => {
    gScore[n.id] = Infinity;
    fScore[n.id] = Infinity;
    previous[n.id] = null;
  });

  gScore[startId] = 0;
  fScore[startId] = heuristic(startId);
  pq.enqueue(startId, fScore[startId]);

  const visitedSet = new Set<string>();

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;
    const { id: u } = current;

    // BOMB CHECK
    const currentNode = nodeMap.get(u);
    if (currentNode && currentNode.isBomb && u !== startId && u !== endId) {
       visitedHistory.push({ id: u, from: previous[u] });
       return { path: [], visitedHistory, cost: 0, explodedAt: u };
    }

    if (u === endId) {
        visitedHistory.push({ id: u, from: previous[u] });
        break;
    }

    if (!visitedSet.has(u)) {
        visitedHistory.push({ id: u, from: previous[u] });
        visitedSet.add(u);
    }

    if (adj[u]) {
      adj[u].forEach(neighbor => {
        const tentativeG = gScore[u] + neighbor.weight;
        if (tentativeG < gScore[neighbor.id]) {
          previous[neighbor.id] = u;
          gScore[neighbor.id] = tentativeG;
          fScore[neighbor.id] = tentativeG + heuristic(neighbor.id);
          pq.enqueue(neighbor.id, fScore[neighbor.id]);
        }
      });
    }
  }

  const path: string[] = [];
  let curr: string | null = endId;
  
  if (gScore[endId] === Infinity) {
    return { path: [], visitedHistory, cost: 0 };
  }

  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
    if (path.length > graph.nodes.length) break;
  }

  if (path[0] !== startId) {
    return { path: [], visitedHistory, cost: 0 };
  }

  return { path, visitedHistory, cost: gScore[endId] };
};