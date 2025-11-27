import React, { useRef, useMemo, useEffect } from 'react';
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
  onNodeClick: (node: Node) => void;
  selectionMode: 'START' | 'TARGET' | null;
  activeNodeId: string | null; // The node currently being visited in the animation
  activeNodeFromId: string | null; // The previous node in traversal, to calculate direction
  explodedNodeId: string | null; // If a bomb was hit
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  data,
  startNodeId,
  endNodeId,
  visitedNodes,
  visitedLinks,
  pathNodes,
  pathLinks,
  onNodeClick,
  selectionMode,
  activeNodeId,
  activeNodeFromId,
  explodedNodeId
}) => {
  const graphRef = useRef<any>(null);

  // Pre-process materials for performance
  const materials = useMemo(() => ({
    default: new THREE.MeshPhongMaterial({ color: '#334155', transparent: true, opacity: 0.9 }),
    start: new THREE.MeshPhongMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.8 }),
    // Changed end node to Blue (#3b82f6)
    end: new THREE.MeshPhongMaterial({ color: '#3b82f6', emissive: '#3b82f6', emissiveIntensity: 0.8 }),
    visited: new THREE.MeshPhongMaterial({ color: '#eab308', transparent: true, opacity: 0.9, emissive: '#eab308', emissiveIntensity: 0.2 }),
    path: new THREE.MeshPhongMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 0.8 }),
    bomb: new THREE.MeshPhongMaterial({ color: '#7f1d1d', emissive: '#dc2626', emissiveIntensity: 0.6 }),
    explosion: new THREE.MeshPhongMaterial({ color: '#fca5a5', emissive: '#ef4444', emissiveIntensity: 2, transparent: true, opacity: 0.8 }),
  }), []);

  // Ensure camera sees the graph when data loads
  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      // Slightly longer timeout to ensure engine has warmed up
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 10, (node: any) => true);
      }, 500);
    }
  }, [data]);

  // CAMERA TRAVEL LOGIC
  useEffect(() => {
    if (!graphRef.current || !activeNodeId) return;

    const node = data.nodes.find(n => n.id === activeNodeId);
    if (node) {
      // Configuration for the "Ride Along" view
      const distBehind = 50; 
      const heightAbove = 20;
      const transitionDuration = 300; // Match or slightly exceed App.tsx SPEED (300ms) for smoothness

      let targetPos = { x: node.x + distBehind, y: node.y + heightAbove, z: node.z + distBehind };
      let lookAtPos = { x: node.x, y: node.y, z: node.z };

      // If we have a 'from' node, we can calculate the direction vector
      // to position the camera "behind" the current node relative to travel
      if (activeNodeFromId) {
        const fromNode = data.nodes.find(n => n.id === activeNodeFromId);
        if (fromNode) {
          const dx = node.x - fromNode.x;
          const dy = node.y - fromNode.y;
          const dz = node.z - fromNode.z;
          const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
          
          if (len > 0.001) {
            // Normalized direction vector
            const ndx = dx / len;
            const ndy = dy / len;
            const ndz = dz / len;

            // Position camera BEHIND the node (minus direction)
            targetPos = {
              x: node.x - ndx * distBehind,
              y: node.y - ndy * distBehind + heightAbove, 
              // Fix: Override Y to be global up for stability
              z: node.z - ndz * distBehind
            };
            
            targetPos.y = node.y + heightAbove; 

            // Look slightly ahead of the node
            lookAtPos = {
              x: node.x + ndx * 20,
              y: node.y + ndy * 20,
              z: node.z + ndz * 20
            };
          }
        }
      } else {
        // Start Node Case: Just zoom in, maybe use current camera angle or default
        targetPos = { x: node.x + 40, y: node.y + 40, z: node.z + 40 };
      }

      graphRef.current.cameraPosition(
        targetPos, // New position
        lookAtPos, // Look at
        transitionDuration
      );
    }
  }, [activeNodeId, activeNodeFromId, data.nodes]);

  // Special Effect for Explosion
  useEffect(() => {
    if (explodedNodeId && graphRef.current) {
        const node = data.nodes.find(n => n.id === explodedNodeId);
        if(node) {
            // Zoom tight into the explosion
            graphRef.current.cameraPosition(
                { x: node.x + 20, y: node.y + 10, z: node.z + 20 },
                { x: node.x, y: node.y, z: node.z },
                300
            );
        }
    }
  }, [explodedNodeId, data.nodes]);

  // Helper to safely get node ID whether it's an object or string
  const getLinkId = (link: any) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return { id1: `${sourceId}-${targetId}`, id2: `${targetId}-${sourceId}` };
  };

  return (
    <div className={`w-full h-full bg-black relative overflow-hidden ${selectionMode ? 'cursor-crosshair' : 'cursor-move'}`}>
      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        nodeLabel="id"
        nodeResolution={16}
        onNodeClick={(node: any) => onNodeClick(node as Node)}
        // Added warmupTicks to ensure graph renders initially before cooldown stops it
        warmupTicks={50}
        cooldownTicks={0}
        // Custom Node Object
        nodeThreeObject={(node: any) => {
          const n = node as Node;
          let material: THREE.Material = materials.default;
          let geometry: THREE.BufferGeometry = new THREE.SphereGeometry(1.5); 

          // Explosion takes precedence
          if (n.id === explodedNodeId) {
             return new THREE.Mesh(new THREE.SphereGeometry(15), materials.explosion);
          }

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
          } else if (n.isBomb) {
            // Bomb visual: Spiky Icosahedron
            material = materials.bomb;
            geometry = new THREE.IcosahedronGeometry(2, 0); 
          }

          return new THREE.Mesh(geometry, material);
        }}
        // Link Styling
        linkWidth={(link: any) => {
           const { id1, id2 } = getLinkId(link);
           if (pathLinks.has(id1) || pathLinks.has(id2)) return 2;
           if (visitedLinks.has(id1) || visitedLinks.has(id2)) return 1; 
           return 0.2;
        }}
        linkColor={(link: any) => {
           const { id1, id2 } = getLinkId(link);
           if (pathLinks.has(id1) || pathLinks.has(id2)) return '#06b6d4';
           if (visitedLinks.has(id1) || visitedLinks.has(id2)) return '#eab308';
           return '#1e293b';
        }}
        linkDirectionalParticles={(link: any) => {
             const { id1, id2 } = getLinkId(link);
             if (pathLinks.has(id1) || pathLinks.has(id2)) return 3;
             return 0;
        }}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkOpacity={0.3}
        backgroundColor="#000000"
        showNavInfo={false}
      />
    </div>
  );
};

export default GraphVisualizer;
