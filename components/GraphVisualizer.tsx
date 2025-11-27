import React, { useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { GraphData, Node } from '../types';
import * as THREE from 'three';

interface GraphVisualizerProps {
  data: GraphData;
  startNodeId: string | null;
  endNodeId: string | null;
  visitedNodes: Set<string>;
  visitedLinks: Set<string>;
  pathNodes: Set<string>;
  pathLinks: Set<string>; 
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  data,
  startNodeId,
  endNodeId,
  visitedNodes,
  visitedLinks,
  pathNodes,
  pathLinks
}) => {
  const graphRef = useRef<any>(null);

  // Pre-process materials for performance
  const materials = useMemo(() => ({
    default: new THREE.MeshLambertMaterial({ color: '#334155', transparent: true, opacity: 0.8 }),
    start: new THREE.MeshPhongMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.8 }),
    end: new THREE.MeshPhongMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 }),
    visited: new THREE.MeshLambertMaterial({ color: '#eab308', transparent: true, opacity: 0.9 }),
    path: new THREE.MeshPhongMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 0.8 }),
  }), []);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        nodeLabel="id"
        nodeResolution={16}
        // CRITICAL: Disable physics simulation to keep nodes at generated x,y,z
        cooldownTicks={0}
        cooldownTime={0}
        warmupTicks={0}
        // Custom Node Object
        nodeThreeObject={(node: any) => {
          const n = node as Node;
          let material = materials.default;
          let geometry = new THREE.SphereGeometry(1.5); 

          if (n.id === startNodeId) {
            material = materials.start;
            geometry = new THREE.SphereGeometry(4);
          } else if (n.id === endNodeId) {
            material = materials.end;
            geometry = new THREE.SphereGeometry(4);
          } else if (pathNodes.has(n.id)) {
            material = materials.path;
             geometry = new THREE.SphereGeometry(2.5);
          } else if (visitedNodes.has(n.id)) {
            material = materials.visited;
            geometry = new THREE.SphereGeometry(2);
          }

          return new THREE.Mesh(geometry, material);
        }}
        // Link Styling
        linkWidth={(link: any) => {
           const id1 = `${link.source.id}-${link.target.id}`;
           const id2 = `${link.target.id}-${link.source.id}`;
           if (pathLinks.has(id1) || pathLinks.has(id2)) return 2;
           if (visitedLinks.has(id1) || visitedLinks.has(id2)) return 1; 
           return 0.1;
        }}
        linkColor={(link: any) => {
           const id1 = `${link.source.id}-${link.target.id}`;
           const id2 = `${link.target.id}-${link.source.id}`;
           if (pathLinks.has(id1) || pathLinks.has(id2)) return '#06b6d4';
           if (visitedLinks.has(id1) || visitedLinks.has(id2)) return '#eab308';
           return '#1e293b';
        }}
        linkDirectionalParticles={(link: any) => {
             const id1 = `${link.source.id}-${link.target.id}`;
             const id2 = `${link.target.id}-${link.source.id}`;
             if (pathLinks.has(id1) || pathLinks.has(id2)) return 3;
             return 0;
        }}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkOpacity={0.4}
        backgroundColor="#000000"
        showNavInfo={false}
      />
    </div>
  );
};

export default GraphVisualizer;
