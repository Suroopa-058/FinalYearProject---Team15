import { useMemo, useState } from 'react'
import {
  STUDENT_PROFILE,
  SCHOLARSHIP_CRITERIA,
  evaluateScholarship,
  type CriterionStatus,
  type EvaluatedCriterion,
  type StudentProfile,
} from '@/lib/roadmap'

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<CriterionStatus, { bg: string; color: string; border: string; label: string }> = {
  Met: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: '✓ Met' },
  'In Progress': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: '◐ In Progress' },
  Required: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: '! Improvement required' },
  Blocked: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '✕ Fixed criterion' },
}

function StatusBadge({ status }: { status: CriterionStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

// ─── Step timeline ───────────────────────────────────────────────────────────
function PhaseTimeline({ phases }: { phases: { key: string; label: string; detail: string; done: boolean; active: boolean }[] }) {
  return (
    <ol className="relative flex flex-col gap-0 md:flex-row md:gap-0">
      {phases.map((p, i) => {
        const dot = p.done ? '#22c55e' : p.active ? '#f59e0b' : '#cbd5e1'
        return (
          <li key={p.key} className="flex md:flex-col md:flex-1 gap-3 md:gap-0 relative">
            {/* connector + dot */}
            <div className="flex md:w-full flex-col md:flex-row items-center shrink-0">
              <span className="hidden md:block h-0.5 flex-1" style={{ background: i === 0 ? 'transparent' : phases[i - 1]?.done ? '#22c55e' : '#e2e8f0' }} />
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                style={{ background: dot, color: p.done || p.active ? '#0f1f3d' : '#fff', boxShadow: p.active ? '0 0 0 4px rgba(245,158,11,0.18)' : 'none' }}
              >
                {p.done ? '✓' : i + 1}
              </span>
              <span className="hidden md:block h-0.5 flex-1" style={{ background: i === phases.length - 1 ? 'transparent' : p.done ? '#22c55e' : '#e2e8f0' }} />
              <span className="md:hidden w-0.5 flex-1 my-1" style={{ background: i === phases.length - 1 ? 'transparent' : p.done ? '#22c55e' : '#e2e8f0', minHeight: 18 }} />
            </div>
            <div className="pb-5 md:pb-0 md:pt-3 md:px-2 md:text-center">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: p.done ? '#15803d' : p.active ? '#b45309' : '#94a3b8' }}>
                {p.label}
              </p>
              <p className="text-xs mt-1 leading-snug" style={{ color: '#64748b' }}>{p.detail}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ─── Gap card ────────────────────────────────────────────────────────────────
function GapCard({ e, onToggle }: { e: EvaluatedCriterion; onToggle: (id: string) => void }) {
  const c = e.criterion
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 2px 10px rgba(15,31,61,.04)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{c.label}</p>
          <p className="text-xs mt-0.5 uppercase tracking-wide" style={{ color: '#94a3b8' }}>{c.kind}</p>
        </div>
        <StatusBadge status={e.status} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Current', value: e.currentValue, color: '#0f1f3d' },
          { label: 'Required', value: e.requiredValue, color: '#0f1f3d' },
          { label: 'Gap', value: e.gap, color: '#dc2626' },
          { label: 'Target', value: c.target ?? '—', color: '#b45309' },
        ].map(f => (
          <div key={f.label} className="rounded-xl px-3 py-2" style={{ background: '#f8fafc' }}>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{f.label}</p>
            <p className="text-xs font-bold mt-0.5 leading-snug" style={{ color: f.color }}>{f.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
          <span className="font-semibold" style={{ color: '#0f1f3d' }}>Why it matters: </span>{c.why}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
          <span className="font-semibold" style={{ color: '#0f1f3d' }}>How to improve: </span>{c.action}
        </p>
      </div>

      {!c.fixed && (
        <button
          onClick={() => onToggle(c.id)}
          className="mt-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          style={
            e.status === 'In Progress'
              ? { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
              : { background: '#0f1f3d', color: '#fff' }
          }
        >
          {e.status === 'In Progress' ? '◐ Marked in progress — undo' : 'Mark as in progress'}
        </button>
      )}
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export default function ImprovementRoadmapPanel({
  scholarshipId,
  scholarshipName,
  accent = '#1d4ed8',
  onGoProfile,
}: {
  scholarshipId: number
  scholarshipName: string
  accent?: string
  onGoProfile?: () => void
}) {
  const [profile, setProfile] = useState<StudentProfile>(STUDENT_PROFILE)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const criteria = SCHOLARSHIP_CRITERIA[scholarshipId] ?? []
  const result = useMemo(() => evaluateScholarship(profile, criteria), [profile, criteria])

  if (criteria.length === 0) return null

  const toggleInProgress = (id: string) =>
    setProfile(p => ({
      ...p,
      inProgress: p.inProgress.includes(id) ? p.inProgress.filter(x => x !== id) : [...p.inProgress, id],
    }))

  const recheck = () => {
    setChecking(true)
    // Rule-based re-evaluation against the current profile (no invented scores).
    setTimeout(() => {
      setProfile(p => ({ ...p }))
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setChecking(false)
    }, 550)
  }

  return (
    <div className="space-y-6">
      {/* Header + progress */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'linear-gradient(160deg,#0f1f3d,#1e3a6e)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#fbbf24' }}>Improvement Roadmap</p>
            <h3 className="font-display text-xl text-white mt-1 leading-snug">Becoming eligible for {scholarshipName}</h3>
            <p className="text-xs mt-2 max-w-xl leading-relaxed" style={{ color: '#94a3b8' }}>
              Every step below is derived by comparing your profile against this scholarship&rsquo;s own requirements — no generic
              suggestions.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold" style={{ color: '#fbbf24' }}>{result.progress}%</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{result.met.length} of {result.criteria.length} requirements met</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${result.progress}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>{result.met.length} Met</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}>
            {result.actionable.filter(e => e.status === 'In Progress').length} In progress
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24' }}>
            {result.actionable.filter(e => e.status === 'Required').length} Improvement required
          </span>
          {result.blocked.length > 0 && (
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
              {result.blocked.length} Fixed criterion
            </span>
          )}
        </div>
      </div>

      {/* Step timeline */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>Your path to eligibility</p>
        <PhaseTimeline phases={result.phases} />
      </div>

      {/* Your Gaps */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h4 className="text-sm font-bold" style={{ color: '#0f1f3d' }}>Your Gaps</h4>
          <span className="text-xs" style={{ color: '#94a3b8' }}>{result.gaps.length} unmet · {result.met.length} already met</span>
        </div>
        {result.gaps.length === 0 ? (
          <div className="rounded-2xl p-5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-sm font-semibold" style={{ color: '#15803d' }}>No gaps — you meet every requirement for this scholarship.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {result.gaps.map(e => <GapCard key={e.criterion.id} e={e} onToggle={toggleInProgress} />)}
          </div>
        )}

        {/* Already met */}
        {result.met.length > 0 && (
          <div className="mt-3 rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e8edf5' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: '#94a3b8' }}>Already met — no action needed</p>
            <div className="space-y-2">
              {result.met.map(e => (
                <div key={e.criterion.id} className="flex flex-wrap items-center gap-2 text-xs" style={{ color: '#475569' }}>
                  <StatusBadge status="Met" />
                  <span className="font-semibold" style={{ color: '#0f1f3d' }}>{e.criterion.label}</span>
                  <span>{e.currentValue} vs required {e.requiredValue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Recommended Programs */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h4 className="text-sm font-bold" style={{ color: '#0f1f3d' }}>Recommended Programs</h4>
          <span className="text-xs" style={{ color: '#94a3b8' }}>Matched to your gaps only</span>
        </div>
        {result.programs.length === 0 ? (
          <div className="rounded-2xl p-5" style={{ background: '#f8fafc', border: '1px solid #e8edf5' }}>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {result.blocked.length > 0 && result.actionable.length === 0
                ? 'No programs can change this scholarship\u2019s fixed criteria — explore closer-matched awards instead.'
                : 'No programs needed for this scholarship.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.programs.map(({ program, forCriterion }) => (
              <article key={`${forCriterion}-${program.title}`} className="rounded-2xl p-4 flex flex-col" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${accent}12`, color: accent }}>{program.type}</span>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>{program.duration}</span>
                </div>
                <p className="text-sm font-semibold leading-snug" style={{ color: '#0f1f3d' }}>{program.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{program.provider}</p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: '#475569' }}>{program.outcome}</p>
                <p className="text-xs mt-3 pt-3 font-medium" style={{ borderTop: '1px solid #f1f5f9', color: '#b45309' }}>
                  Closes gap: {forCriterion}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Re-check eligibility */}
      <div className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4" style={{ background: result.eligible ? '#f0fdf4' : '#fffbeb', border: `1px solid ${result.eligible ? '#bbf7d0' : '#fde68a'}` }}>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: result.eligible ? '#15803d' : '#92400e' }}>
            {result.eligible
              ? 'All requirements satisfied — you are eligible to apply.'
              : `${result.gaps.length} requirement(s) still open. Update your profile, then re-check.`}
          </p>
          <p className="text-xs mt-1" style={{ color: '#92400e' }}>
            {lastChecked ? `Last re-checked at ${lastChecked} against current profile data.` : 'Eligibility is re-computed from your saved profile — never estimated.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {onGoProfile && (
            <button onClick={onGoProfile} className="px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: '#fff', color: '#0f1f3d', border: '1px solid #e2e8f0' }}>
              Update Profile
            </button>
          )}
          <button
            onClick={recheck}
            disabled={checking}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#0f1f3d', opacity: checking ? 0.7 : 1 }}
          >
            {checking ? 'Re-checking…' : '↻ Re-check Eligibility'}
          </button>
        </div>
      </div>
    </div>
  )
}
