import React, { useState, useEffect, useCallback, useRef } from 'react';
import GraphVisualizer from './components/GraphVisualizer';
import Controls from './components/Controls';
import { generateRandomGraph, runDijkstra, runAStar } from './services/graphUtils';
import { GraphData, AlgorithmType, VisitedStep } from './types';

const INITIAL_NODE_COUNT = 200; // Increased density

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set());
  
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
  const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());
  
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'FINISHED'>('IDLE');
  const [stats, setStats] = useState<{ cost: number; visitedCount: number } | null>(null);
  const [activeAlgo, setActiveAlgo] = useState<AlgorithmType>('DIJKSTRA');

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

    setStartNode(newGraph.nodes[startIdx].id);
    setEndNode(newGraph.nodes[endIdx].id);
    resetVisualization();
  }, []);

  const resetVisualization = () => {
    setVisitedNodes(new Set());
    setVisitedLinks(new Set());
    setPathNodes(new Set());
    setPathLinks(new Set());
    setStatus('IDLE');
    setStats(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    generateGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateAlgorithm = (visitedHistory: VisitedStep[], path: string[], cost: number) => {
    setStatus('RUNNING');
    let stepIndex = 0;
    
    // Slow motion: 40ms per step
    timerRef.current = window.setInterval(() => {
      if (stepIndex >= visitedHistory.length) {
        // Finish animation
        if (timerRef.current) clearInterval(timerRef.current);
        
        const pNodes = new Set(path);
        const pLinks = new Set<string>();
        for (let i = 0; i < path.length - 1; i++) {
          pLinks.add(`${path[i]}-${path[i+1]}`);
        }
        setPathNodes(pNodes);
        setPathLinks(pLinks);
        setStats({ cost, visitedCount: visitedHistory.length });
        setStatus('FINISHED');
        return;
      }

      const step = visitedHistory[stepIndex];
      
      setVisitedNodes(prev => {
        const next = new Set(prev);
        next.add(step.id);
        return next;
      });

      if (step.from) {
        setVisitedLinks(prev => {
          const next = new Set(prev);
          next.add(`${step.from}-${step.id}`); // Storing one direction is enough if visualizer checks both
          return next;
        });
      }

      stepIndex++;
    }, 40); 
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
      
      animateAlgorithm(result.visitedHistory, result.path, result.cost);
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
      />
      
      <GraphVisualizer 
        data={graphData}
        startNodeId={startNode}
        endNodeId={endNode}
        visitedNodes={visitedNodes}
        visitedLinks={visitedLinks}
        pathNodes={pathNodes}
        pathLinks={pathLinks}
      />
    </div>
  );
};

export default App;
