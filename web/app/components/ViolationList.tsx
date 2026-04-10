'use client'

import type { Violation } from '@/lib/types'

export default function ViolationList({ violations }: { violations: Violation[] }) {
  return (
    <div className="card p-6">
      <h3 className="text-label text-xs uppercase tracking-wider mb-4">
        Compliance Violations ({violations.length})
      </h3>
      <div className="space-y-3">
        {violations.map((v, i) => (
          <div key={i} className="violation-row" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <span className="text-fail text-xs font-semibold tracking-wider uppercase">
                {v.violated_standard}
              </span>
              <span className="text-ghost text-xs flex-shrink-0">Violation #{i + 1}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div>
                <span className="text-label">Requirement: </span>
                <span className="text-body">{v.requirement}</span>
              </div>
              <div>
                <span className="text-label">Input Value: </span>
                <span className="text-body font-mono text-xs">{v.input_value}</span>
              </div>
              <div>
                <span className="text-label">Delta: </span>
                <span className="text-fail font-mono text-xs">{v.compliance_delta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
