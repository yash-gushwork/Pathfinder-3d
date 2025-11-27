import React, { useState, useEffect, useCallback, useRef } from 'react';
import GraphVisualizer from './components/GraphVisualizer';
import Controls from './components/Controls';
import { generateRandomGraph, runDijkstra, runAStar } from './services/graphUtils';
import { GraphData, AlgorithmType, VisitedStep, Node } from './types';

const INITIAL_NODE_COUNT = 200;

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set());
  
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
  const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());
  
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'FINISHED' | 'EXPLODED'>('IDLE');
  const [stats, setStats] = useState<{ cost: number; visitedCount: number } | null>(null);
  const [activeAlgo, setActiveAlgo] = useState<AlgorithmType>('DIJKSTRA');

  const [selectionMode, setSelectionMode] = useState<'START' | 'TARGET' | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null); // For camera tracking
  const [activeNodeFromId, setActiveNodeFromId] = useState<string | null>(null); // For camera direction
  const [explodedNodeId, setExplodedNodeId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const generateGraph = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const newGraph = generateRandomGraph(INITIAL_NODE_COUNT, 25);
    setGraphData(newGraph);
    
    // Pick random start and end points
    const startIdx = Math.floor(Math.random() * newGraph.nodes.length);
    let endIdx = Math.floor(Math.random() * newGraph.nodes.length);
    while (endIdx === startIdx) {
      endIdx = Math.floor(Math.random() * newGraph.nodes.length);
    }

    const startId = newGraph.nodes[startIdx].id;
    const endId = newGraph.nodes[endIdx].id;

    // Safety: Start and End cannot be bombs
    newGraph.nodes[startIdx].isBomb = false;
    newGraph.nodes[endIdx].isBomb = false;

    setStartNode(startId);
    setEndNode(endId);
    resetVisualization();
  }, []);

  const resetVisualization = () => {
    setVisitedNodes(new Set());
    setVisitedLinks(new Set());
    setPathNodes(new Set());
    setPathLinks(new Set());
    setStatus('IDLE');
    setStats(null);
    setActiveNodeId(null);
    setActiveNodeFromId(null);
    setExplodedNodeId(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    generateGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNodeClick = (node: Node) => {
    if (status === 'RUNNING') return;

    if (selectionMode === 'START') {
        // Ensure new start is not a bomb
        const updatedNodes = graphData.nodes.map(n => 
            n.id === node.id ? { ...n, isBomb: false } : n
        );
        setGraphData({ ...graphData, nodes: updatedNodes });
        setStartNode(node.id);
        setSelectionMode(null);
        resetVisualization();
    } else if (selectionMode === 'TARGET') {
        // Ensure new target is not a bomb
        const updatedNodes = graphData.nodes.map(n => 
            n.id === node.id ? { ...n, isBomb: false } : n
        );
        setGraphData({ ...graphData, nodes: updatedNodes });
        setEndNode(node.id);
        setSelectionMode(null);
        resetVisualization();
    }
  };

  const animateAlgorithm = (visitedHistory: VisitedStep[], path: string[], cost: number, explodedAt?: string | null) => {
    setStatus('RUNNING');
    let stepIndex = 0;
    
    // Animation Speed (ms) - Slower for smoother camera ride
    const SPEED = 300;

    timerRef.current = window.setInterval(() => {
      // 1. Handle Step
      if (stepIndex < visitedHistory.length) {
          const step = visitedHistory[stepIndex];
          setActiveNodeId(step.id); // Triggers camera travel
          setActiveNodeFromId(step.from);
          
          setVisitedNodes(prev => {
            const next = new Set(prev);
            next.add(step.id);
            return next;
          });

          if (step.from) {
            setVisitedLinks(prev => {
              const next = new Set(prev);
              next.add(`${step.from}-${step.id}`); 
              return next;
            });
          }
          stepIndex++;
          return;
      }

      // 2. Animation Complete
      if (timerRef.current) clearInterval(timerRef.current);

      // 3. Check for Explosion
      if (explodedAt) {
          setExplodedNodeId(explodedAt);
          setStatus('EXPLODED');
          setActiveNodeId(null);
          setActiveNodeFromId(null);
          return;
      }
        
      // 4. Success - Show Path
      const pNodes = new Set(path);
      const pLinks = new Set<string>();
      for (let i = 0; i < path.length - 1; i++) {
        pLinks.add(`${path[i]}-${path[i+1]}`);
      }
      setPathNodes(pNodes);
      setPathLinks(pLinks);
      setStats({ cost, visitedCount: visitedHistory.length });
      setStatus('FINISHED');
      setActiveNodeId(null); // Stop camera follow
      setActiveNodeFromId(null);

    }, SPEED); 
  };

  const handleRun = (algo: AlgorithmType) => {
    if (!startNode || !endNode) return;
    
    resetVisualization();
    setActiveAlgo(algo);

    setTimeout(() => {
      let result;
      if (algo === 'DIJKSTRA') {
        result = runDijkstra(graphData, startNode, endNode);
      } else {
        result = runAStar(graphData, startNode, endNode);
      }
      
      animateAlgorithm(result.visitedHistory, result.path, result.cost, result.explodedAt);
    }, 100);
  };

  return (
    <div className="w-screen h-screen bg-black">
      <Controls 
        onGenerate={generateGraph}
        onRun={handleRun}
        onReset={resetVisualization}
        nodeCount={graphData.nodes.length}
        isAnimating={status === 'RUNNING'}
        algorithmStatus={status}
        stats={stats}
        activeAlgo={activeAlgo}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        startNodeId={startNode}
        endNodeId={endNode}
      />
      
      <GraphVisualizer 
        data={graphData}
        startNodeId={startNode}
        endNodeId={endNode}
        visitedNodes={visitedNodes}
        visitedLinks={visitedLinks}
        pathNodes={pathNodes}
        pathLinks={pathLinks}
        onNodeClick={handleNodeClick}
        selectionMode={selectionMode}
        activeNodeId={activeNodeId}
        activeNodeFromId={activeNodeFromId}
        explodedNodeId={explodedNodeId}
      />
    </div>
  );
};

export default App;