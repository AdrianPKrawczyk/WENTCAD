import type { DuctNode, DuctSegment } from '../types';

export interface FlowCalculationResult {
  updatedNodes: Record<string, DuctNode>;
  updatedEdges: Record<string, DuctSegment>;
}

type AdjacencyMap = Map<string, string[]>;

function buildAdjacencyMap(
  nodes: Record<string, DuctNode>,
  edges: Record<string, DuctSegment>
): AdjacencyMap {
  const adjacency: AdjacencyMap = new Map();
  
  Object.keys(nodes).forEach(nodeId => {
    adjacency.set(nodeId, []);
  });
  
  Object.values(edges).forEach(edge => {
    const sourceEdges = adjacency.get(edge.sourceNodeId);
    const targetEdges = adjacency.get(edge.targetNodeId);
    
    if (sourceEdges) sourceEdges.push(edge.id);
    if (targetEdges) targetEdges.push(edge.id);
  });
  
  return adjacency;
}

function getConnectedNodeId(
  edge: DuctSegment,
  currentNodeId: string
): string {
  return edge.sourceNodeId === currentNodeId 
    ? edge.targetNodeId 
    : edge.sourceNodeId;
}

function isRootNode(node: DuctNode): boolean {
  return node.componentCategory === 'EQUIPMENT' || 
         node.componentCategory === 'VIRTUAL_ROOT';
}

function dfs(
  currentNodeId: string,
  incomingEdgeId: string | null,
  nodes: Record<string, DuctNode>,
  edges: Record<string, DuctSegment>,
  adjacency: AdjacencyMap,
  nodeFlows: Map<string, number>,
  edgeFlows: Map<string, number>,
  visitedEdges: Set<string>
): number {
  const node = nodes[currentNodeId];
  if (!node) return 0;
  
  if (node.componentCategory === 'TERMINAL') {
    const flow = node.flow || 0;
    nodeFlows.set(currentNodeId, flow);
    return flow;
  }
  
  const connectedEdgeIds = adjacency.get(currentNodeId) || [];
  let totalFlow = 0;
  
  for (const edgeId of connectedEdgeIds) {
    if (edgeId === incomingEdgeId) continue;
    if (visitedEdges.has(edgeId)) continue;
    
    visitedEdges.add(edgeId);
    
    const edge = edges[edgeId];
    if (!edge) continue;
    
    const nextNodeId = getConnectedNodeId(edge, currentNodeId);
    const branchFlow = dfs(
      nextNodeId,
      edgeId,
      nodes,
      edges,
      adjacency,
      nodeFlows,
      edgeFlows,
      visitedEdges
    );
    
    edgeFlows.set(edgeId, branchFlow);
    totalFlow += branchFlow;
    
    visitedEdges.delete(edgeId);
  }
  
  nodeFlows.set(currentNodeId, totalFlow);
  return totalFlow;
}

export function calculateNetworkFlows(
  nodes: Record<string, DuctNode>,
  edges: Record<string, DuctSegment>
): FlowCalculationResult {
  const updatedNodes: Record<string, DuctNode> = {};
  const updatedEdges: Record<string, DuctSegment> = {};
  
  Object.values(nodes).forEach(node => {
    updatedNodes[node.id] = { ...node };
  });
  
  Object.values(edges).forEach(edge => {
    updatedEdges[edge.id] = { ...edge };
  });
  
  const adjacency = buildAdjacencyMap(nodes, edges);
  
  const rootNodes = Object.values(nodes).filter(isRootNode);
  
  const processedEdges = new Set<string>();
  
  for (const rootNode of rootNodes) {
    const nodeFlows = new Map<string, number>();
    const edgeFlows = new Map<string, number>();
    const visitedEdges = new Set<string>();
    
    dfs(
      rootNode.id,
      null,
      nodes,
      edges,
      adjacency,
      nodeFlows,
      edgeFlows,
      visitedEdges
    );
    
    nodeFlows.forEach((flow, nodeId) => {
      if (updatedNodes[nodeId]) {
        updatedNodes[nodeId] = {
          ...updatedNodes[nodeId],
          flow
        };
      }
    });
    
    edgeFlows.forEach((flowRate, edgeId) => {
      if (updatedEdges[edgeId]) {
        updatedEdges[edgeId] = {
          ...updatedEdges[edgeId],
          flowRate
        };
      }
      processedEdges.add(edgeId);
    });
  }
  
  Object.keys(updatedEdges).forEach(edgeId => {
    if (!processedEdges.has(edgeId)) {
      updatedEdges[edgeId] = {
        ...updatedEdges[edgeId],
        flowRate: 0
      };
    }
  });
  
  return { updatedNodes, updatedEdges };
}

export function getNetworkRoots(nodes: Record<string, DuctNode>): DuctNode[] {
  return Object.values(nodes).filter(isRootNode);
}

export function getTerminals(nodes: Record<string, DuctNode>): DuctNode[] {
  return Object.values(nodes).filter(
    node => node.componentCategory === 'TERMINAL'
  );
}
