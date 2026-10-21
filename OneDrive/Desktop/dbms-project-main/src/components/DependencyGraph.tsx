import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import type { FunctionalDependency } from '../engine/types';

interface DependencyGraphProps {
  attributes: string[];
  fds: FunctionalDependency[];
  primeAttributes: string[];
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  attributes,
  fds,
  primeAttributes,
}) => {
  const activeFDs = fds.filter((fd) => fd.isActive !== false);

  const nodes = useMemo(() => {
    const radius = 130;
    const centerX = 230;
    const centerY = 160;
    const count = attributes.length;

    return attributes.map((attr, idx) => {
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return {
        id: attr,
        x,
        y,
        isPrime: primeAttributes.includes(attr),
      };
    });
  }, [attributes, primeAttributes]);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Network className="h-5 w-5 text-cyan-400" />
            <span>Functional Dependency Graph</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Directed graph visualization of attribute dependencies (X → Y). Cyan nodes represent Candidate Key prime attributes.
          </p>
        </div>
      </div>

      <div className="w-full bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden relative">
        <svg width="460" height="320" className="max-w-full h-auto">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
            </marker>
          </defs>

          {activeFDs.map((fd) => {
            return fd.rhs.map((rhsAttr) => {
              const targetNode = nodes.find((n) => n.id === rhsAttr);
              if (!targetNode) return null;

              return fd.lhs.map((lhsAttr) => {
                const sourceNode = nodes.find((n) => n.id === lhsAttr);
                if (!sourceNode) return null;

                return (
                  <line
                    key={`${fd.id}_${lhsAttr}_${rhsAttr}`}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="#0284c7"
                    strokeWidth="2"
                    strokeDasharray={fd.confidence < 1.0 ? '4 4' : undefined}
                    markerEnd="url(#arrowhead)"
                    opacity="0.8"
                  />
                );
              });
            });
          })}

          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                r="18"
                fill={node.isPrime ? '#082f49' : '#0f172a'}
                stroke={node.isPrime ? '#38bdf8' : '#475569'}
                strokeWidth="2.5"
                className="transition-all hover:scale-110 cursor-pointer"
              />
              <text
                textAnchor="middle"
                dy="-24"
                className="text-[11px] font-mono font-bold fill-slate-200"
              >
                {node.id.length > 14 ? `${node.id.substring(0, 12)}...` : node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
