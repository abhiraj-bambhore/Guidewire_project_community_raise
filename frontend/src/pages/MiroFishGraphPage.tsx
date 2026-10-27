import React, { useState, useEffect, useRef } from 'react'
import * as api from '../api'

interface GraphNode {
  id: string
  name: string
  type: string
  category: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
  val: number
  attributes?: Record<string, string>
  summary?: string
}

interface GraphLink {
  source: string
  target: string
  label: string
}

const ENTITY_COLORS: Record<string, string> = {
  University: '#f97316',
  Entity: '#0055b8',
  Alumni: '#7c3aed',
  Organization: '#0d9488',
  Student: '#dc2626',
  Professor: '#ea580c',
  MediaOutlet: '#9333ea',
  Person: '#0284c7',
  GovernmentAgency: '#059669',
  NGO: '#16a34a',
}

export default function MiroFishGraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [showEdgeLabels, setShowEdgeLabels] = useState(true)
  const [selectedItem, setSelectedItem] = useState<{ type: 'node' | 'edge'; data: any } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [logs, setLogs] = useState<string[]>([
    '18:19:43.436 ✓ Ontology generated, project: proj_f95898d38529',
    '18:19:43.437 Starting graph build with Groq AI + MiroFish swarm...',
    '18:19:43.951 Graph build task started... Task: task_graph_1792759783437',
    '18:19:44.687 Graph initialized: 22 nodes, 31 relationships',
    '18:20:02.114 Swarm agent consensus synchronized with Supabase ledger',
  ])

  const svgRef = useRef<SVGSVGElement | null>(null)
  const draggingNodeRef = useRef<GraphNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Initial nodes generation
  useEffect(() => {
    loadGraph()
  }, [])

  function loadGraph() {
    setIsRefreshing(true)
    const width = 800
    const height = 620

    const initialNodes: GraphNode[] = [
      { id: 'n1', name: 'Wuhan University', type: 'University', category: 'University', color: ENTITY_COLORS.University, x: width * 0.45, y: height * 0.35, vx: 0, vy: 0, val: 28, summary: 'Lead educational institution with active student and alumni community' },
      { id: 'n2', name: 'University Hub Beta', type: 'University', category: 'University', color: ENTITY_COLORS.University, x: width * 0.22, y: height * 0.28, vx: 0, vy: 0, val: 24, summary: 'Regional campus node for community crowd incubation' },
      { id: 'n3', name: 'Alumni Investors Guild', type: 'Alumni', category: 'Alumni', color: ENTITY_COLORS.Alumni, x: width * 0.38, y: height * 0.22, vx: 0, vy: 0, val: 20, summary: 'Verified alumni backing student & local founder campaigns' },
      { id: 'n4', name: 'Bilibili Tech Stream', type: 'MediaOutlet', category: 'MediaOutlet', color: ENTITY_COLORS.MediaOutlet, x: width * 0.32, y: height * 0.52, vx: 0, vy: 0, val: 19, summary: 'Community streaming and social verification channel' },
      { id: 'n5', name: 'Zhihu Discourse', type: 'MediaOutlet', category: 'MediaOutlet', color: ENTITY_COLORS.MediaOutlet, x: width * 0.26, y: height * 0.68, vx: 0, vy: 0, val: 18, summary: 'Knowledge-sharing platform evaluating campaign viability' },
      { id: 'n6', name: 'Douyin Showcase', type: 'MediaOutlet', category: 'MediaOutlet', color: ENTITY_COLORS.MediaOutlet, x: width * 0.39, y: height * 0.74, vx: 0, vy: 0, val: 18, summary: 'Viral video channel driving customer footfall' },
      { id: 'n7', name: 'Crust & Crumb Sourdough', type: 'Entity', category: 'Entity', color: ENTITY_COLORS.Entity, x: width * 0.62, y: height * 0.38, vx: 0, vy: 0, val: 26, summary: 'Artisanal sourdough bakery raising community capital' },
      { id: 'n8', name: 'Zenith Creator Loft', type: 'Entity', category: 'Entity', color: ENTITY_COLORS.Entity, x: width * 0.72, y: height * 0.52, vx: 0, vy: 0, val: 24, summary: 'Podcast and broadcast media suites in Bengaluru' },
      { id: 'n9', name: 'Pulse CrossFit Arena', type: 'Entity', category: 'Entity', color: ENTITY_COLORS.Entity, x: width * 0.58, y: height * 0.64, vx: 0, vy: 0, val: 25, summary: 'Functional fitness and athletic conditioning arena' },
      { id: 'n10', name: 'Guidewire PolicyCenter', type: 'Organization', category: 'Organization', color: ENTITY_COLORS.Organization, x: width * 0.52, y: height * 0.18, vx: 0, vy: 0, val: 29, summary: 'Underwriting and commercial peril insurance engine' },
      { id: 'n11', name: 'Guidewire ClaimCenter', type: 'Organization', category: 'Organization', color: ENTITY_COLORS.Organization, x: width * 0.68, y: height * 0.22, vx: 0, vy: 0, val: 27, summary: 'Automated adjustor FNOL and loss indemnity settlement' },
      { id: 'n12', name: 'Student Backer Cohort', type: 'Student', category: 'Student', color: ENTITY_COLORS.Student, x: width * 0.48, y: height * 0.82, vx: 0, vy: 0, val: 18, summary: 'Campus micro-investors pledging ₹1,000 to ₹5,000' },
      { id: 'n13', name: 'Professor Lead Sponsor', type: 'Professor', category: 'Professor', color: ENTITY_COLORS.Professor, x: width * 0.15, y: height * 0.48, vx: 0, vy: 0, val: 21, summary: 'Faculty advisor and cornerstone campaign guarantor' },
      { id: 'n14', name: 'Third-party Auditor', type: 'Entity', category: 'Entity', color: ENTITY_COLORS.Entity, x: width * 0.12, y: height * 0.72, vx: 0, vy: 0, val: 18, summary: 'Independent escrow verification and safety checker' },
    ]

    const initialLinks: GraphLink[] = [
      { source: 'n1', target: 'n3', label: 'AFFILIATED_WITH' },
      { source: 'n3', target: 'n1', label: 'ADVOCATES_FOR' },
      { source: 'n1', target: 'n4', label: 'RELATES_TO' },
      { source: 'n4', target: 'n5', label: 'CONTRIBUTES_TO_PROPAGATION_CHAIN' },
      { source: 'n5', target: 'n6', label: 'EXHIBITS_BEHAVIOR' },
      { source: 'n1', target: 'n7', label: 'SUPPORTS' },
      { source: 'n7', target: 'n10', label: 'UNDERWRITES' },
      { source: 'n7', target: 'n11', label: 'CLAIMS_FILED' },
      { source: 'n8', target: 'n10', label: 'UNDERWRITES' },
      { source: 'n9', target: 'n10', label: 'UNDERWRITES' },
      { source: 'n1', target: 'n12', label: 'AFFECTS_DONATION_INTENT' },
      { source: 'n12', target: 'n7', label: 'BUYS_SHARES' },
      { source: 'n12', target: 'n9', label: 'INVESTS_IN' },
      { source: 'n13', target: 'n2', label: 'WORKS_FOR' },
      { source: 'n13', target: 'n4', label: 'COMMENTS_ON' },
      { source: 'n14', target: 'n5', label: 'CONTRADICTED_BY' },
      { source: 'n2', target: 'n3', label: 'RELATES_TO' },
      { source: 'n3', target: 'n7', label: 'INVESTS_IN' },
      { source: 'n6', target: 'n8', label: 'DRIVES_FOOTFALL' },
      { source: 'n10', target: 'n11', label: 'SYNC_RESERVES' },
    ]

    setNodes(initialNodes)
    setLinks(initialLinks)

    setTimeout(() => {
      setIsRefreshing(false)
      addLog(`Graph refreshed: ${initialNodes.length} nodes, ${initialLinks.length} edges active`)
    }, 600)
  }

  function addLog(msg: string) {
    const time = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100)
    setLogs(prev => [ `${time} ${msg}`, ...prev.slice(0, 15) ])
  }

  // Live simulation tick - every 4 seconds subtle updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live customer activity
      const actions = [
        'New customer trade: +100 shares bought by Alumni Agent',
        'MiroFish Swarm: Updated sentiment to 64% Bullish',
        'Guidewire PolicyCenter: Continuous peril hazard scan completed (Class A)',
        'Node relation edge reinforced: Wuhan University → Crust & Crumb Sourdough',
      ]
      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      addLog(randomAction)

      // Slight physics perturbation
      setNodes(prev => prev.map(n => ({
        ...n,
        x: n.x + (Math.random() - 0.5) * 1.5,
        y: n.y + (Math.random() - 0.5) * 1.5,
      })))
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  // Drag interaction
  const handleMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    draggingNodeRef.current = node
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeRef.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setNodes(prev =>
      prev.map(n =>
        n.id === draggingNodeRef.current?.id ? { ...n, x: mouseX, y: mouseY } : n
      )
    )
  }

  const handleMouseUp = () => {
    draggingNodeRef.current = null
  }

  const entityTypesLegend = [
    { name: 'University', color: ENTITY_COLORS.University },
    { name: 'Entity', color: ENTITY_COLORS.Entity },
    { name: 'Alumni', color: ENTITY_COLORS.Alumni },
    { name: 'Organization', color: ENTITY_COLORS.Organization },
    { name: 'Student', color: ENTITY_COLORS.Student },
    { name: 'Professor', color: ENTITY_COLORS.Professor },
  ]

  const generatedEntities = ['University', 'Student', 'Professor', 'Alumni', 'MediaOutlet', 'GovernmentAgency', 'NGO', 'Person', 'Organization']
  const generatedRelations = ['COMMENTS_ON', 'RESPONDS_TO', 'SUPPORTS', 'OPPOSES', 'AFFILIATED_WITH', 'WORKS_FOR', 'INVESTS_IN', 'BUYS_SHARES', 'CLAIMS_FILED']

  return (
    <div className={`page ${isMaximized ? 'page-wide' : ''}`} style={{ maxWidth: isMaximized ? '100%' : '1420px', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28, marginBottom: 4 }}>MiroFish Swarm &amp; Customer Interaction Graph</h1>
          <p className="page-subtitle" style={{ fontSize: 14 }}>
            Multi-agent knowledge graph visualizing customer funding, community relations, and Guidewire institutional ties in real time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadGraph} disabled={isRefreshing}>
            <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }}>↻</span> Refresh Graph
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsMaximized(!isMaximized)}>
            {isMaximized ? '⊠ Normal View' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Workbench matching Screenshot */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMaximized ? '1fr 420px' : '1.3fr 1fr',
        gap: 20,
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        minHeight: 680,
      }}>
        {/* Left Pane: Interactive D3-Style Canvas */}
        <div style={{
          position: 'relative',
          background: '#f8fafc',
          backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Top Bar inside Left Pane */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
          }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0d233a', letterSpacing: '-0.2px' }}>
              Graph Relationship Visualization
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={loadGraph}
                style={{ padding: '4px 10px', fontSize: 12, height: 28 }}
              >
                ↻ Refresh
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsMaximized(!isMaximized)}
                style={{ padding: '4px 8px', fontSize: 12, height: 28 }}
              >
                ⛶
              </button>
              {/* Show edge labels toggle switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--text-strong)' }}>
                <input
                  type="checkbox"
                  checked={showEdgeLabels}
                  onChange={e => setShowEdgeLabels(e.target.checked)}
                  style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                />
                Show Edge Labels
              </label>
            </div>
          </div>

          {/* Floating Pill Badge: Updating in real-time... */}
          <div style={{
            position: 'absolute',
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            zIndex: 10,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            Updating in real-time...
          </div>

          {/* SVG Canvas for Graph */}
          <svg
            ref={svgRef}
            style={{ width: '100%', height: '100%', minHeight: 600, cursor: draggingNodeRef.current ? 'grabbing' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
              </marker>
            </defs>

            {/* Links / Edges */}
            {links.map((link, idx) => {
              const srcNode = nodes.find(n => n.id === link.source)
              const tgtNode = nodes.find(n => n.id === link.target)
              if (!srcNode || !tgtNode) return null

              const midX = (srcNode.x + tgtNode.x) / 2
              const midY = (srcNode.y + tgtNode.y) / 2

              return (
                <g key={idx} onClick={() => setSelectedItem({ type: 'edge', data: { ...link, srcName: srcNode.name, tgtName: tgtNode.name } })} style={{ cursor: 'pointer' }}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke="#cbd5e1"
                    strokeWidth="1.6"
                    markerEnd="url(#arrow)"
                  />
                  {showEdgeLabels && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-45"
                        y="-10"
                        width="90"
                        height="20"
                        rx="4"
                        fill="#ffffff"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))' }}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill="#475569"
                        letterSpacing="0.2px"
                      >
                        {link.label.length > 14 ? link.label.slice(0, 13) + '…' : link.label}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* Nodes */}
            {nodes.map(node => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={e => handleMouseDown(e, node)}
                onClick={() => setSelectedItem({ type: 'node', data: node })}
                style={{ cursor: 'grab' }}
              >
                {/* Node halo glow */}
                <circle r={node.val + 4} fill={node.color} opacity="0.15" />
                {/* Node main circle */}
                <circle
                  r={node.val}
                  fill={node.color}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.15))' }}
                />
                {/* Node label */}
                <text
                  x={node.val + 8}
                  y="4"
                  fontSize="11.5"
                  fontWeight="700"
                  fill="#1e293b"
                  style={{ textShadow: '0 1px 2px rgba(255,255,255,0.9)', pointerEvents: 'none' }}
                >
                  {node.name.length > 16 ? node.name.slice(0, 15) + '…' : node.name}
                </text>
              </g>
            ))}
          </svg>

          {/* Floating Entity Types Legend (Bottom-Left matching Image 4) */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            zIndex: 10,
            minWidth: 260,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#e11d48', letterSpacing: '0.6px', marginBottom: 10 }}>
              ENTITY TYPES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
              {entityTypesLegend.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Item Inspector Modal / Drawer */}
          {selectedItem && (
            <div style={{
              position: 'absolute',
              top: 70,
              right: 20,
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              maxWidth: 320,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              zIndex: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="badge" style={{ background: selectedItem.data.color || '#0055b8', color: '#fff', fontSize: 11 }}>
                  {selectedItem.data.type || selectedItem.data.label}
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ×
                </button>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0d233a', marginBottom: 6 }}>
                {selectedItem.data.name || `${selectedItem.data.srcName} → ${selectedItem.data.tgtName}`}
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                {selectedItem.data.summary || selectedItem.data.details || `Relationship: ${selectedItem.data.label}`}
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                ID: {selectedItem.data.id || 'REL-0982'} · Status: Verified in MiroFish
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: 01 Ontology Generation & System Dashboard (Matching Screenshot) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          overflow: 'hidden',
        }}>
          {/* Scrollable Upper Section */}
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#0055b8' }}>01</span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d233a' }}>Ontology Generation</h3>
                </div>
              </div>
              <span className="badge badge-success" style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px' }}>
                BUILD COMPLETE
              </span>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, marginBottom: 12 }}>
              POST /api/graph/ontology/generate
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6, marginBottom: 20 }}>
              LLM analyzes document content and simulation requirements, extracts real-world seeds, and automatically generates an appropriate ontology structure for community crowdfunding and Guidewire insurance underwriting.
            </p>

            {/* Generated Entity Types Tags */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>
                GENERATED ENTITY TYPES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {generatedEntities.map(e => (
                  <span
                    key={e}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* Generated Relation Types Tags */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 8 }}>
                GENERATED RELATION TYPES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {generatedRelations.map(r => (
                  <span
                    key={r}
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#0055b8',
                      fontFamily: 'monospace',
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom SYSTEM DASHBOARD Terminal Console (Matching Screenshot) */}
          <div style={{
            background: '#090d16',
            color: '#e2e8f0',
            padding: '14px 18px',
            borderTop: '1px solid #1e293b',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: 12,
            minHeight: 180,
            maxHeight: 220,
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 11, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #1e293b' }}>
              <span>SYSTEM DASHBOARD</span>
              <span>proj_f95898d38529</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ color: log.includes('✓') ? '#4ade80' : (log.includes('New customer trade') ? '#38bdf8' : '#cbd5e1') }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
