export interface Node {
  id: string;
  x: number;
  y: number;
  z: number;
  // Fixed coordinates for ForceGraph engine to prevent simulation movement
  fx?: number;
  fy?: number;
  fz?: number;
  // Visual state properties
  color?: string;
  val?: number; // Size
  isStart?: boolean;
  isEnd?: boolean;
  isBomb?: boolean;
}

export interface Link {
  source: string | Node;
  target: string | Node;
  distance: number; // Edge weight
  color?: string;
  width?: number;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface VisitedStep {
  id: string;
  from: string | null;
}

export interface AlgoResult {
  path: string[];
  visitedHistory: VisitedStep[];
  cost: number;
  explodedAt?: string | null;
}

export type AlgorithmType = 'DIJKSTRA' | 'ASTAR';

export interface PriorityQueueItem {
  id: string;
  priority: number;
}