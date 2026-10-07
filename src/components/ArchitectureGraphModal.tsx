import React, { useState, useEffect } from 'react';
import { 
  Network, 
  X, 
  RefreshCw, 
  Activity, 
  Layers, 
  Zap, 
  Database, 
  Server, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Wifi,
  Laptop,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import type { ArchitectureTopology, GraphNode, GraphEdge } from '../types';

interface ArchitectureGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGraphModal: React.FC<ArchitectureGraphModalProps> = ({ isOpen, onClose }) => {
  const [topology, setTopology] = useState<ArchitectureTopology | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'local'>('all');

  const fetchTopology = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/architecture/graph');
      if (res.ok) {
        const data = await res.json();
        setTopology(data);
        if (data.nodes.length > 0 && !selectedNode) {
          setSelectedNode(data.nodes[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch architecture graph:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTopology();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rawNodes = topology?.nodes || [];
  const rawEdges = topology?.edges || [];
  const stats = topology?.stats || { totalNodes: 0, activeConnections: 0, healthyPercent: 100, crossNodeConnections: 0 };

  const nodes = viewFilter === 'local' ? rawNodes.filter((n) => !n.isRemote) : rawNodes;
  const edges = viewFilter === 'local' ? rawEdges.filter((e) => !e.isCrossNode) : rawEdges;

  const frontends = nodes.filter((n) => n.category === 'frontend');
  const backends = nodes.filter((n) => n.category === 'backend' || n.category === 'service');
  const dbs = nodes.filter((n) => n.category === 'database' || n.category === 'cache');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-6xl max-h-[90vh] rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hub px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-hub-primary">
                  Distributed Microservices Topology
                </h2>
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-500">
                  Team Mesh Live Graph
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Sơ đồ liên kết động giữa Web UI, Backend APIs và CSDL phân tán trên toàn bộ mạng lưới máy trạm trong công ty
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Scope Filter */}
            <div className="flex items-center gap-1 rounded-lg border border-hub bg-hub-card p-0.5 text-xs mr-2">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  viewFilter === 'all'
                    ? 'bg-[var(--hub-accent)] text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Toàn bộ Mesh ({rawNodes.length})
              </button>
              <button
                onClick={() => setViewFilter('local')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  viewFilter === 'local'
                    ? 'bg-[var(--hub-accent)] text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Chỉ máy này ({rawNodes.filter(n => !n.isRemote).length})
              </button>
            </div>

            <button
              onClick={fetchTopology}
              disabled={loading}
              className="fluent-btn-standard h-8 px-2.5 text-xs gap-1.5"
              title="Cập nhật topology"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>
            <button
              onClick={onClose}
              className="fluent-icon-btn h-8 w-8 text-hub-muted hover:text-hub-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-4 border-b border-hub bg-black/[0.01] dark:bg-white/[0.01] divide-x divide-hub px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2 px-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <span className="text-hub-muted">Tổng dịch vụ:</span>
            <strong className="text-hub-primary font-semibold">{stats.totalNodes} Nodes</strong>
          </div>
          <div className="flex items-center gap-2 px-4">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-hub-muted">Kết nối hoạt động:</span>
            <strong className="text-hub-primary font-semibold">{stats.activeConnections} / {edges.length} Active</strong>
          </div>
          <div className="flex items-center gap-2 px-4">
            <Wifi className="h-4 w-4 text-purple-500" />
            <span className="text-hub-muted">Liên kết Mesh chéo trạm:</span>
            <strong className="text-purple-600 dark:text-purple-400 font-semibold">{stats.crossNodeConnections || 0} Links</strong>
          </div>
          <div className="flex items-center gap-2 px-4">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span className="text-hub-muted">Tỷ lệ khả dụng:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.healthyPercent}% Healthy</strong>
          </div>
        </div>

        {/* Main Content: Graph Canvas + Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* Graph View Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-radial from-transparent to-black/[0.03] dark:to-white/[0.02]">
            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Network className="h-10 w-10 text-hub-muted opacity-40 mb-2" />
                <p className="text-xs text-hub-muted">Chưa phát hiện dịch vụ hoặc database nào trong hệ thống.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Client / Frontend Tier */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-hub">
                    <span className="text-[11px] font-bold uppercase text-hub-muted tracking-wider flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-blue-500" />
                      Client & Web UI ({frontends.length})
                    </span>
                  </div>
                  {frontends.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-hub text-center text-[11px] text-hub-muted">
                      Không có Frontend app
                    </div>
                  ) : (
                    frontends.map((node) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        onClick={() => setSelectedNode(node)}
                      />
                    ))
                  )}
                </div>

                {/* Column 2: Backend API Tier */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-hub">
                    <span className="text-[11px] font-bold uppercase text-hub-muted tracking-wider flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-purple-500" />
                      Backend APIs ({backends.length})
                    </span>
                  </div>
                  {backends.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-hub text-center text-[11px] text-hub-muted">
                      Không có Backend API
                    </div>
                  ) : (
                    backends.map((node) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        onClick={() => setSelectedNode(node)}
                      />
                    ))
                  )}
                </div>

                {/* Column 3: Database & Cache Tier */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-hub">
                    <span className="text-[11px] font-bold uppercase text-hub-muted tracking-wider flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-emerald-500" />
                      Databases & Caches ({dbs.length})
                    </span>
                  </div>
                  {dbs.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-hub text-center text-[11px] text-hub-muted">
                      Chưa cấu hình CSDL
                    </div>
                  ) : (
                    dbs.map((node) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        onClick={() => setSelectedNode(node)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Connection Edges Overview List */}
            {edges.length > 0 && (
              <div className="mt-8 rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-4">
                <h4 className="text-xs font-bold text-hub-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Ma Trận Liên Kết Trực Tuyến ({edges.length} Links)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {edges.map((edge) => {
                    const src = nodes.find((n) => n.id === edge.source);
                    const tgt = nodes.find((n) => n.id === edge.target);
                    const isActive = edge.status === 'active';
                    return (
                      <div
                        key={edge.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                          isActive
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-hub-primary'
                            : 'border-hub bg-hub-card text-hub-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-hub-primary truncate max-w-[110px]">
                            {src?.label || edge.source}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-hub-muted" />
                          <span className="font-semibold text-hub-primary truncate max-w-[110px]">
                            {tgt?.label || edge.target}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            edge.isCrossNode
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                              : 'bg-black/[0.04] dark:bg-white/[0.06] text-hub-muted'
                          }`}>
                            {edge.label}
                          </span>
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Node Inspector Side Panel */}
          {selectedNode && (
            <div className="w-80 border-l border-hub bg-hub-sidebar p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-hub-muted block mb-1">
                    Chi tiết Dịch Vụ
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedNode.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm text-hub-primary leading-tight">
                        {selectedNode.label}
                      </h3>
                      <span className="text-[11px] text-hub-muted">{selectedNode.subLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-hub pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-hub-muted">Trạm Làm Việc (Node):</span>
                    <span className="font-semibold text-hub-primary flex items-center gap-1">
                      {selectedNode.isRemote ? (
                        selectedNode.connectionType === 'lan' ? (
                          <Wifi className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Globe className="h-3 w-3 text-blue-500" />
                        )
                      ) : (
                        <Laptop className="h-3 w-3 text-sky-500" />
                      )}
                      <span>{selectedNode.nodeName || 'Local'}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-hub-muted">Phân loại Tier:</span>
                    <span className="font-semibold uppercase text-hub-primary">
                      {selectedNode.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-hub-muted">Cổng mạng (Port):</span>
                    <span className="font-mono font-semibold text-hub-primary">
                      :{selectedNode.port}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-hub-muted">Độ trễ phản hồi:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedNode.latencyMs !== undefined ? `${selectedNode.latencyMs} ms` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-hub-muted">Trạng thái:</span>
                    <span
                      className={`font-semibold capitalize ${
                        selectedNode.status === 'online'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {selectedNode.status}
                    </span>
                  </div>
                </div>

                {/* Related Connections */}
                <div className="border-t border-hub pt-3 space-y-2">
                  <span className="text-hub-muted font-semibold block text-[11px] uppercase">
                    Đường truyền liên quan:
                  </span>
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e) => {
                      const isSource = e.source === selectedNode.id;
                      const otherNodeId = isSource ? e.target : e.source;
                      const otherNode = nodes.find((n) => n.id === otherNodeId);
                      return (
                        <div
                          key={e.id}
                          className="rounded-lg border border-hub bg-hub-card p-2 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-hub-muted">{isSource ? 'Gửi tới' : 'Nhận từ'}:</span>
                            <span className="font-semibold text-hub-primary truncate max-w-[120px]">
                              {otherNode?.label || otherNodeId}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-hub-muted">
                            <span className={e.isCrossNode ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}>
                              {e.label}
                            </span>
                            <span className={e.status === 'active' ? 'text-emerald-500 font-semibold' : 'text-neutral-400'}>
                              {e.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NodeCard: React.FC<{
  node: GraphNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ node, isSelected, onClick }) => {
  const isOnline = node.status === 'online';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-3.5 transition-all text-xs ${
        isSelected
          ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/5 shadow-md ring-1 ring-[var(--hub-accent)]'
          : 'border-hub bg-hub-card hover:border-[var(--hub-accent)]/50 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{node.icon}</span>
          <span className="font-bold text-hub-primary text-xs truncate max-w-[130px]">{node.label}</span>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-neutral-500/10 text-neutral-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
          {node.status.toUpperCase()}
        </span>
      </div>

      {/* Workstation Badge */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-hub/60 text-[10px]">
        {node.isRemote ? (
          node.connectionType === 'lan' ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[140px]">
              <Wifi className="h-3 w-3 shrink-0" />
              <span className="truncate">{node.nodeName}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium truncate max-w-[140px]">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{node.nodeName}</span>
            </span>
          )
        ) : (
          <span className="flex items-center gap-1 text-hub-muted font-medium">
            <Laptop className="h-3 w-3" />
            <span>Máy này (Local)</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-hub-muted">
        <span className="font-mono bg-black/[0.04] dark:bg-white/[0.04] px-1.5 py-0.5 rounded font-semibold">
          :{node.port}
        </span>
        {node.latencyMs !== undefined && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {node.latencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
};
