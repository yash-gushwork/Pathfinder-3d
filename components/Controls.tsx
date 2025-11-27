import React from 'react';
import { RefreshCw, Play, Info, Settings2, SkipForward, MousePointer2, AlertTriangle, Bomb } from 'lucide-react';
import { AlgorithmType } from '../types';

interface ControlsProps {
  onGenerate: () => void;
  onRun: (algo: AlgorithmType) => void;
  onReset: () => void;
  nodeCount: number;
  isAnimating: boolean;
  algorithmStatus: 'IDLE' | 'RUNNING' | 'FINISHED' | 'EXPLODED';
  stats: { cost: number; visitedCount: number } | null;
  activeAlgo: AlgorithmType;
  selectionMode: 'START' | 'TARGET' | null;
  setSelectionMode: (mode: 'START' | 'TARGET' | null) => void;
  startNodeId: string | null;
  endNodeId: string | null;
}

const Controls: React.FC<ControlsProps> = ({
  onGenerate,
  onRun,
  onReset,
  nodeCount,
  isAnimating,
  algorithmStatus,
  stats,
  activeAlgo,
  selectionMode,
  setSelectionMode,
  startNodeId,
  endNodeId
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 w-80 flex flex-col gap-4">
      {/* Main Panel */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-slate-700 shadow-2xl text-slate-100">
        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Pathfinder 3D
        </h1>
        <p className="text-xs text-slate-400 mb-6">Interactive Graph Algorithms</p>

        {/* Node Selection */}
        <div className="mb-6 space-y-3 border-b border-slate-700/50 pb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration</div>
          
          {/* Start Node */}
          <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 overflow-hidden">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0"></div>
               <div className="flex flex-col min-w-0">
                 <span className="text-[10px] text-slate-500 leading-none">Start Node</span>
                 <span className="text-xs font-mono text-slate-300 truncate">{startNodeId || 'None'}</span>
               </div>
            </div>
            <button 
              onClick={() => setSelectionMode(selectionMode === 'START' ? null : 'START')}
              disabled={isAnimating}
              className={`p-2 rounded-md transition-all ${selectionMode === 'START' ? 'bg-green-500 text-white shadow-lg shadow-green-900/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'}`}
              title="Click to select start node on graph"
            >
              <MousePointer2 size={14} />
            </button>
          </div>

          {/* Target Node (Blue) */}
          <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 overflow-hidden">
               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0"></div>
               <div className="flex flex-col min-w-0">
                 <span className="text-[10px] text-slate-500 leading-none">Target Node</span>
                 <span className="text-xs font-mono text-slate-300 truncate">{endNodeId || 'None'}</span>
               </div>
            </div>
            <button 
              onClick={() => setSelectionMode(selectionMode === 'TARGET' ? null : 'TARGET')}
              disabled={isAnimating}
              className={`p-2 rounded-md transition-all ${selectionMode === 'TARGET' ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'}`}
              title="Click to select target node on graph"
            >
              <MousePointer2 size={14} />
            </button>
          </div>

          {selectionMode && (
             <div className="text-[10px] text-center text-cyan-400 bg-cyan-950/30 py-1 rounded border border-cyan-900/50 animate-pulse">
                Select a node from the graph
             </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
             <button
              onClick={() => onRun('DIJKSTRA')}
              disabled={isAnimating || !startNodeId || !endNodeId}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeAlgo === 'DIJKSTRA' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-800 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Play size={16} /> Dijkstra
            </button>
            <button
              onClick={() => onRun('ASTAR')}
              disabled={isAnimating || !startNodeId || !endNodeId}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeAlgo === 'ASTAR' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-slate-800 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <SkipForward size={16} /> A* Star
            </button>
          </div>

          <button
            onClick={onGenerate}
            disabled={isAnimating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={16} /> Randomize Graph
          </button>
          
          <button
            onClick={onReset}
             disabled={isAnimating || algorithmStatus === 'IDLE'}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
          >
             Reset Visualization
          </button>
        </div>

        {/* Stats */}
        {algorithmStatus === 'EXPLODED' && (
          <div className="mt-6 p-4 bg-red-950/50 rounded-lg border border-red-500/50 animate-bounce">
            <h3 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">
              <AlertTriangle size={16} /> BOMB BLAST!
            </h3>
            <p className="text-xs text-red-200">The pathfinding algorithm hit a hidden bomb.</p>
          </div>
        )}

        {stats && algorithmStatus === 'FINISHED' && (
           <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Info size={14} /> Results
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-500">Path Cost</span>
                <span className="font-mono text-green-400">{stats.cost.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Nodes Visited</span>
                <span className="font-mono text-yellow-400">{stats.visitedCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl text-slate-100 text-xs">
        <h3 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Settings2 size={14} /> Legend
        </h3>
        <div className="grid grid-cols-2 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span>Start Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <span>Target Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
            <span>Shortest Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-3 h-3"><Bomb size={12} className="text-red-600" /></div>
            <span>Hidden Bomb</span>
          </div>
        </div>
         <div className="mt-3 text-[10px] text-slate-500 italic">
          * Left-click to rotate, Right-click to pan, Scroll to zoom.
        </div>
      </div>
    </div>
  );
};

export default Controls;
