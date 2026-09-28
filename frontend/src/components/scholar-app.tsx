import { useState, useEffect, useRef } from 'react'
import heroBg from '@/assets/hero-bg.jpg'
import capOne from '@/assets/cap-1.png'
import capTwo from '@/assets/cap-2.png'
import ImprovementRoadmapPanel from '@/components/improvement-roadmap'
import { getAdminOverview, getProfile, getRecommendations, login as loginRequest, registerStudent, registerUniversity, universityRequest, type AuthSession, type RecommendationResponse, type StudentProfile } from '@/lib/api'
import { clearStoredSession, getStoredSession, setStoredSession } from '@/lib/auth-storage'

// ─── Types ─────────────────────────────────────────────────────────────────
interface GapRow {
  requirement: string
  yourValue: string
  required: string
  gap: string
  status: 'Met' | 'Partial' | 'Not Met'
}

interface RoadmapStep {
  title: string
  detail: string
}

interface Scholarship {
  id: number
  name: string
  provider: string
  country: string
  amount: number
  amountLabel: string
  eligibility: string
  deadline: string
  deadlineDate: Date
  category: string
  tags: string[]
  match: number
  saved: boolean
  logo: string
  accent: string
  description: string
  applied: boolean
  status: string
  requirements: string[]
  renewable: boolean
  applicants: number
  // ── Recommendation / eligibility intelligence ──
  eligible: boolean
  matchFactors: string[]
  whyMatch: string
  gapAnalysis: GapRow[]
  improvementSteps: RoadmapStep[]
}

// ─── Scholarship data ───────────────────────────────────────────────────────
const ALL_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 1,
    name: 'National Merit Excellence Award',
    provider: 'National Merit Foundation',
    country: 'United States',
    amount: 25000,
    amountLabel: '$25,000',
    eligibility: 'GPA 3.8+, STEM major',
    deadline: 'Dec 15, 2026',
    deadlineDate: new Date('2026-12-15'),
    category: 'Merit',
    tags: ['STEM', 'Merit', 'Renewable'],
    match: 96,
    saved: true,
    logo: '🎓',
    accent: '#1d4ed8',
    description: 'Awarded to exceptional students demonstrating outstanding academic achievement in STEM fields.',
    applied: false,
    status: '',
    requirements: ['Transcript', 'Essay (500 words)', '2 Recommendations'],
    renewable: true,
    applicants: 3400,
    eligible: true,
    matchFactors: [
      'CGPA of 8.7/10 places you in the top 5% of applicants',
      'Enrolled in a STEM major (Computer Science)',
      'Consistent academic record across all semesters',
    ],
    whyMatch: 'Your academic record is a strong fit for this merit-based award — your CGPA and STEM major meet the foundation\u2019s top-tier criteria.',
    gapAnalysis: [
      { requirement: 'Minimum CGPA', yourValue: '8.7 / 10', required: '8.5 / 10', gap: 'None', status: 'Met' },
      { requirement: 'Field of study', yourValue: 'Computer Science', required: 'Any STEM major', gap: 'None', status: 'Met' },
      { requirement: 'Academic standing', yourValue: '3rd year, in good standing', required: 'Enrolled, good standing', gap: 'None', status: 'Met' },
    ],
    improvementSteps: [],
  },
  {
    id: 2,
    name: 'Future Leaders Scholarship',
    provider: 'Gates Foundation',
    country: 'United States',
    amount: 15000,
    amountLabel: '$15,000',
    eligibility: 'Leadership record, any major',
    deadline: 'Jan 10, 2027',
    deadlineDate: new Date('2027-01-10'),
    category: 'Leadership',
    tags: ['Leadership', 'Community Service', 'Mentorship'],
    match: 88,
    saved: false,
    logo: '⭐',
    accent: '#7c3aed',
    description: 'For students with demonstrated leadership who are committed to community impact.',
    applied: false,
    status: '',
    requirements: ['Leadership portfolio', 'Personal statement', 'Community service record'],
    renewable: true,
    applicants: 8900,
    eligible: true,
    matchFactors: [
      'Led a winning team at Smart India Hackathon 2024',
      'Open to any major — no field restriction',
      'Demonstrated initiative through student projects',
    ],
    whyMatch: 'Your hackathon leadership and project initiative align with this scholarship\u2019s focus on students who lead and mobilize others.',
    gapAnalysis: [
      { requirement: 'Leadership experience', yourValue: 'Hackathon team lead (2024)', required: '1+ documented leadership role', gap: 'None', status: 'Met' },
      { requirement: 'Field of study', yourValue: 'Computer Science', required: 'Any major', gap: 'None', status: 'Met' },
      { requirement: 'Community involvement', yourValue: 'Limited formal record', required: 'Ongoing community engagement', gap: 'Add more documented community activity', status: 'Partial' },
    ],
    improvementSteps: [
      { title: 'Document community involvement', detail: 'Log volunteering or mentoring hours in your profile to strengthen this criterion before applying.' },
    ],
  },
  {
    id: 3,
    name: 'Women in Technology Grant',
    provider: 'Google.org',
    country: 'United States',
    amount: 20000,
    amountLabel: '$20,000',
    eligibility: 'Female-identifying, CS / Engineering',
    deadline: 'Nov 30, 2026',
    deadlineDate: new Date('2026-11-30'),
    category: 'Diversity',
    tags: ['Women in Tech', 'CS', 'Google'],
    match: 91,
    saved: true,
    logo: '💻',
    accent: '#059669',
    description: 'Supporting the next generation of women pioneers in technology and engineering.',
    applied: true,
    status: 'Under Review',
    requirements: ['Technical project', 'Video essay', 'Faculty recommendation'],
    renewable: false,
    applicants: 5200,
    eligible: true,
    matchFactors: [
      'Enrolled in Computer Science / Engineering',
      'Technical portfolio in Python, ML and React',
      'Identifies as a woman in a technology field',
    ],
    whyMatch: 'Your technical background and gender identity align directly with Google.org\u2019s focus on supporting women pioneers in technology.',
    gapAnalysis: [
      { requirement: 'Field of study', yourValue: 'Computer Science', required: 'CS / Engineering', gap: 'None', status: 'Met' },
      { requirement: 'Gender criterion', yourValue: 'Female-identifying', required: 'Female-identifying', gap: 'None', status: 'Met' },
      { requirement: 'Technical project', yourValue: 'Submitted (under review)', required: '1 technical project', gap: 'None', status: 'Met' },
    ],
    improvementSteps: [],
  },
  {
    id: 4,
    name: 'First Generation College Fund',
    provider: 'Dell Technologies',
    country: 'United States',
    amount: 12000,
    amountLabel: '$12,000',
    eligibility: 'First-gen college student',
    deadline: 'Feb 28, 2027',
    deadlineDate: new Date('2027-02-28'),
    category: 'First-Gen',
    tags: ['First-Gen', 'Dell', 'Mentorship'],
    match: 82,
    saved: false,
    logo: '🌟',
    accent: '#0891b2',
    description: 'Breaking barriers for first-generation college students pursuing technology careers.',
    applied: false,
    status: '',
    requirements: ['Personal essay', 'Proof of first-gen status', 'Financial documents'],
    renewable: true,
    applicants: 4100,
    eligible: true,
    matchFactors: [
      'First-generation college student',
      'Demonstrated financial need (₹4.2 LPA family income)',
      'Pursuing a technology-related degree',
    ],
    whyMatch: 'You meet Dell\u2019s core first-generation and financial-need criteria, and your technology major matches the fund\u2019s focus area.',
    gapAnalysis: [
      { requirement: 'First-gen status', yourValue: 'First-generation student', required: 'First-generation student', gap: 'None', status: 'Met' },
      { requirement: 'Financial need', yourValue: '₹4.2 LPA family income', required: 'Demonstrated need', gap: 'None', status: 'Met' },
      { requirement: 'Financial documents', yourValue: 'Income certificate verified', required: 'Verified income proof', gap: 'None', status: 'Met' },
    ],
    improvementSteps: [],
  },
  {
    id: 5,
    name: 'Rural Excellence Scholarship',
    provider: 'USDA Foundation',
    country: 'United States',
    amount: 8000,
    amountLabel: '$8,000',
    eligibility: 'Rural background, Agri / Environment',
    deadline: 'Oct 20, 2026',
    deadlineDate: new Date('2026-10-20'),
    category: 'Need-based',
    tags: ['Rural', 'Agriculture', 'Need-based'],
    match: 74,
    saved: false,
    logo: '🌾',
    accent: '#d97706',
    description: 'Empowering students from rural communities to pursue higher education and make a difference.',
    applied: false,
    status: '',
    requirements: ['Proof of rural residence', 'Financial need statement', 'Essay'],
    renewable: false,
    applicants: 1800,
    eligible: false,
    matchFactors: [
      'Financial need documentation is already verified',
    ],
    whyMatch: 'This scholarship targets students from rural communities in agriculture or environmental fields — two criteria your current profile doesn\u2019t meet.',
    gapAnalysis: [
      { requirement: 'Residential background', yourValue: 'Delhi NCR (urban)', required: 'Rural / non-metro residence', gap: 'Location criterion not met', status: 'Not Met' },
      { requirement: 'Field of study', yourValue: 'Computer Science', required: 'Agriculture / Environmental Science', gap: 'Different field of study', status: 'Not Met' },
      { requirement: 'Financial need', yourValue: '₹4.2 LPA family income', required: 'Demonstrated need', gap: 'None', status: 'Met' },
    ],
    improvementSteps: [
      { title: 'Residence and field are fixed criteria', detail: 'Rural residence and an agriculture/environment major can\u2019t be changed retroactively — this scholarship is unlikely to become a fit.' },
      { title: 'Explore need-based alternatives instead', detail: 'Your verified financial-need documentation already qualifies you for other need-based awards on your Scholarships page.' },
    ],
  },
  {
    id: 6,
    name: 'Creative Arts Achievement Award',
    provider: 'National Arts Council',
    country: 'United States',
    amount: 10000,
    amountLabel: '$10,000',
    eligibility: 'Fine Arts, Design, or Music major',
    deadline: 'Dec 1, 2026',
    deadlineDate: new Date('2026-12-01'),
    category: 'Arts',
    tags: ['Arts', 'Creative', 'Portfolio'],
    match: 65,
    saved: false,
    logo: '🎨',
    accent: '#be185d',
    description: 'Celebrating exceptional talent in fine arts, design, and performing arts.',
    applied: false,
    status: '',
    requirements: ['Portfolio (10 pieces)', 'Artist statement', 'Faculty endorsement'],
    renewable: false,
    applicants: 2700,
    eligible: false,
    matchFactors: [],
    whyMatch: 'This award is reserved for Fine Arts, Design, or Music majors with an evaluated creative portfolio — outside your current major and profile.',
    gapAnalysis: [
      { requirement: 'Field of study', yourValue: 'Computer Science', required: 'Fine Arts / Design / Music', gap: 'Different major', status: 'Not Met' },
      { requirement: 'Creative portfolio', yourValue: 'Not submitted', required: '10-piece portfolio', gap: 'No portfolio on file', status: 'Not Met' },
      { requirement: 'Arts faculty endorsement', yourValue: 'None', required: '1 endorsement letter', gap: 'No arts faculty relationship', status: 'Not Met' },
    ],
    improvementSteps: [
      { title: 'Major mismatch is a hard requirement', detail: 'This award is scoped to Fine Arts, Design, and Music majors, so it isn\u2019t a realistic match while pursuing Computer Science.' },
      { title: 'Look at STEM or merit awards instead', detail: 'Your CS major and academic record are a much stronger fit for the Merit and STEM categories.' },
    ],
  },
  {
    id: 7,
    name: 'STEM Innovation Fellowship',
    provider: 'NASA Education',
    country: 'United States',
    amount: 30000,
    amountLabel: '$30,000',
    eligibility: 'Physics / Aerospace / Robotics major',
    deadline: 'Mar 15, 2027',
    deadlineDate: new Date('2027-03-15'),
    category: 'Merit',
    tags: ['STEM', 'NASA', 'Research', 'Fellowship'],
    match: 78,
    saved: true,
    logo: '🚀',
    accent: '#1d4ed8',
    description: 'A prestigious fellowship for students pursuing careers in aerospace and space sciences.',
    applied: false,
    status: '',
    requirements: ['Research proposal', 'Academic records', '3 Recommendations', 'Interview'],
    renewable: true,
    applicants: 12000,
    eligible: false,
    matchFactors: [
      'Strong academic record (8.7 CGPA)',
      'Existing STEM foundation in Computer Science',
    ],
    whyMatch: 'Your academics are strong, but this fellowship is scoped to Physics, Aerospace, or Robotics majors, and two required documents are still outstanding.',
    gapAnalysis: [
      { requirement: 'Field of study', yourValue: 'Computer Science', required: 'Physics / Aerospace / Robotics', gap: 'Adjacent field, not an exact match', status: 'Partial' },
      { requirement: 'Research proposal', yourValue: 'Not started', required: '1 submitted proposal', gap: 'Needs to be written and submitted', status: 'Not Met' },
      { requirement: 'Recommendations', yourValue: '1 of 3 submitted', required: '3 recommendations', gap: '2 more letters needed', status: 'Partial' },
    ],
    improvementSteps: [
      { title: 'Strengthen your field alignment', detail: 'Take a robotics or aerospace-adjacent elective, or highlight relevant coursework, to bridge the major requirement.' },
      { title: 'Draft your research proposal', detail: 'Outline a proposal connecting your ML/AI interest to an aerospace or robotics application before the Mar 15 deadline.' },
      { title: 'Request 2 more recommendation letters', detail: 'Ask a faculty member familiar with your technical work in addition to your current recommender.' },
    ],
  },
  {
    id: 8,
    name: 'Diversity & Inclusion Excellence',
    provider: 'Microsoft Philanthropies',
    country: 'United States',
    amount: 18000,
    amountLabel: '$18,000',
    eligibility: 'Underrepresented minority, any STEM field',
    deadline: 'Jan 31, 2027',
    deadlineDate: new Date('2027-01-31'),
    category: 'Diversity',
    tags: ['Diversity', 'Microsoft', 'STEM', 'Mentorship'],
    match: 85,
    saved: false,
    logo: '🌈',
    accent: '#7c3aed',
    description: "Microsoft's commitment to building a more diverse and inclusive tech industry.",
    applied: false,
    status: '',
    requirements: ['Personal statement', 'Community impact essay', 'Reference letter'],
    renewable: true,
    applicants: 6700,
    eligible: true,
    matchFactors: [
      'Studying a STEM field (Computer Science)',
      'First-generation, underrepresented background in tech',
      'Active community and hackathon involvement',
    ],
    whyMatch: 'Your STEM major and underrepresented, first-generation background align with Microsoft\u2019s diversity and inclusion focus areas.',
    gapAnalysis: [
      { requirement: 'Field of study', yourValue: 'Computer Science', required: 'Any STEM field', gap: 'None', status: 'Met' },
      { requirement: 'Background criterion', yourValue: 'First-gen, underrepresented in tech', required: 'Underrepresented minority in STEM', gap: 'None', status: 'Met' },
      { requirement: 'Reference letter', yourValue: '1 of 1 uploaded', required: '1 reference letter', gap: 'None', status: 'Met' },
    ],
    improvementSteps: [],
  },
]

const SUCCESS_STORIES = [
  {
    name: 'Priya Sharma',
    award: 'National Merit Award — $25,000',
    university: 'IIT Delhi · B.Tech CS · Class of 2025',
    quote: 'ScholarMatch helped me discover scholarships I never knew existed. I went from worrying about tuition to fully focusing on my research — and I just got into MIT for my Masters!',
    avatar: 'https://images.unsplash.com/photo-1633734973050-d6499a977c17?w=80&h=80&fit=crop&auto=format&face',
    tag: 'STEM Scholar',
    tagColor: '#1d4ed8',
    bgImage: 'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?w=300&h=180&fit=crop&auto=format',
  },
  {
    name: 'Marcus Johnson',
    award: 'Future Leaders Scholarship — $15,000',
    university: 'Howard University · MBA · Class of 2026',
    quote: 'The AI eligibility matcher saved me weeks of research. It zeroed in on exactly the right scholarships, and I got my top pick on the first try!',
    avatar: 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=80&h=80&fit=crop&auto=format&face',
    tag: 'Leadership Scholar',
    tagColor: '#7c3aed',
    bgImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&h=180&fit=crop&auto=format',
  },
  {
    name: 'Aisha Okonkwo',
    award: 'Women in Technology Grant — $20,000',
    university: 'Stanford · MS Data Science · Class of 2025',
    quote: "As a first-gen student I had zero roadmap for scholarships. ScholarMatch's step-by-step guidance and deadline tracking made the whole process feel effortless.",
    avatar: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=80&h=80&fit=crop&auto=format&face',
    tag: 'Tech Innovator',
    tagColor: '#059669',
    bgImage: 'https://images.unsplash.com/photo-1769092992447-18050cf9bd26?w=300&h=180&fit=crop&auto=format',
  },
]

// ─── Utility ────────────────────────────────────────────────────────────────
function daysLeft(d: Date) {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000))
}

function fmtAmount(n: number) {
  return '$' + n.toLocaleString()
}

// ─── Micro components ────────────────────────────────────────────────────────

function MatchPill({ pct }: { pct: number }) {
  const c = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#64748b'
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${c}18`, color: c }}>
      {pct}% match
    </span>
  )
}

function DeadlinePill({ date }: { date: Date }) {
  const d = daysLeft(date)
  const urgent = d <= 14
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: urgent ? '#fef2f2' : '#f0fdf4', color: urgent ? '#dc2626' : '#15803d' }}>
      {d === 0 ? '🔥 Today!' : urgent ? `⚡ ${d}d left` : `${d} days`}
    </span>
  )
}

function RingChart({ value, size = 72, thickness = 7, color = '#1d4ed8', label }: { value: number; size?: number; thickness?: number; color?: string; label?: string }) {
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={thickness}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="font-bold leading-none" style={{ fontSize: size * 0.2, color }}>{value}%</p>
        {label && <p className="text-gray-400 leading-none mt-0.5" style={{ fontSize: size * 0.13 }}>{label}</p>}
      </div>
    </div>
  )
}

// ─── Gap status pill ─────────────────────────────────────────────────────────
function GapStatusPill({ status }: { status: GapRow['status'] }) {
  const map = {
    Met: { bg: '#f0fdf4', color: '#15803d', label: '✓ Met' },
    Partial: { bg: '#fffbeb', color: '#b45309', label: '◐ Partial' },
    'Not Met': { bg: '#fef2f2', color: '#dc2626', label: '✕ Not Met' },
  } as const
  const c = map[status]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

// ─── Gap Analysis table ──────────────────────────────────────────────────────
function GapAnalysisTable({ rows }: { rows: GapRow[] }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8edf5' }}>
      {/* header row - desktop */}
      <div className="hidden sm:grid text-xs font-semibold px-4 py-3" style={{ gridTemplateColumns: '1.3fr 1fr 1fr 1.3fr 0.8fr', background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e8edf5' }}>
        <span>Requirement</span>
        <span>Your Value</span>
        <span>Required</span>
        <span>Gap</span>
        <span>Status</span>
      </div>
      <div>
        {rows.map((r, i) => (
          <div
            key={r.requirement}
            className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_1fr_1.3fr_0.8fr] gap-1 sm:gap-3 px-4 py-3 text-xs"
            style={{ background: i % 2 === 0 ? '#fff' : '#fafbff', borderBottom: i === rows.length - 1 ? 'none' : '1px solid #f1f5f9' }}
          >
            <span className="font-semibold" style={{ color: '#0f1f3d' }}>{r.requirement}</span>
            <span style={{ color: '#475569' }}><span className="sm:hidden font-medium" style={{ color: '#94a3b8' }}>Your value: </span>{r.yourValue}</span>
            <span style={{ color: '#475569' }}><span className="sm:hidden font-medium" style={{ color: '#94a3b8' }}>Required: </span>{r.required}</span>
            <span style={{ color: '#64748b' }}><span className="sm:hidden font-medium" style={{ color: '#94a3b8' }}>Gap: </span>{r.gap}</span>
            <span><GapStatusPill status={r.status} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Recommendation Card (dashboard "Best Matches") ─────────────────────────
function RecommendationCard({
  s, rank, onDetails, onSave,
}: {
  s: Scholarship
  rank: number
  onDetails: (id: number) => void
  onSave: (id: number) => void
}) {
  const [hov, setHov] = useState(false)
  const unmetCount = s.gapAnalysis.filter(g => g.status !== 'Met').length

  return (
    <article
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: '#fff',
        border: `1px solid ${hov ? s.accent + '44' : '#e8edf5'}`,
        boxShadow: hov ? `0 22px 50px ${s.accent}16, 0 4px 16px rgba(15,31,61,.06)` : '0 2px 10px rgba(15,31,61,.05)',
        transform: hov ? 'perspective(900px) rotateX(0.6deg) translateY(-3px)' : 'perspective(900px) rotateX(0deg)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="p-5 sm:p-6">
        {/* ── 1. Scholarship name + country/provider ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex gap-3 items-start min-w-0">
            <span className="text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#f1f5f9', color: '#64748b' }}>#{rank}</span>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${s.accent}12` }}>{s.logo}</div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-snug" style={{ color: '#0f1f3d' }}>{s.name}</h3>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>{s.provider} · {s.country}</p>
            </div>
          </div>
          <button
            onClick={() => onSave(s.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all shrink-0"
            style={{ background: s.saved ? '#fefce8' : '#f8fafc', color: s.saved ? '#d97706' : '#94a3b8', border: `1px solid ${s.saved ? '#fde68a' : '#e2e8f0'}` }}
          >
            {s.saved ? '★' : '☆'}
          </button>
        </div>

        {/* ── 2. Recommendation score + eligibility state ── */}
        <div className="flex items-center gap-4 mb-4 p-3.5 rounded-xl" style={{ background: '#f8fafc' }}>
          <RingChart value={s.match} size={58} thickness={6} color={s.accent} />
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Recommendation Score</p>
            {s.eligible ? (
              <span className="inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#f0fdf4', color: '#15803d' }}>✓ Eligible</span>
            ) : (
              <span className="inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#fef2f2', color: '#dc2626' }}>NOT ELIGIBLE YET</span>
            )}
          </div>
          <div className="ml-auto text-right shrink-0">
            <p className="font-display text-xl" style={{ color: s.accent }}>{s.amountLabel}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{s.deadline}</p>
          </div>
        </div>

        {s.eligible ? (
          <>
            {/* ── 3. Why it matches ── */}
            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: '#0f1f3d' }}>Why it matches</p>
              <ul className="space-y-1.5">
                {s.matchFactors.slice(0, 3).map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs leading-snug" style={{ color: '#475569' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: s.accent }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── 4. Requirements ── */}
            <div className="mb-5">
              <p className="text-xs font-semibold mb-2" style={{ color: '#0f1f3d' }}>Requirements</p>
              <div className="flex flex-wrap gap-1.5">
                {s.requirements.slice(0, 3).map(r => (
                  <span key={r} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: `${s.accent}0f`, color: s.accent }}>{r}</span>
                ))}
                {s.requirements.length > 3 && (
                  <span className="text-xs px-2.5 py-1" style={{ color: '#94a3b8' }}>+{s.requirements.length - 3} more</span>
                )}
              </div>
            </div>

            {/* ── 5. Action ── */}
            <button
              onClick={() => onDetails(s.id)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accent}bb)` }}
            >
              View Details →
            </button>
          </>
        ) : (
          <>
            {/* ── What is missing ── */}
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: '#0f1f3d' }}>What&rsquo;s missing</p>
              <ul className="space-y-1.5">
                {s.gapAnalysis.filter(g => g.status !== 'Met').slice(0, 2).map(g => (
                  <li key={g.requirement} className="flex items-start gap-2 text-xs leading-snug" style={{ color: '#475569' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: '#dc2626' }}>✕</span>
                    <span><span className="font-medium">{g.requirement}:</span> {g.gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Gap summary ── */}
            <div className="mb-4 p-2.5 rounded-xl flex items-center justify-between" style={{ background: '#fef2f2' }}>
              <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>Gap: {unmetCount} of {s.gapAnalysis.length} criteria unmet</span>
            </div>

            {/* ── How to improve ── */}
            {s.improvementSteps.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold mb-2" style={{ color: '#0f1f3d' }}>How to improve</p>
                <p className="text-xs leading-snug" style={{ color: '#475569' }}>{s.improvementSteps[0].detail}</p>
              </div>
            )}

            {/* ── Improvement roadmap / re-evaluate ── */}
            <div className="flex gap-2">
              <button
                onClick={() => onDetails(s.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#0f1f3d,#1e3a6e)' }}
              >
                View Improvement Roadmap →
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

// ─── Scholarship Card ────────────────────────────────────────────────────────
function ScholarCard({
  s, onSave, onApply, onCompare, compareList, onDetails,
}: {
  s: Scholarship
  onSave: (id: number) => void
  onApply: (id: number) => void
  onCompare: (id: number) => void
  compareList: number[]
  onDetails?: (id: number) => void
}) {
  const [hov, setHov] = useState(false)
  const inCompare = compareList.includes(s.id)

  return (
    <article
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
      style={{
        background: '#fff',
        border: `1px solid ${hov ? s.accent + '44' : '#e8edf5'}`,
        boxShadow: hov ? `0 20px 48px ${s.accent}18, 0 4px 16px rgba(15,31,61,.06)` : '0 2px 10px rgba(15,31,61,.05)',
        transform: hov ? 'translateY(-4px)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* color bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${s.accent}, ${s.accent}66)` }} />

      <div className="p-5 flex flex-col flex-1">
        {/* header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-3 items-start min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${s.accent}12` }}>
              {s.logo}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-tight truncate" style={{ color: '#0f1f3d', maxWidth: 180 }} title={s.name}>{s.name}</h3>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{s.provider}</p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <button
              onClick={() => onCompare(s.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
              title="Compare"
              style={{ background: inCompare ? '#1d4ed820' : '#f8fafc', color: inCompare ? '#1d4ed8' : '#94a3b8', border: `1px solid ${inCompare ? '#1d4ed840' : '#e2e8f0'}` }}
            >
              ⇄
            </button>
            <button
              onClick={() => onSave(s.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
              style={{ background: s.saved ? '#fefce8' : '#f8fafc', color: s.saved ? '#d97706' : '#94a3b8', border: `1px solid ${s.saved ? '#fde68a' : '#e2e8f0'}` }}
            >
              {s.saved ? '★' : '☆'}
            </button>
          </div>
        </div>

        {/* amount */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-display text-2xl font-semibold" style={{ color: s.accent }}>{s.amountLabel}</span>
          <span className="text-xs" style={{ color: '#94a3b8' }}>/ year</span>
          {s.renewable && (
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: '#f0fdf4', color: '#15803d' }}>↻ Renewable</span>
          )}
        </div>

        {/* info */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
            <span className="shrink-0 mt-0.5">📚</span>
            <span className="leading-snug">{s.eligibility}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
            <span className="shrink-0">📅</span>
            <span>{s.deadline}</span>
            <DeadlinePill date={s.deadlineDate} />
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
            <span className="shrink-0">👥</span>
            <span>{s.applicants.toLocaleString()} applicants</span>
          </div>
        </div>

        {/* tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {s.tags.slice(0, 3).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-md" style={{ background: `${s.accent}0f`, color: s.accent }}>{t}</span>
          ))}
        </div>

        {/* requirements preview */}
        <div className="mb-4 p-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Requirements</p>
          <div className="space-y-0.5">
            {s.requirements.slice(0, 2).map(r => (
              <div key={r} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-xs" style={{ background: `${s.accent}20`, color: s.accent }}>✓</span>
                {r}
              </div>
            ))}
            {s.requirements.length > 2 && (
              <p className="text-xs" style={{ color: '#94a3b8' }}>+{s.requirements.length - 2} more</p>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between pt-3 mt-auto" style={{ borderTop: '1px solid #f1f5f9' }}>
          <MatchPill pct={s.match} />
          <div className="flex gap-2">
            <button onClick={() => onDetails?.(s.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105" style={{ background: '#f0f4ff', color: '#1d4ed8' }}>
              Details
            </button>
            {s.applied ? (
              <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: '#f0fdf4', color: '#15803d' }}>
                ✓ {s.status}
              </span>
            ) : (
              <button
                onClick={() => onApply(s.id)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accent}bb)`, boxShadow: hov ? `0 4px 14px ${s.accent}55` : 'none' }}
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

// ─── Comparison Modal ────────────────────────────────────────────────────────
function CompareModal({ ids, data, onClose, onSave, onApply }: {
  ids: number[]; data: Scholarship[]; onClose: () => void; onSave: (id: number) => void; onApply: (id: number) => void
}) {
  const selected = ids.slice(0, 3).map(id => data.find(s => s.id === id)!)
  const rows: { label: string; key: keyof Scholarship | 'daysLeft' }[] = [
    { label: 'Amount', key: 'amountLabel' },
    { label: 'Category', key: 'category' },
    { label: 'Match', key: 'match' },
    { label: 'Renewable', key: 'renewable' },
    { label: 'Applicants', key: 'applicants' },
    { label: 'Deadline', key: 'deadline' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(15,31,61,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden animate-slide-in" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg,#0f1f3d,#1e3a6e)', color: '#fff' }}>
          <div>
            <h2 className="font-display text-lg">Scholarship Comparison</h2>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Compare up to 3 scholarships side by side</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>✕</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left p-4 text-xs font-semibold" style={{ color: '#64748b', width: 120 }}>Feature</th>
                {selected.map(s => (
                  <th key={s.id} className="p-4 text-center">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center text-lg" style={{ background: `${s.accent}14` }}>{s.logo}</div>
                    <p className="text-xs font-semibold" style={{ color: '#0f1f3d' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{s.provider}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                  <td className="p-3 px-4 text-xs font-semibold" style={{ color: '#475569' }}>{row.label}</td>
                  {selected.map(s => {
                    const raw = row.key === 'daysLeft' ? daysLeft(s.deadlineDate) : s[row.key as keyof Scholarship]
                    let display: string = String(raw)
                    let cell: React.ReactNode = <span className="text-xs" style={{ color: '#0f1f3d' }}>{display}</span>
                    if (row.key === 'match') {
                      const n = s.match
                      cell = <MatchPill pct={n} />
                    } else if (row.key === 'amountLabel') {
                      cell = <span className="font-display font-semibold text-sm" style={{ color: s.accent }}>{s.amountLabel}</span>
                    } else if (row.key === 'renewable') {
                      cell = <span className="text-xs" style={{ color: s.renewable ? '#15803d' : '#dc2626' }}>{s.renewable ? '✓ Yes' : '✗ No'}</span>
                    } else if (row.key === 'applicants') {
                      cell = <span className="text-xs" style={{ color: '#0f1f3d' }}>{s.applicants.toLocaleString()}</span>
                    }
                    return <td key={s.id} className="p-3 text-center">{cell}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 p-4 justify-end" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#f1f5f9', color: '#475569' }}>Close</button>
          {selected[0] && !selected[0].applied && (
            <button onClick={() => { onApply(selected[0].id); onClose() }} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>
              Apply to {selected[0].name.split(' ').slice(0, 2).join(' ')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Floating Grad Cap SVG ───────────────────────────────────────────────────
function GradCap({ size = 40, opacity = 0.7 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ opacity }}>
      <polygon points="24,5 46,17 24,29 2,17" fill="#f59e0b" />
      <polygon points="24,29 46,17 46,27 24,39" fill="#d97706" />
      <polygon points="24,29 2,17 2,27 24,39" fill="#b45309" />
      <line x1="46" y1="17" x2="46" y2="31" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="31" r="3" fill="#fbbf24" />
    </svg>
  )
}

// ─── Landing Page ────────────────────────────────────────────────────────────
function LandingPage({ onEnter, onLogin, onRegister, onContinue, welcomeBackName }: { onEnter: () => void; onLogin: () => void; onRegister: () => void; onContinue?: () => void; welcomeBackName?: string }) {
  const caps = [
    { src: capOne, top: '6%', left: '3%', size: 200, rotate: '-14deg', dur: '9s', delay: '0s', opacity: 0.95 },
    { src: capTwo, top: '30%', left: '-2%', size: 240, rotate: '10deg', dur: '11s', delay: '1.4s', opacity: 0.95 },
    { src: capTwo, top: '4%', left: '26%', size: 96, rotate: '18deg', dur: '8s', delay: '0.6s', opacity: 0.8 },
    { src: capOne, top: '2%', left: '48%', size: 120, rotate: '-8deg', dur: '10s', delay: '2s', opacity: 0.85 },
    { src: capOne, top: '8%', right: '18%', size: 84, rotate: '14deg', dur: '9s', delay: '1s', opacity: 0.75 },
    { src: capTwo, top: '12%', right: '2%', size: 260, rotate: '-16deg', dur: '12s', delay: '0.4s', opacity: 0.95 },
    { src: capOne, top: '3%', left: '16%', size: 64, rotate: '24deg', dur: '7s', delay: '2.6s', opacity: 0.6 },
  ]

  const heroStats = [
    { val: '$2.4M+', label: 'Awarded', icon: '🎖️' },
    { val: '15K+', label: 'Students Helped', icon: '👥' },
    { val: '2,400+', label: 'Scholarships', icon: '🎓' },
    { val: '96%', label: 'Success Rate', icon: '📈' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f9ff' }}>
      {/* Top nav */}
      <header className="flex items-center justify-between gap-4 px-6 md:px-12 py-4 sticky top-0 z-30" style={{ background: 'rgba(252,253,255,0.94)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #eef1f7' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f1f3d,#1d4ed8)' }}>
            <GradCap size={24} opacity={1} />
          </div>
          <span className="font-display text-2xl tracking-tight" style={{ color: '#0f1f3d' }}>Scholar<span style={{ color: '#f59e0b' }}>Sync</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-9 text-[15px] font-semibold" style={{ color: '#1f2f4d' }}>
          {['Scholarships', 'How It Works', 'Success Stories', 'About'].map(item => (
            <a key={item} href="#" className="transition-colors hover:text-amber-600">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="hidden sm:block px-4 py-2 rounded-xl text-[15px] font-semibold transition-colors hover:text-amber-600" style={{ color: '#1f2f4d' }}>Sign In</button>
          <button onClick={onRegister} className="px-6 py-3 rounded-xl text-[15px] font-bold transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg,#f6b731,#e79f16)', color: '#fff', boxShadow: '0 8px 20px rgba(231,159,22,0.35)' }}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden flex-1">
        {/* Sky + graduates background */}
        <img
          src={heroBg}
          alt="Graduating students celebrating on campus"
          width={1920}
          height={1088}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(232,241,252,0.55) 0%,rgba(255,251,240,0.25) 45%,rgba(255,252,244,0.55) 100%)' }} />

        {/* Floating 3D graduation caps */}
        {caps.map((c, i) => (
          <img
            key={i}
            src={c.src}
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none hidden sm:block"
            style={{
              top: c.top,
              left: c.left,
              right: c.right as string | undefined,
              width: c.size,
              opacity: c.opacity,
              transform: `rotate(${c.rotate})`,
              filter: 'drop-shadow(0 18px 30px rgba(15,31,61,0.18))',
              animationName: 'float-up',
              animationDuration: c.dur,
              animationDelay: c.delay,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }}
          />
        ))}

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-14 pb-16 md:pt-20 md:pb-24">
          {/* 3D headline */}
          <div className="text-center">
            <h1 className="font-body font-extrabold leading-[0.82] uppercase">
              <span className="block text-[3.4rem] sm:text-[5rem] lg:text-[7.5rem] tracking-tight text-3d-navy">Your Future</span>
              <span className="block text-[5rem] sm:text-[8rem] lg:text-[12rem] tracking-tight text-3d-gold">Starts</span>
            </h1>

            <h2 className="mt-8 md:mt-10 text-2xl md:text-3xl font-bold" style={{ color: '#12305c' }}>
              Find Scholarships That Open Doors
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg leading-relaxed" style={{ color: '#42556f' }}>
              Discover scholarships perfectly matched to your education, eligibility, interests, and financial needs — powered by AI that understands your unique journey.
            </p>

            <div className="mt-8 flex justify-center">
              <button
                onClick={onRegister}
                className="inline-flex items-center gap-3 px-9 py-4 rounded-full text-lg font-extrabold transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#f8c24a,#e69a12)', color: '#12305c', boxShadow: '0 14px 34px rgba(230,154,18,0.4)' }}
              >
                <span aria-hidden="true">🔍</span> Find Scholarships
              </button>
            </div>
            {welcomeBackName && onContinue && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="font-semibold" style={{ color: '#12305c' }}>Welcome back, {welcomeBackName}</p>
                <button onClick={onContinue} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#1d4ed8' }}>
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Floating highlight cards */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:absolute lg:right-8 lg:top-1/2 lg:mt-0 lg:w-[320px] lg:grid-cols-1 lg:-translate-y-6">
            <div className="rounded-2xl px-5 py-4 flex items-center gap-4 animate-float" style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 16px 40px rgba(15,31,61,0.14)', backdropFilter: 'blur(6px)' }}>
              <span className="text-3xl" aria-hidden="true">🏆</span>
              <div>
                <p className="text-sm font-bold" style={{ color: '#12305c' }}>Top Match Found!</p>
                <p className="font-display text-2xl" style={{ color: '#0f1f3d' }}>$25,000</p>
                <p className="text-xs" style={{ color: '#64748b' }}>National Merit Award</p>
              </div>
            </div>
            <div className="rounded-2xl px-5 py-4 flex items-center gap-4 animate-float-slow" style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 16px 40px rgba(15,31,61,0.14)', backdropFilter: 'blur(6px)' }}>
              <span className="text-3xl" aria-hidden="true">🕐</span>
              <div>
                <p className="text-sm font-bold" style={{ color: '#12305c' }}>Closing Soon</p>
                <p className="text-base font-semibold" style={{ color: '#e69a12' }}>Rural Excellence</p>
                <p className="text-xs" style={{ color: '#64748b' }}>3 days left</p>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="relative mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {heroStats.map(s => (
              <div key={s.label} className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 12px 30px rgba(15,31,61,0.1)', backdropFilter: 'blur(6px)' }}>
                <span className="text-2xl" aria-hidden="true">{s.icon}</span>
                <div>
                  <p className="font-display text-xl" style={{ color: '#0f1f3d' }}>{s.val}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#1d4ed8' }}>Simple Process</p>
          <h2 className="font-display text-3xl md:text-4xl" style={{ color: '#0f1f3d' }}>How ScholarMatch Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px" style={{ background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)', zIndex: 0 }} />
          {[
            { step: '01', icon: '👤', title: 'Build Your Profile', desc: 'Enter your academic background, interests, financial situation, and goals. Takes under 5 minutes.' },
            { step: '02', icon: '🤖', title: 'AI Finds Your Matches', desc: 'Our AI scans 2,400+ scholarships and ranks them by how likely you are to qualify and win.' },
            { step: '03', icon: '🏆', title: 'Apply & Succeed', desc: 'Track deadlines, get guided applications, and celebrate your scholarship wins with our community.' },
          ].map((item, i) => (
            <div key={i} className="relative text-center group">
              <div className="w-24 h-24 rounded-3xl mx-auto mb-5 flex flex-col items-center justify-center transition-all group-hover:scale-105" style={{ background: 'linear-gradient(135deg,#0f1f3d,#1e3a6e)', boxShadow: '0 12px 32px rgba(15,31,61,0.2)' }}>
                <span className="text-3xl">{item.icon}</span>
                <span className="text-xs font-bold mt-0.5" style={{ color: '#f59e0b' }}>{item.step}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: '#0f1f3d' }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured scholarships preview */}
      <section className="py-16" style={{ background: '#f0f4ff' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#1d4ed8' }}>Trending Now</p>
              <h2 className="font-display text-3xl" style={{ color: '#0f1f3d' }}>Featured Scholarships</h2>
            </div>
            <button onClick={onEnter} className="text-sm font-semibold flex items-center gap-1 transition-all hover:gap-2" style={{ color: '#1d4ed8' }}>
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ALL_SCHOLARSHIPS.slice(0, 3).map(s => (
              <div
                key={s.id}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: '#fff', border: '1px solid #e8edf5' }}
                onClick={onEnter}
              >
                <div style={{ height: 3, background: `linear-gradient(90deg,${s.accent},${s.accent}66)`, borderRadius: 99, marginBottom: 16 }} />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${s.accent}14` }}>{s.logo}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{s.provider}</p>
                  </div>
                </div>
                <p className="font-display text-2xl font-semibold mb-1" style={{ color: s.accent }}>{s.amountLabel}</p>
                <p className="text-xs mb-3" style={{ color: '#64748b' }}>{s.eligibility}</p>
                <div className="flex items-center justify-between">
                  <MatchPill pct={s.match} />
                  <DeadlinePill date={s.deadlineDate} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success stories */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#f59e0b' }}>Real Students, Real Results</p>
          <h2 className="font-display text-3xl md:text-4xl" style={{ color: '#0f1f3d' }}>Success Stories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUCCESS_STORIES.map((story, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 4px 20px rgba(15,31,61,0.06)' }}>
              <div className="relative h-28 overflow-hidden">
                <img src={story.bgImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(15,31,61,0.8),rgba(15,31,61,0.3))' }} />
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                  <img src={story.avatar} alt={story.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                  <div>
                    <p className="text-sm font-semibold text-white">{story.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${story.tagColor}cc`, color: '#fff' }}>{story.tag}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-bold mb-1" style={{ color: story.tagColor }}>{story.award}</p>
                <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>{story.university}</p>
                <p className="text-xs leading-relaxed italic" style={{ color: '#475569' }}>"{story.quote}"</p>
                <div className="flex gap-0.5 mt-3">
                  {Array(5).fill(0).map((_, j) => <span key={j} className="text-xs" style={{ color: '#f59e0b' }}>★</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-6 md:mx-12 mb-16 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f1f3d,#1d4ed8)' }}>
        <div className="relative px-8 md:px-16 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="absolute animate-float" style={{ top: `${10 + i * 25}%`, right: `${5 + i * 8}%`, opacity: 0.15, animationDelay: `${i}s` }}>
                <GradCap size={40 + i * 10} opacity={1} />
              </div>
            ))}
          </div>
          <div className="relative">
            <h2 className="font-display text-2xl md:text-3xl text-white mb-2">Ready to fund your future?</h2>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Join 15,000+ students who found scholarships through ScholarMatch</p>
          </div>
          <button
            onClick={onRegister}
            className="relative shrink-0 px-8 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#0f1f3d', boxShadow: '0 8px 24px rgba(245,158,11,0.4)' }}
          >
            Start Finding Scholarships →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs" style={{ color: '#94a3b8', borderTop: '1px solid #e8edf5' }}>
        ScholarMatch © 2026 · Helping students achieve their dreams ✨ · <span style={{ color: '#1d4ed8' }}>Privacy</span> · <span style={{ color: '#1d4ed8' }}>Terms</span>
      </footer>
    </div>
  )
}

// ─── Scholarship Detail page ─────────────────────────────────────────────────
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#94a3b8', letterSpacing: '0.06em' }}>{eyebrow}</p>
      <h2 className="font-display text-xl" style={{ color: '#0f1f3d' }}>{title}</h2>
    </div>
  )
}

function ScholarshipDetail({
  s, onBack, onSave, onApply, onGoProfile,
}: {
  s: Scholarship
  onBack: () => void
  onSave: (id: number) => void
  onApply: (id: number) => void
  onGoProfile: () => void
}) {
  const unmetGaps = s.gapAnalysis.filter(g => g.status !== 'Met')

  return (
    <div className="max-w-5xl">
      {/* Back + header */}
      <button onClick={onBack} className="text-sm font-medium mb-5 flex items-center gap-1.5 transition-all hover:gap-2.5" style={{ color: '#64748b' }}>
        ← Back to matches
      </button>

      <div className="rounded-2xl p-6 mb-8 flex flex-col lg:flex-row lg:items-center gap-5 justify-between"
        style={{ background: 'linear-gradient(135deg,#0f1f3d 0%,#1e3a6e 60%,#1d4ed8 100%)' }}>
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>{s.logo}</div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-white leading-snug">{s.name}</h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>{s.provider} · {s.country}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {s.eligible ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(240,253,244,0.15)', color: '#4ade80' }}>✓ Eligible</span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(254,242,242,0.15)', color: '#f87171' }}>NOT ELIGIBLE YET</span>
              )}
              {s.applied && <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(240,253,244,0.15)', color: '#4ade80' }}>✓ {s.status}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <RingChart value={s.match} size={64} thickness={7} color="#fbbf24" label="score" />
          <div className="flex flex-col gap-2">
            <button onClick={() => onSave(s.id)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: s.saved ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)', color: s.saved ? '#fbbf24' : '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              {s.saved ? '★ Saved' : '☆ Save'}
            </button>
            {s.applied ? (
              <span className="px-4 py-2 rounded-xl text-xs font-bold text-center" style={{ background: '#f0fdf4', color: '#15803d' }}>✓ {s.status}</span>
            ) : (
              <button onClick={() => onApply(s.id)} disabled={!s.eligible} className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={s.eligible ? { background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#0f1f3d' } : { background: 'rgba(255,255,255,0.08)', color: '#64748b', cursor: 'not-allowed' }}>
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          <section>
            <SectionHeading eyebrow="01 · Overview" title="Overview" />
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#475569' }}>{s.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Award', value: `${s.amountLabel}/yr` },
                { label: 'Deadline', value: s.deadline },
                { label: 'Applicants', value: s.applicants.toLocaleString() },
                { label: 'Renewable', value: s.renewable ? 'Yes' : 'No' },
              ].map(f => (
                <div key={f.label} className="rounded-xl p-3" style={{ background: '#f8fafc' }}>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{f.label}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: '#0f1f3d' }}>{f.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Eligibility Requirements */}
          <section>
            <SectionHeading eyebrow="02 · Eligibility" title="Eligibility Requirements" />
            <p className="text-sm mb-3" style={{ color: '#475569' }}>{s.eligibility}</p>
            <div className="flex flex-wrap gap-2">
              {s.requirements.map(r => (
                <span key={r} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: `${s.accent}0f`, color: s.accent }}>{r}</span>
              ))}
            </div>
          </section>

          {/* Profile vs Requirements */}
          <section>
            <SectionHeading eyebrow="03 · AI Matching" title="Your Profile vs Requirements" />
            <p className="text-sm mb-4" style={{ color: '#64748b' }}>How your current profile compares against each eligibility criterion.</p>
            <GapAnalysisTable rows={s.gapAnalysis} />
          </section>

          {/* Why this scholarship */}
          <section>
            <SectionHeading eyebrow="04 · Explanation" title="Why This Scholarship?" />
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#475569' }}>{s.whyMatch}</p>
            {s.matchFactors.length > 0 && (
              <div className="space-y-2">
                {s.matchFactors.map(f => (
                  <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#0f1f3d' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: '#059669' }}>✓</span>{f}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Gap Analysis (only if there are gaps) */}
          {unmetGaps.length > 0 && (
            <section>
              <SectionHeading eyebrow="05 · Gap Analysis" title="Gap Analysis" />
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                {unmetGaps.length} of {s.gapAnalysis.length} criteria currently unmet.
              </p>
              <div className="space-y-3">
                {unmetGaps.map(g => (
                  <div key={g.requirement} className="rounded-xl p-4 flex items-start justify-between gap-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{g.requirement}</p>
                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>You have: {g.yourValue} · Required: {g.required}</p>
                      <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{g.gap}</p>
                    </div>
                    <GapStatusPill status={g.status} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Improvement Roadmap — rule-based, specific to this scholarship */}
          <section>
            <SectionHeading eyebrow="06 · Roadmap" title="Improvement Roadmap" />
            <ImprovementRoadmapPanel
              scholarshipId={s.id}
              scholarshipName={s.name}
              accent={s.accent}
              onGoProfile={onGoProfile}
            />
          </section>

          {/* Next Steps */}
          <section>
            <SectionHeading eyebrow="07 · Next Steps" title="Next Steps" />
            {s.eligible ? (
              <div className="rounded-2xl p-5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#15803d' }}>You meet the eligibility criteria — prepare these to apply:</p>
                <div className="space-y-2">
                  {s.requirements.map(r => (
                    <div key={r} className="flex items-center gap-2.5 text-sm" style={{ color: '#166534' }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: '#dcfce7', color: '#15803d' }}>✓</span>{r}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#92400e' }}>Work through the roadmap above, then update your profile to re-check eligibility.</p>
                <button onClick={onGoProfile} className="mt-2 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: '#f59e0b', color: '#0f1f3d' }}>
                  Update Profile →
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right rail: match score breakdown */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 sticky top-20" style={{ background: 'linear-gradient(160deg,#0f1f3d,#162a52)' }}>
            <h3 className="text-sm font-semibold mb-4 text-white">Match / Recommendation Score</h3>
            <div className="flex flex-col items-center mb-4">
              <RingChart value={s.match} size={100} thickness={9} color="#f59e0b" label="overall match" />
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Eligibility criteria met', val: Math.round(100 * s.gapAnalysis.filter(g => g.status === 'Met').length / Math.max(1, s.gapAnalysis.length)) },
                { label: 'Competitiveness (vs applicant pool)', val: Math.max(20, 100 - Math.round(s.applicants / 200)) },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
                    <span>{row.label}</span>
                    <span className="font-bold" style={{ color: '#fbbf24' }}>{row.val}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${row.val}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard shell ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'home', label: 'Dashboard', icon: '⊞' },
  { key: 'scholarships', label: 'Scholarships', icon: '🎓' },
  { key: 'profile', label: 'My Profile', icon: '👤' },
  { key: 'applications', label: 'Applications', icon: '📋' },
  { key: 'saved', label: 'Saved', icon: '🔖' },
  { key: 'compare', label: 'Compare', icon: '⇄' },
]

function DashboardShell({ onBack, session }: { onBack: () => void; session: AuthSession | null }) {
  const [activeNav, setActiveNav] = useState('home')
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [data, setData] = useState<Scholarship[]>(ALL_SCHOLARSHIPS)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [aiPhase, setAiPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [aiResponse, setAiResponse] = useState<RecommendationResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [dashTab, setDashTab] = useState<'recommended' | 'closing' | 'recent'>('recommended')
  const [detailId, setDetailId] = useState<number | null>(null)
  useEffect(() => {
    const profileId = session?.account.studentProfileId
    const token = session?.token
    if (!token || !profileId) {
      setProfile(null)
      setProfileError(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfile(null)
    setProfileLoading(true)
    setProfileError(null)
    getProfile(token, profileId)
      .then(response => { if (active) setProfile(response.data) })
      .catch(error => { if (active) setProfileError(error instanceof Error ? error.message : 'Unable to load your profile.') })
      .finally(() => { if (active) setProfileLoading(false) })
    return () => { active = false }
  }, [session?.account.studentProfileId, session?.token])

  const handleSave = (id: number) => setData(prev => prev.map(s => s.id === id ? { ...s, saved: !s.saved } : s))
  const handleApply = (id: number) => setData(prev => prev.map(s => s.id === id ? { ...s, applied: true, status: 'Submitted' } : s))
  const handleCompare = (id: number) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }
  const openDetail = (id: number) => setDetailId(id)
  const closeDetail = () => setDetailId(null)
  const goToNav = (key: string) => { setActiveNav(key); setDetailId(null); setMobileOpen(false) }
  const handleRunAiAnalysis = async () => {
    const profileId = session?.account.studentProfileId
    if (!session?.token || !profileId) {
      setAiError('Sign in with a student account before running an AI analysis.')
      setAiPhase('error')
      return
    }
    setAiError(null)
    setAiResponse(null)
    setAiPhase('loading')
    try {
      const response = await getRecommendations(session.token, profileId)
      if (!response.data.mlServiceReachable) {
        throw new Error(response.data.message || 'The ML recommendation service is unavailable.')
      }
      setAiResponse(response.data)
      setAiPhase('done')
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to retrieve AI recommendations.')
      setAiPhase('error')
    }
  }

  const filtered = data.filter(s =>
    (catFilter === 'All' || s.category === catFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.provider.toLowerCase().includes(search.toLowerCase()))
  )
  const recommended = [...filtered].sort((a, b) => b.match - a.match)
  const closingSoon = [...data].sort((a, b) => daysLeft(a.deadlineDate) - daysLeft(b.deadlineDate))
  const recentAdded = [...data].slice().reverse()
  const saved = data.filter(s => s.saved)
  const applied = data.filter(s => s.applied)
  const categories = ['All', 'Merit', 'Diversity', 'Leadership', 'Need-based', 'First-Gen', 'Arts']

  const currentDashList = dashTab === 'recommended' ? recommended.slice(0, 6) : dashTab === 'closing' ? closingSoon.slice(0, 6) : recentAdded.slice(0, 6)

  const cardProps = { onSave: handleSave, onApply: handleApply, onCompare: handleCompare, compareList: compareIds, onDetails: openDetail }

  // ── Sidebar
  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? 'w-64' : 'w-60 hidden lg:flex'} flex-col min-h-screen sticky top-0`} style={{ background: '#0f1f3d' }}>
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>
          <GradCap size={22} opacity={1} />
        </div>
        <span className="font-display text-xl text-white">Scholar<span style={{ color: '#f59e0b' }}>Sync</span></span>
      </div>

      {/* Student mini card */}
      <div className="mx-3 mb-4 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <img src="https://images.unsplash.com/photo-1775702764414-ce4c66079a70?w=48&h=48&fit=crop&auto=format" alt="Student" className="w-10 h-10 rounded-xl object-cover" style={{ border: '2px solid rgba(245,158,11,0.5)' }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile?.fullName || '—'}</p>
            <p className="text-xs truncate" style={{ color: '#64748b' }}>{profile?.email || '—'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.key
          return (
            <button
              key={item.key}
              onClick={() => goToNav(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
              style={active ? { background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff', boxShadow: '0 4px 16px rgba(29,78,216,0.4)' } : { color: '#94a3b8' }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.key === 'compare' && compareIds.length > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: '#f59e0b', color: '#0f1f3d' }}>{compareIds.length}</span>
              )}
              {item.key === 'saved' && saved.length > 0 && (
                <span className="ml-auto text-xs" style={{ color: active ? '#fbbf24' : '#64748b' }}>{saved.length}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
          style={{ color: '#64748b' }}
        >
          ← Back to Home
        </button>
      </div>
    </aside>
  )

  // ── Home dashboard
  const eligibleCount = data.filter(s => s.eligible).length
  const improvableCount = data.filter(s => !s.eligible).length
  const soonCount = data.filter(s => daysLeft(s.deadlineDate) <= 30).length
  const dashRecs = currentDashList.slice(0, 4)

  const HomeDash = () => (
    <div>
      {/* ── 1. Page title + short explanation (inside hero) ── */}
      <div className="relative rounded-2xl overflow-hidden mb-8 p-7 lg:p-8" style={{ background: 'linear-gradient(135deg,#0f1f3d 0%,#1e3a6e 55%,#1d4ed8 100%)', minHeight: 180 }}>
        {/* 3D-ish decorative background: floating caps + soft depth orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute rounded-full animate-float-slow" style={{ width: 260, height: 260, top: -90, right: -60, background: 'radial-gradient(circle at 35% 35%, rgba(245,158,11,0.35), transparent 70%)', filter: 'blur(2px)', transform: 'perspective(600px) rotateX(20deg)' }} />
          <div className="absolute rounded-full animate-float" style={{ width: 180, height: 180, bottom: -70, left: '38%', background: 'radial-gradient(circle at 40% 40%, rgba(29,78,216,0.45), transparent 70%)', filter: 'blur(1px)' }} />
          {[
            { t: '10%', l: '3%', s: 44, d: '0s' },
            { t: '60%', l: '8%', s: 30, d: '2s' },
            { t: '18%', r: '10%', s: 34, d: '1s' },
          ].map((f, i) => (
            <div key={i} className="absolute animate-float" style={{ top: f.t, left: f.l, right: f.r as string | undefined, animationDelay: f.d, opacity: 0.2 }}>
              <GradCap size={f.s} opacity={1} />
            </div>
          ))}
        </div>
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>{profile?.fullName ? `Welcome back, ${profile.fullName}` : 'Welcome back'}</p>
            <h1 className="font-display text-2xl lg:text-3xl text-white mb-2">Your Scholarship Dashboard</h1>
            <p className="text-sm max-w-lg leading-relaxed" style={{ color: '#94a3b8' }}>
              A live snapshot of your best-fit scholarships, your eligibility standing, and what to do next — {soonCount > 0 ? <><span style={{ color: '#fbbf24', fontWeight: 700 }}>{soonCount} deadlines</span> are coming up in the next 30 days.</> : 'no urgent deadlines right now.'}
            </p>
          </div>
          <div className="relative flex gap-3 shrink-0">
            <button onClick={() => goToNav('scholarships')} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#0f1f3d', boxShadow: '0 6px 20px rgba(245,158,11,0.35)' }}>
              🔍 Find More
            </button>
            <button onClick={() => goToNav('profile')} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              ✓ Eligibility Check
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Important summary metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
        {[
          { label: 'Eligible Now', value: eligibleCount, icon: '✓', color: '#059669', bg: '#f0fdf4' },
          { label: 'Needs Improvement', value: improvableCount, icon: '◐', color: '#d97706', bg: '#fffbeb' },
          { label: 'Applications Sent', value: applied.length, icon: '📋', color: '#7c3aed', bg: '#f5f3ff' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs leading-tight mt-1.5" style={{ color: '#64748b' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3 & 4. Main recommendations + supporting info ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 items-start">
        {/* Main: Best Matches */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-xl mb-1" style={{ color: '#0f1f3d' }}>Your Best Scholarship Matches</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>Ranked by fit for your profile — eligible matches first, plus what to fix for the rest.</p>
            </div>
            <div className="flex gap-0.5 p-1 rounded-xl shrink-0" style={{ background: '#f1f5f9' }}>
              {([['recommended', '⭐ Recommended'], ['closing', '⏰ Closing Soon'], ['recent', '🆕 Recent']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setDashTab(key)}
                  className="py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={dashTab === key ? { background: '#fff', color: '#0f1f3d', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' } : { color: '#64748b' }}
                >{label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {dashRecs.map((s, i) => (
              <RecommendationCard key={s.id} s={s} rank={i + 1} onDetails={openDetail} onSave={handleSave} />
            ))}
          </div>

          <button onClick={() => goToNav('scholarships')} className="w-full mt-5 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white"
            style={{ background: '#fff', color: '#1d4ed8', border: '1px solid #e2e8f0' }}>
            View all {filtered.length} scholarships →
          </button>
        </div>

        {/* Supporting info */}
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#0f1f3d' }}>Your Profile</h3>
            {profileLoading ? (
              <p className="text-xs" style={{ color: '#64748b' }}>Loading your profile...</p>
            ) : profileError || !profile ? (
              <p className="text-xs" style={{ color: '#64748b' }}>Profile details are unavailable.</p>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="flex justify-between gap-3" style={{ color: '#64748b' }}><span>Degree</span><strong style={{ color: '#0f1f3d' }}>{profile.degree || '—'}</strong></p>
                <p className="flex justify-between gap-3" style={{ color: '#64748b' }}><span>Year of Study</span><strong style={{ color: '#0f1f3d' }}>{profile.yearOfStudy ?? '—'}</strong></p>
                <p className="flex justify-between gap-3" style={{ color: '#64748b' }}><span>GPA</span><strong style={{ color: '#0f1f3d' }}>{profile.gpa ?? '—'}</strong></p>
              </div>
            )}
            <button onClick={() => goToNav('profile')} className="w-full mt-4 py-2 rounded-lg text-xs font-semibold" style={{ color: '#1d4ed8', border: '1px solid #c7d7ff' }}>View My Profile</button>
          </div>

          {/* AI Recommendation */}
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h3 className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>AI Scholarship Match</h3>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#f0f4ff', color: '#1d4ed8' }}>Beta</span>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: '#64748b' }}>
              Our AI analyzes 48+ profile dimensions to surface scholarships where you have the highest probability of winning.
            </p>
            {aiPhase === 'idle' && (
              <button
                onClick={handleRunAiAnalysis}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', boxShadow: '0 4px 16px rgba(29,78,216,0.3)' }}
              >
                ✨ Run AI Analysis
              </button>
            )}
            {aiPhase === 'loading' && (
              <div className="text-center py-3 text-xs" style={{ color: '#64748b' }}>Loading recommendations...</div>
            )}
            {aiPhase === 'done' && (
              <div className="space-y-2 animate-slide-in">
                {aiResponse?.recommendations.map(r => (
                  <div key={r.scholarshipId} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ border: '1px solid #f0f4ff' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#0f1f3d' }}>{r.name}</p>
                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>{r.description}</p>
                      <p className="text-xs mt-1" style={{ color: r.eligible ? '#15803d' : '#b45309' }}>{r.scholarshipId} · {r.eligible ? 'Eligible' : 'Not eligible'}</p>
                    </div>
                    <MatchPill pct={r.matchPercentage} />
                  </div>
                ))}
                {aiResponse?.recommendations.length === 0 && <p className="text-xs py-2" style={{ color: '#64748b' }}>The recommendation service returned no scholarships.</p>}
                <button onClick={() => setAiPhase('idle')} className="w-full text-xs py-1.5 rounded-lg mt-1" style={{ color: '#94a3b8' }}>↺ Refresh</button>
              </div>
            )}
            {aiPhase === 'error' && (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: '#b91c1c' }}>{aiError}</p>
                <button onClick={handleRunAiAnalysis} className="w-full text-xs py-2 rounded-lg font-semibold" style={{ color: '#1d4ed8', border: '1px solid #c7d7ff' }}>Try again</button>
              </div>
            )}
          </div>

          {/* Application Tracker */}
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#0f1f3d' }}>
              <span>📋</span> Application Tracker
            </h3>
            {applied.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-1">📭</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>No applications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applied.map(s => (
                  <div key={s.id} onClick={() => openDetail(s.id)} className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50" style={{ background: '#f8fafc' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `${s.accent}14` }}>{s.logo}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#0f1f3d' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{s.status}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: '#f0fdf4', color: '#15803d' }}>✓</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Actions / next steps ── */}
      {/* Success stories strip — supporting/trust content */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl" style={{ color: '#0f1f3d' }}>Success Stories</h2>
          <span className="text-xs font-semibold" style={{ color: '#64748b' }}>From our community</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUCCESS_STORIES.map((story, i) => (
            <div key={i} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
              <div className="relative h-24 overflow-hidden">
                <img src={story.bgImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(15,31,61,0.85),rgba(15,31,61,0.2))' }} />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2">
                  <img src={story.avatar} alt={story.name} className="w-8 h-8 rounded-full object-cover" style={{ border: '2px solid #fff' }} />
                  <div>
                    <p className="text-xs font-bold text-white">{story.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{story.university.split('·')[0]}</p>
                  </div>
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-xs font-bold mb-1" style={{ color: story.tagColor }}>{story.award}</p>
                <p className="text-xs leading-relaxed italic" style={{ color: '#475569' }}>"{story.quote.slice(0, 100)}…"</p>
                <div className="flex gap-0.5 mt-2">
                  {Array(5).fill(0).map((_, j) => <span key={j} className="text-xs" style={{ color: '#f59e0b' }}>★</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Browse all scholarships
  const BrowsePage = () => (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl mb-1" style={{ color: '#0f1f3d' }}>Browse Scholarships</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>{filtered.length} scholarships matching your profile</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, provider…"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f1f3d' }} />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={catFilter === c ? { background: '#1d4ed8', color: '#fff', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' } : { background: '#fff', color: '#475569', border: '1px solid #e2e8f0' }}>
            {c}
          </button>
        ))}
      </div>
      {compareIds.length > 0 && (
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
          <span className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>⇄ {compareIds.length} selected for comparison</span>
          <button onClick={() => setShowCompareModal(true)} className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#1d4ed8' }}>Compare Now</button>
          <button onClick={() => setCompareIds([])} className="text-xs" style={{ color: '#94a3b8' }}>Clear</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => <ScholarCard key={s.id} s={s} {...cardProps} />)}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-lg mb-1" style={{ color: '#0f1f3d' }}>No scholarships found</p>
            <p className="text-sm" style={{ color: '#64748b' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )

  const profileSections: Array<{ title: string; icon: string; fields: Array<[string, string]> }> = profile ? [
    { title: 'Personal Information', icon: '👤', fields: [
      ['Email', profile.email || '—'], ['Phone', profile.phone || '—'], ['Date of Birth', profile.dob || '—'], ['Gender', profile.gender || '—'],
    ] },
    { title: 'Education', icon: '🎓', fields: [
      ['Degree', profile.degree || '—'], ['Institution', profile.legacyInstitutionName || '—'], ['Institution ID', profile.institutionId || '—'],
      ['Year of Study', profile.yearOfStudy == null ? '—' : String(profile.yearOfStudy)], ['GPA', profile.gpa == null ? '—' : String(profile.gpa)], ['Field of Study', profile.fieldOfStudy || '—'],
      ['Semester', profile.semester == null ? '—' : String(profile.semester)], ['Total Credits', profile.totalCredits == null ? '—' : String(profile.totalCredits)],
      ['Class Code', profile.classCode || '—'], ['Extracurricular Points', profile.extracurricularPoint == null ? '—' : String(profile.extracurricularPoint)],
      ['Failed Course', profile.hasFailedCourse == null ? '—' : profile.hasFailedCourse ? 'Yes' : 'No'],
    ] },
    { title: 'Interests & Achievements', icon: '💡', fields: [
      ['Interests', profile.interests?.length ? profile.interests.join(', ') : '—'], ['Achievements', profile.achievements?.length ? profile.achievements.join(', ') : '—'],
    ] },
    { title: 'Financial & Background', icon: '📊', fields: [
      ['Income Bracket', profile.incomeBracket || '—'], ['Category', profile.category || '—'],
      ['First Generation', profile.isFirstGeneration == null ? '—' : profile.isFirstGeneration ? 'Yes' : 'No'],
      ['Rural Background', profile.ruralBackground == null ? '—' : profile.ruralBackground ? 'Yes' : 'No'],
    ] },
  ] : []

  // ── Profile
  const ProfilePage = () => (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl mb-5" style={{ color: '#0f1f3d' }}>My Profile</h1>
      {profileLoading && <p className="text-sm mb-5" style={{ color: '#64748b' }}>Loading your profile...</p>}
      {profileError && <p className="text-sm mb-5" style={{ color: '#b91c1c' }}>{profileError}</p>}
      {!profileLoading && !profileError && !profile && <p className="text-sm mb-5" style={{ color: '#64748b' }}>No profile is available for this account.</p>}
      {!profile ? null : <>
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg,#0f1f3d,#1e3a6e)' }}>
        <div className="relative h-28" style={{ background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)' }}>
          <img src="https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?w=800&h=200&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row items-start sm:items-end gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white" style={{ background: '#1d4ed8', border: '3px solid #0f1f3d' }} aria-hidden="true">👤</div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-white">{profile.fullName || '—'}</h2>
            <p className="text-sm" style={{ color: '#94a3b8' }}>{[profile.degree, profile.legacyInstitutionName, profile.yearOfStudy == null ? undefined : `Year ${profile.yearOfStudy}`].filter(Boolean).join(' · ') || '—'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {[profile.category, ...(profile.interests || [])].filter(Boolean).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {profileSections.map(section => (
          <div key={section.title} className="rounded-2xl p-5 transition-all hover:shadow-md" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#0f1f3d' }}>
              <span className="text-base">{section.icon}</span> {section.title}
            </h3>
            <div className="space-y-2.5">
              {section.fields.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-xs shrink-0" style={{ color: '#64748b' }}>{label}</span>
                  <span className="text-xs font-semibold text-right" style={{ color: value === '—' ? '#94a3b8' : '#0f1f3d' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      </>}
    </div>
  )

  // ── Applications page
  const AppsPage = () => (
    <div>
      <h1 className="font-display text-2xl mb-2" style={{ color: '#0f1f3d' }}>My Applications</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>Track the status of every scholarship you have applied to</p>
      {applied.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-xl font-semibold mb-2" style={{ color: '#0f1f3d' }}>No applications yet</p>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>Find and apply to scholarships to track them here</p>
          <button onClick={() => setActiveNav('scholarships')} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>Browse Scholarships</button>
        </div>
      ) : (
        <div className="space-y-3">
          {applied.map(s => (
            <div key={s.id} className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${s.accent}14` }}>{s.logo}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: '#0f1f3d' }}>{s.name}</h3>
                <p className="text-xs" style={{ color: '#64748b' }}>{s.provider} · {s.amountLabel}/yr</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ background: '#f0fdf4', color: '#15803d' }}>✓ {s.status}</span>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Deadline: {s.deadline}</p>
              </div>
            </div>
          ))}
          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#f0f4ff,#fafbff)', border: '1px solid #e8edf5' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#0f1f3d' }}>Application Timeline</h3>
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ background: '#e2e8f0' }} />
              {[
                { event: 'Application submitted to Google Women in Tech Grant', date: 'Aug 12, 2026', done: true },
                { event: 'Application under review by Google.org committee', date: 'Aug 20, 2026', done: true },
                { event: 'Interview scheduled (if shortlisted)', date: 'Sep 15, 2026', done: false },
                { event: 'Final decision announced', date: 'Oct 1, 2026', done: false },
              ].map((ev, i) => (
                <div key={i} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full" style={{ background: ev.done ? '#1d4ed8' : '#e2e8f0', border: '2px solid #fff' }} />
                  <p className="text-xs font-semibold" style={{ color: ev.done ? '#0f1f3d' : '#94a3b8' }}>{ev.event}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{ev.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Saved page
  const SavedPage = () => (
    <div>
      <h1 className="font-display text-2xl mb-2" style={{ color: '#0f1f3d' }}>Saved Scholarships</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>{saved.length} scholarships bookmarked</p>
      {saved.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🔖</p>
          <p className="text-xl font-semibold mb-2" style={{ color: '#0f1f3d' }}>Nothing saved yet</p>
          <p className="text-sm" style={{ color: '#64748b' }}>Tap ☆ on any scholarship card to bookmark it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {saved.map(s => <ScholarCard key={s.id} s={s} {...cardProps} />)}
        </div>
      )}
    </div>
  )

  // ── Compare page
  const ComparePage = () => (
    <div>
      <h1 className="font-display text-2xl mb-2" style={{ color: '#0f1f3d' }}>Compare Scholarships</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>Select up to 3 scholarships using ⇄ on any card to compare them</p>
      {compareIds.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">⇄</p>
          <p className="text-xl font-semibold mb-2" style={{ color: '#0f1f3d' }}>No scholarships selected</p>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>Go to Scholarships and tap ⇄ on cards to add them here</p>
          <button onClick={() => setActiveNav('scholarships')} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>Browse Scholarships</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6 p-3.5 rounded-xl" style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
            <span className="text-sm font-semibold" style={{ color: '#1d4ed8' }}>⇄ {compareIds.length} selected</span>
            <button onClick={() => setShowCompareModal(true)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white ml-auto" style={{ background: '#1d4ed8' }}>Open Full Comparison</button>
            <button onClick={() => setCompareIds([])} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}>Clear All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {compareIds.map(id => {
              const s = data.find(x => x.id === id)!
              return <ScholarCard key={s.id} s={s} {...cardProps} />
            })}
          </div>
        </div>
      )}
    </div>
  )

  const renderPage = () => {
    if (detailId !== null) {
      const s = data.find(x => x.id === detailId)
      if (s) {
        return (
          <ScholarshipDetail
            s={s}
            onBack={closeDetail}
            onSave={handleSave}
            onApply={handleApply}
            onGoProfile={() => goToNav('profile')}
          />
        )
      }
    }
    switch (activeNav) {
      case 'home': return <HomeDash />
      case 'scholarships': return <BrowsePage />
      case 'profile': return <ProfilePage />
      case 'applications': return <AppsPage />
      case 'saved': return <SavedPage />
      case 'compare': return <ComparePage />
      default: return <HomeDash />
    }
  }

  return (
    <div className="flex min-h-screen relative" style={{ background: '#f8f9ff' }}>
      {/* Ambient 3D background accents — fixed, low-opacity, non-interactive */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute animate-float-slow" style={{ width: 420, height: 420, top: -140, right: -120, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, rgba(29,78,216,0.10), transparent 70%)', transform: 'perspective(800px) rotateX(25deg) rotateY(-8deg)' }} />
        <div className="absolute animate-float" style={{ width: 320, height: 320, bottom: -100, left: -80, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(245,158,11,0.08), transparent 70%)', transform: 'perspective(800px) rotateX(-20deg) rotateY(10deg)' }} />
      </div>
      <div className="relative" style={{ zIndex: 1, display: 'contents' }}>
      <Sidebar />

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setMobileOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <Sidebar mobile />
          </div>
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)' }} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center gap-3 px-5 py-3.5"
          style={{ background: 'rgba(248,249,255,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #e8edf5' }}>
          <button className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#fff', border: '1px solid #e2e8f0' }} onClick={() => setMobileOpen(true)}>☰</button>
          <div className="lg:hidden font-display text-lg" style={{ color: '#0f1f3d' }}>Scholar<span style={{ color: '#f59e0b' }}>Sync</span></div>

          <div className="hidden lg:block font-semibold text-sm" style={{ color: '#0f1f3d' }}>
            {NAV_ITEMS.find(n => n.key === activeNav)?.label}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {compareIds.length > 0 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{ background: '#1d4ed8', color: '#fff' }}
              >
                ⇄ Compare {compareIds.length}
              </button>
            )}
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#fff', border: '1px solid #e2e8f0' }}
            >
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />
            </button>
            <img src="https://images.unsplash.com/photo-1775702764414-ce4c66079a70?w=40&h=40&fit=crop&auto=format" alt="Profile" className="w-9 h-9 rounded-xl object-cover" style={{ border: '2px solid #e2e8f0' }} />
          </div>
        </header>

        {/* Notification dropdown */}
        {notifOpen && (
          <div className="fixed top-16 right-4 z-50 w-72 rounded-2xl overflow-hidden animate-slide-in" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(15,31,61,0.2)', border: '1px solid #e8edf5' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-sm font-bold" style={{ color: '#0f1f3d' }}>Notifications</span>
              <button onClick={() => setNotifOpen(false)} style={{ color: '#94a3b8' }}>✕</button>
            </div>
            {[
              { msg: '⚡ Rural Excellence deadline in 3 days!', time: '2h ago', unread: true },
              { msg: '🤖 New NASA STEM Fellowship — 78% match', time: '5h ago', unread: true },
              { msg: '✓ Application to Google WiT submitted', time: '1d ago', unread: true },
              { msg: '📚 Your profile is 73% complete', time: '2d ago', unread: false },
            ].map((n, i) => (
              <div key={i} className="px-4 py-3 flex gap-2.5 transition-colors hover:bg-blue-50" style={{ borderBottom: '1px solid #f8fafc' }}>
                {n.unread && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#1d4ed8' }} />}
                {!n.unread && <div className="w-2 h-2 mt-1.5 shrink-0" />}
                <div>
                  <p className="text-xs font-medium" style={{ color: '#0f1f3d' }}>{n.msg}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 px-5 lg:px-10 py-7 max-w-[1680px] mx-auto w-full">
          {renderPage()}
        </main>

        <footer className="text-center py-4 text-xs" style={{ color: '#94a3b8', borderTop: '1px solid #e8edf5' }}>
          ScholarMatch © 2026 · Empowering students to achieve their dreams ✨
        </footer>
      </div>

      {showCompareModal && compareIds.length > 0 && (
        <CompareModal ids={compareIds} data={data} onClose={() => setShowCompareModal(false)} onSave={handleSave} onApply={handleApply} />
      )}
      </div>
    </div>
  )
}

// ─── AI Loader component ────────────────────────────────────────────────────
function AiLoader({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const steps = ['Analyzing academic profile…', 'Scanning 2,400 scholarships…', 'Calculating match scores…', 'Ranking your top picks…']

  useEffect(() => {
    const interval = setInterval(() => setStep(prev => {
      if (prev >= steps.length - 1) { clearInterval(interval); setTimeout(onDone, 400); return prev }
      return prev + 1
    }), 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: i <= step ? '#1d4ed8' : '#94a3b8' }}>
          <span>{i < step ? '✓' : i === step ? '⟳' : '○'}</span>
          {s}
        </div>
      ))}
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%`, background: 'linear-gradient(90deg,#1d4ed8,#7c3aed)' }} />
      </div>
    </div>
  )
}

// ─── Login Page ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onGoRegister, onBack }: { onLogin: (session: AuthSession) => void; onGoRegister: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [remember, setRemember] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'At least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const response = await loginRequest(email, password)
      onLogin(response.data)
    } catch (error) {
      setErrors({ password: error instanceof Error ? error.message : 'Unable to sign in' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f9ff' }}>
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#060f23 0%,#0f1f3d 45%,#1e3a6e 100%)' }}>
        {/* floating caps */}
        {[
          { t: '5%', l: '6%', s: 60, d: '0s', op: 0.45 },
          { t: '18%', r: '8%', s: 42, d: '1.5s', op: 0.3 },
          { t: '55%', l: '2%', s: 36, d: '3s', op: 0.25 },
          { t: '72%', r: '4%', s: 52, d: '2s', op: 0.35 },
          { t: '88%', l: '18%', s: 28, d: '1s', op: 0.2 },
        ].map((f, i) => (
          <div key={i} className="absolute pointer-events-none animate-float" style={{ top: f.t, left: f.l, right: f.r as string | undefined, animationDelay: f.d, opacity: f.op }}>
            <GradCap size={f.s} opacity={1} />
          </div>
        ))}
        {/* glow orbs */}
        <div className="absolute pointer-events-none" style={{ width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)', top: -100, right: -100 }} />
        <div className="absolute pointer-events-none" style={{ width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(29,78,216,0.2) 0%,transparent 70%)', bottom: 0, left: '5%' }} />

        <div className="relative flex-1 flex flex-col justify-between p-12">
          {/* logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>
              <GradCap size={24} opacity={1} />
            </div>
            <span className="font-display text-2xl text-white">Scholar<span style={{ color: '#f59e0b' }}>Sync</span></span>
          </div>

          {/* center content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#f59e0b' }} />
              2,400+ Scholarships Waiting
            </div>
            <h2 className="font-display text-4xl xl:text-5xl leading-tight text-white mb-5">
              Sign in to unlock your{' '}
              <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>scholarship journey</span>
            </h2>
            <p className="text-base leading-relaxed max-w-md" style={{ color: '#94a3b8' }}>
              Access personalized recommendations, track applications, and connect with 15,000+ students who found their path through ScholarMatch.
            </p>
            {/* mini testimonial */}
            <div className="mt-10 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-sm italic leading-relaxed mb-4" style={{ color: '#e2e8f0' }}>
                "I signed up and within 20 minutes the AI had matched me to 12 scholarships I actually qualified for. Got $20K within 3 months!"
              </p>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1633734973050-d6499a977c17?w=40&h=40&fit=crop&auto=format" alt="Aisha" className="w-10 h-10 rounded-full object-cover" style={{ border: '2px solid rgba(245,158,11,0.5)' }} />
                <div>
                  <p className="text-sm font-semibold text-white">Aisha Okonkwo</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Women in Tech Scholar · Stanford MS</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array(5).fill(0).map((_, j) => <span key={j} style={{ color: '#f59e0b', fontSize: 12 }}>★</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* bottom stats */}
          <div className="flex gap-8">
            {[['$2.4M+', 'Awarded'], ['15K+', 'Students'], ['96%', 'Success Rate']].map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-xl text-white font-semibold">{v}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 xl:px-20 py-12">
        {/* back */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-10 self-start transition-all hover:gap-2.5" style={{ color: '#64748b' }}>
          ← Back to home
        </button>

        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f1f3d,#1d4ed8)' }}>
              <GradCap size={18} opacity={1} />
            </div>
            <span className="font-display text-xl" style={{ color: '#0f1f3d' }}>Scholar<span style={{ color: '#f59e0b' }}>Sync</span></span>
          </div>

          <h1 className="font-display text-3xl mb-1" style={{ color: '#0f1f3d' }}>Welcome back 👋</h1>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>Sign in to continue your scholarship journey</p>

          {/* Social logins */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: '🔵', label: 'Google', bg: '#fff' },
              { icon: '🔷', label: 'Microsoft', bg: '#fff' },
            ].map(btn => (
              <button
                key={btn.label}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                style={{ background: btn.bg, border: '1.5px solid #e2e8f0', color: '#0f1f3d' }}
              >
                <span>{btn.icon}</span> {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: errors.email ? '#dc2626' : '#94a3b8' }}>✉</span>
                <input
                  type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                  placeholder="aanya@university.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: errors.email ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${errors.email ? '#fca5a5' : '#e2e8f0'}`, color: '#0f1f3d' }}
                />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: '#475569' }}>Password</label>
                <button type="button" className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>Forgot password?</button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: errors.password ? '#dc2626' : '#94a3b8' }}>🔒</span>
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: errors.password ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${errors.password ? '#fca5a5' : '#e2e8f0'}`, color: '#0f1f3d' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.password}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0"
                style={{ background: remember ? '#1d4ed8' : '#f8fafc', border: `1.5px solid ${remember ? '#1d4ed8' : '#e2e8f0'}` }}
              >
                {remember && <span className="text-white text-xs">✓</span>}
              </button>
              <span className="text-sm" style={{ color: '#475569' }}>Remember me for 30 days</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: loading ? 'none' : '0 6px 20px rgba(29,78,216,0.35)' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Signing in…
                </>
              ) : 'Sign In to ScholarMatch →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
            Don't have an account?{' '}
            <button onClick={onGoRegister} className="font-bold transition-all hover:underline" style={{ color: '#1d4ed8' }}>
              Create one free →
            </button>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 mt-8 pt-6" style={{ borderTop: '1px solid #f1f5f9' }}>
            {['🔐 SSL Secured', '🛡 No spam', '✓ Free forever'].map(b => (
              <span key={b} className="text-xs" style={{ color: '#94a3b8' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Register Page ────────────────────────────────────────────────────────────
function RegisterPage({ onRegister, onGoLogin, onBack }: { onRegister: (session: AuthSession) => void; onGoLogin: () => void; onBack: () => void }) {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  // Step 1 — Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)

  // Step 2 — Personal
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')

  // Step 3 — Academic
  const [degree, setDegree] = useState('')
  const [institution, setInstitution] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [gpa, setGpa] = useState('')
  const [semester, setSemester] = useState('')
  const [extracurricularPoint, setExtracurricularPoint] = useState('')
  const [totalCredits, setTotalCredits] = useState('')
  const [hasFailedCourse, setHasFailedCourse] = useState('')
  const [classCode, setClassCode] = useState('')
  const [category, setCategory] = useState('')
  const [income, setIncome] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const pwStrength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const pwStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength]
  const pwStrengthColor = ['', '#dc2626', '#d97706', '#2563eb', '#059669'][pwStrength]

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!email) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Required'
    else if (password.length < 8) e.password = 'Min 8 characters'
    if (password !== confirmPw) e.confirmPw = 'Passwords do not match'
    setErrors(e)
    return !Object.keys(e).length
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Required'
    if (!dob) e.dob = 'Required'
    if (!gender) e.gender = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const validateStep3 = () => {
    const e: Record<string, string> = {}
    if (!yearOfStudy) e.yearOfStudy = 'Required'
    if (!gpa) e.gpa = 'Required'
    if (!semester) e.semester = 'Required'
    if (!extracurricularPoint) e.extracurricularPoint = 'Required'
    if (!totalCredits) e.totalCredits = 'Required'
    if (hasFailedCourse === '') e.hasFailedCourse = 'Required'
    if (!classCode.trim()) e.classCode = 'Required'
    if (!agreeTerms) e.terms = 'Please accept terms'
    setErrors(e)
    return !Object.keys(e).length
  }

  const nextStep = async () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3 && validateStep3()) {
      setLoading(true)
      try {
        const response = await registerStudent({
          email, password, fullName, phone: phone || undefined, dob,
          gender: gender.toLowerCase(), degree: degree || undefined,
          legacyInstitutionName: institution.trim() || undefined,
          yearOfStudy: yearOfStudy === 'Final Year' ? 4 : Number.parseInt(yearOfStudy, 10),
          gpa: Number.parseFloat(gpa), semester: Number.parseInt(semester, 10),
          extracurricularPoint: Number.parseFloat(extracurricularPoint),
          totalCredits: Number.parseInt(totalCredits, 10), hasFailedCourse: hasFailedCourse === 'true',
          classCode: classCode.trim(), category: category || undefined,
          incomeBracket: income || undefined,
        })
        onRegister(response.data)
      } catch (error) {
        setErrors({ terms: error instanceof Error ? error.message : 'Unable to create account' })
      } finally { setLoading(false) }
    }
  }

  const inputCls = (field: string) => ({
    background: errors[field] ? '#fef2f2' : '#f8fafc',
    border: `1.5px solid ${errors[field] ? '#fca5a5' : '#e2e8f0'}`,
    color: '#0f1f3d',
  })

  const selectCls = (field: string) => ({
    ...inputCls(field),
    appearance: 'none' as const,
    cursor: 'pointer',
  })

  const steps = [
    { label: 'Account', icon: '🔐' },
    { label: 'Personal', icon: '👤' },
    { label: 'Academic', icon: '🎓' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f9ff' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#060f23 0%,#0f1f3d 50%,#1e3a6e 100%)' }}>
        {[
          { t: '4%', l: '5%', s: 54, d: '0s', op: 0.4 },
          { t: '22%', r: '6%', s: 40, d: '2s', op: 0.28 },
          { t: '58%', l: '3%', s: 44, d: '1s', op: 0.3 },
          { t: '78%', r: '5%', s: 36, d: '3s', op: 0.22 },
        ].map((f, i) => (
          <div key={i} className="absolute pointer-events-none animate-float" style={{ top: f.t, left: f.l, right: f.r as string | undefined, animationDelay: f.d, opacity: f.op }}>
            <GradCap size={f.s} opacity={1} />
          </div>
        ))}
        <div className="absolute pointer-events-none" style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%)', top: -80, right: -80 }} />

        <div className="relative flex-1 flex flex-col justify-between p-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>
              <GradCap size={24} opacity={1} />
            </div>
            <span className="font-display text-2xl text-white">Scholar<span style={{ color: '#f59e0b' }}>Sync</span></span>
          </div>

          <div>
            <h2 className="font-display text-4xl leading-tight text-white mb-5">
              Start your scholarship journey{' '}
              <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>today</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#94a3b8' }}>
              Join 15,000+ students who discovered scholarships they never knew existed — completely free, forever.
            </p>

            {/* Perks */}
            <div className="space-y-3">
              {[
                { icon: '🎯', title: 'AI-Powered Matching', desc: 'Personalized scholarships based on your profile' },
                { icon: '⏰', title: 'Deadline Alerts', desc: 'Never miss an application window' },
                { icon: '📋', title: 'Application Tracker', desc: 'Track every scholarship in one place' },
                { icon: '🏆', title: 'Success Community', desc: 'Learn from winners like you' },
              ].map(p => (
                <div key={p.title} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>{p.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.title}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex -space-x-2">
              {['https://images.unsplash.com/photo-1633734973050-d6499a977c17?w=32&h=32&fit=crop', 'https://images.unsplash.com/photo-1527456519970-af53f5d4cfd4?w=32&h=32&fit=crop', 'https://images.unsplash.com/photo-1608889825272-01f1ddaf4db5?w=32&h=32&fit=crop'].map((src, i) => (
                <img key={i} src={src} alt="Student" className="w-8 h-8 rounded-full object-cover" style={{ border: '2px solid #0f1f3d' }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              <span className="text-white font-semibold">340 students</span> registered this week
            </p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 xl:px-16 py-10 overflow-y-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-8 self-start transition-all hover:gap-2.5" style={{ color: '#64748b' }}>
          ← Back to home
        </button>

        <div className="w-full max-w-lg mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f1f3d,#1d4ed8)' }}>
              <GradCap size={18} opacity={1} />
            </div>
            <span className="font-display text-xl" style={{ color: '#0f1f3d' }}>Scholar<span style={{ color: '#f59e0b' }}>Sync</span></span>
          </div>

          <h1 className="font-display text-3xl mb-1" style={{ color: '#0f1f3d' }}>Create your account</h1>
          <p className="text-sm mb-7" style={{ color: '#64748b' }}>Free forever · Takes under 2 minutes</p>

          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {steps.map((s, i) => {
              const n = i + 1
              const done = step > n
              const active = step === n
              return (
                <div key={s.label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                      style={{
                        background: done ? '#059669' : active ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : '#f1f5f9',
                        color: done || active ? '#fff' : '#94a3b8',
                        boxShadow: active ? '0 4px 14px rgba(29,78,216,0.35)' : 'none',
                      }}
                    >
                      {done ? '✓' : s.icon}
                    </div>
                    <p className="text-xs mt-1 font-medium" style={{ color: active ? '#1d4ed8' : done ? '#059669' : '#94a3b8' }}>{s.label}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all" style={{ background: step > n ? '#059669' : '#e2e8f0' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Step 1: Account Details ── */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-in">
              <div className="grid grid-cols-2 gap-3">
                {[{ icon: '🔵', label: 'Continue with Google' }, { icon: '🔷', label: 'Continue with Microsoft' }].map(btn => (
                  <button key={btn.label} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all hover:shadow-md" style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#0f1f3d' }}>
                    {btn.icon} {btn.label.replace('Continue with ', '')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
                <span className="text-xs" style={{ color: '#94a3b8' }}>or with email</span>
                <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Email Address *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>✉</span>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                    placeholder="you@university.edu" className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={inputCls('email')} />
                </div>
                {errors.email && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Password *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>🔒</span>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                    placeholder="Min 8 characters" className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none" style={inputCls('password')} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#94a3b8' }}>{showPw ? '🙈' : '👁'}</button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= pwStrength ? pwStrengthColor : '#e2e8f0' }} />
                      ))}
                    </div>
                    <p className="text-xs font-medium" style={{ color: pwStrengthColor }}>{pwStrengthLabel} password</p>
                  </div>
                )}
                {errors.password && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Confirm Password *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>🔒</span>
                  <input type="password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setErrors(p => ({ ...p, confirmPw: '' })) }}
                    placeholder="Re-enter password" className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none" style={inputCls('confirmPw')} />
                  {confirmPw && password === confirmPw && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#059669' }}>✓</span>
                  )}
                </div>
                {errors.confirmPw && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.confirmPw}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: Personal Info ── */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-in">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Full Name *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>👤</span>
                  <input value={fullName} onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })) }}
                    placeholder="Aanya Kapoor" className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={inputCls('fullName')} />
                </div>
                {errors.fullName && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>📱</span>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={inputCls('phone')} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Date of Birth *</label>
                  <input type="date" value={dob} onChange={e => { setDob(e.target.value); setErrors(p => ({ ...p, dob: '' })) }}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputCls('dob')} />
                  {errors.dob && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.dob}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#475569' }}>Gender *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Non-binary'].map(g => (
                    <button key={g} type="button" onClick={() => { setGender(g); setErrors(p => ({ ...p, gender: '' })) }}
                      className="py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={gender === g ? { background: '#1d4ed8', color: '#fff', border: '1.5px solid #1d4ed8', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' } : { background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}
                    >{g}</button>
                  ))}
                </div>
                {errors.gender && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>State / Location</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>📍</span>
                  <select className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={selectCls('state')}>
                    <option value="">Select your state</option>
                    {['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Rajasthan', 'Other'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Academic Info ── */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-in">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#0f1f3d' }}>AI Matching Details</h3>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Powers your scholarship match score</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Year of Study *</label>
                    <select value={yearOfStudy} onChange={e => { setYearOfStudy(e.target.value); setErrors(p => ({ ...p, yearOfStudy: '' })) }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={selectCls('yearOfStudy')}>
                      <option value="">Select year</option>
                      {[{ label: '1st Year', value: '1' }, { label: '2nd Year', value: '2' }, { label: '3rd Year', value: '3' }, { label: '4th Year', value: '4' }, { label: '5th Year', value: '5' }, { label: 'Final Year', value: '4' }].map(y => <option key={y.label} value={y.value}>{y.label}</option>)}
                    </select>
                    {errors.yearOfStudy && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.yearOfStudy}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>GPA / CGPA *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>📊</span>
                      <input type="number" min="0" max="10" step="any" value={gpa} onChange={e => { setGpa(e.target.value); setErrors(p => ({ ...p, gpa: '' })) }} placeholder="e.g. 8.7 / 10"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={inputCls('gpa')} />
                    </div>
                    {errors.gpa && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.gpa}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Semester *</label>
                    <select value={semester} onChange={e => { setSemester(e.target.value); setErrors(p => ({ ...p, semester: '' })) }} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={selectCls('semester')}>
                      <option value="">Select semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                    {errors.semester && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.semester}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Extracurricular Points *</label>
                    <input type="number" min="0" max="100" step="any" value={extracurricularPoint} onChange={e => { setExtracurricularPoint(e.target.value); setErrors(p => ({ ...p, extracurricularPoint: '' })) }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputCls('extracurricularPoint')} />
                    {errors.extracurricularPoint && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.extracurricularPoint}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Total Credits *</label>
                    <input type="number" min="0" step="1" value={totalCredits} onChange={e => { setTotalCredits(e.target.value); setErrors(p => ({ ...p, totalCredits: '' })) }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputCls('totalCredits')} />
                    {errors.totalCredits && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.totalCredits}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Has Failed a Course? *</label>
                    <select value={hasFailedCourse} onChange={e => { setHasFailedCourse(e.target.value); setErrors(p => ({ ...p, hasFailedCourse: '' })) }} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={selectCls('hasFailedCourse')}>
                      <option value="">Select yes or no</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    {errors.hasFailedCourse && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.hasFailedCourse}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Class / Major Code *</label>
                    <input value={classCode} onChange={e => { setClassCode(e.target.value); setErrors(p => ({ ...p, classCode: '' })) }} placeholder="e.g. CS2021"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputCls('classCode')} />
                    {errors.classCode && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.classCode}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#0f1f3d' }}>Eligibility &amp; Profile Details</h3>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Used for eligibility matching, not your AI score -- you can add this later</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#475569' }}>Degree / Program (Optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['B.Tech / B.E.', 'B.Sc', 'B.A. / B.Com', 'M.Tech / M.E.', 'MBA', 'Ph.D'].map(d => (
                      <button key={d} type="button" onClick={() => setDegree(d)}
                        className="py-2 px-3 rounded-xl text-xs font-semibold transition-all text-left"
                        style={degree === d ? { background: '#1d4ed8', color: '#fff', border: '1.5px solid #1d4ed8' } : { background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}
                      >{d}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Institution / University (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#94a3b8' }}>🏛</span>
                    <input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Delhi University, IIT Bombay…"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={inputCls('institution')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Category (Optional)</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={selectCls('category')}>
                      <option value="">Select category</option>
                      {['General', 'OBC', 'SC', 'ST', 'EWS', 'PwD'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Family Annual Income (Optional)</label>
                    <select value={income} onChange={e => setIncome(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={selectCls('income')}>
                      <option value="">Select range</option>
                      <option value="below-2lpa">Below ₹2L</option>
                      <option value="2-5lpa">₹2L–₹5L</option>
                      <option value="5-10lpa">₹5L–₹10L</option>
                      <option value="above-10lpa">Above ₹10L</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#64748b' }}>Used to match you against need-based and category-specific scholarships -- this doesn't affect your AI match score.</p>
              </section>

              {/* Terms */}
              <div className="p-4 rounded-xl" style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
                <div className="flex gap-2.5 items-start">
                  <button type="button" onClick={() => { setAgreeTerms(!agreeTerms); setErrors(p => ({ ...p, terms: '' })) }}
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                    style={{ background: agreeTerms ? '#1d4ed8' : '#fff', border: `1.5px solid ${agreeTerms ? '#1d4ed8' : '#c7d7ff'}` }}>
                    {agreeTerms && <span className="text-white text-xs">✓</span>}
                  </button>
                  <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                    I agree to ScholarMatch's{' '}
                    <span className="font-semibold" style={{ color: '#1d4ed8' }}>Terms of Service</span> and{' '}
                    <span className="font-semibold" style={{ color: '#1d4ed8' }}>Privacy Policy</span>. I consent to receiving scholarship notifications and updates.
                  </p>
                </div>
                {errors.terms && <p className="text-xs mt-2" style={{ color: '#dc2626' }}>{errors.terms}</p>}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-7">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-md" style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#475569' }}>
                ← Back
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: loading ? 'none' : '0 6px 20px rgba(29,78,216,0.35)' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Creating your account…
                </>
              ) : step === totalSteps ? '🚀 Create My Account' : `Continue to ${steps[step].label} →`}
            </button>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: '#64748b' }}>
            Already have an account?{' '}
            <button onClick={onGoLogin} className="font-bold transition-all hover:underline" style={{ color: '#1d4ed8' }}>
              Sign in →
            </button>
          </p>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-5 mt-6 pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
            {['🔐 SSL Secured', '🛡 No spam', '✓ Free forever'].map(b => (
              <span key={b} className="text-xs" style={{ color: '#94a3b8' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────
function RoleSelectionPage({ onBack, onStudentLogin, onStudentRegister, onUniversityLogin, onUniversityRegister, onAdminLogin }: {
  onBack: () => void; onStudentLogin: () => void; onStudentRegister: () => void; onUniversityLogin: () => void; onUniversityRegister: () => void; onAdminLogin: () => void
}) {
  const roles: Array<{ icon: string; name: string; description: string; onLogin?: () => void; onRegister?: () => void }> = [
    { icon: '🎓', name: 'Student', description: 'Discover scholarships, check eligibility, and track your applications.', onLogin: onStudentLogin, onRegister: onStudentRegister },
    { icon: '🏛', name: 'University', description: 'Post scholarships, verify students, and manage your roster.', onLogin: onUniversityLogin, onRegister: onUniversityRegister },
    { icon: '🛡', name: 'Admin', description: 'Manage platform users, scholarships, and operational settings.', onLogin: onAdminLogin, onRegister: undefined },
  ]
  return <main className="min-h-screen px-5 py-6 sm:px-10" style={{ background: '#f8f9ff' }}>
    <button onClick={onBack} className="text-sm font-semibold hover:underline" style={{ color: '#64748b' }}>← Back to Home</button>
    <section className="max-w-5xl mx-auto pt-16 sm:pt-20 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-5" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 8px 24px rgba(29,78,216,0.28)' }}>✦</div>
      <h1 className="font-display text-4xl sm:text-5xl" style={{ color: '#0f1f3d' }}>Who are you?</h1>
      <p className="text-sm sm:text-base mt-3 mb-10" style={{ color: '#64748b' }}>Choose your role to continue with ScholarMatch.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">{roles.map(role => <article key={role.name} className="rounded-2xl p-6 flex flex-col hover:shadow-lg" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ background: '#f0f4ff' }}>{role.icon}</div>
        <span className="self-start px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: '#f0f4ff', color: '#1d4ed8' }}>{role.name}</span>
        <p className="text-sm leading-relaxed flex-1 mb-7" style={{ color: '#64748b' }}>{role.description}</p>
        <button disabled={!role.onLogin} onClick={role.onLogin} className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ background: role.onLogin ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : '#94a3b8' }}>{role.onLogin ? `Login as ${role.name}` : 'Coming soon'}</button>
        <button disabled={!role.onRegister} onClick={role.onRegister} className="w-full py-3 mt-2 rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60" style={{ background: '#fff', color: '#1d4ed8', border: '1px solid #e2e8f0' }}>{role.onRegister ? 'Register' : 'Admin access planned'}</button>
      </article>)}</div>
    </section>
  </main>
}

function UniversityAuthPage({ mode, onBack, onComplete }: { mode: 'login' | 'register'; onBack: () => void; onComplete: (session: AuthSession) => void }) {
  const [form, setForm] = useState({ name: '', domain: '', address: '', contactPerson: '', email: '', password: '' })
  const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [key]: event.target.value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const response = mode === 'login' ? await loginRequest(form.email, form.password) : await registerUniversity({ name: form.name, verifiedEmailDomain: form.domain, address: form.address, contactPerson: form.contactPerson, email: form.email, password: form.password })
      if (response.data.account.role !== 'university_staff') throw new Error('Please use a university staff account.')
      onComplete(response.data)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to continue') } finally { setLoading(false) }
  }
  const inputStyle = { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f1f3d' }
  return <main className="min-h-screen flex items-center justify-center px-5 py-10" style={{ background: '#f8f9ff' }}><section className="w-full max-w-md rounded-2xl p-7 sm:p-8" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 16px 40px rgba(15,31,61,0.08)' }}>
    <button onClick={onBack} className="text-sm font-semibold mb-7" style={{ color: '#64748b' }}>← Back to roles</button><div className="text-2xl mb-4">🏛</div>
    <h1 className="font-display text-3xl" style={{ color: '#0f1f3d' }}>{mode === 'login' ? 'University sign in' : 'Register your university'}</h1><p className="text-sm mt-2 mb-6" style={{ color: '#64748b' }}>{mode === 'login' ? 'Access your university workspace.' : 'Use an official university email for immediate domain verification.'}</p>
    <form onSubmit={submit} className="space-y-4">{mode === 'register' && <><input required value={form.name} onChange={update('name')} placeholder="University name" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} /><input required value={form.domain} onChange={update('domain')} placeholder="Verified email domain (e.g. university.edu)" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} /><input required value={form.address} onChange={update('address')} placeholder="University address" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} /><input required value={form.contactPerson} onChange={update('contactPerson')} placeholder="Contact person" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} /></>}<input required type="email" value={form.email} onChange={update('email')} placeholder="Official email address" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} /><input required minLength={8} type="password" value={form.password} onChange={update('password')} placeholder="Password (8+ characters)" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />{error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}<button disabled={loading} className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in to ScholarMatch →' : 'Submit university registration →'}</button></form>
  </section></main>
}

function AdminAuthPage({ onBack, onComplete }: { onBack: () => void; onComplete: (session: AuthSession) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const response = await loginRequest(email, password)
      if (response.data.account.role !== 'platform_admin') throw new Error('Please use a platform administrator account.')
      onComplete(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return <main className="min-h-screen flex items-center justify-center px-5 py-10" style={{ background: '#f8f9ff' }}><section className="w-full max-w-md rounded-2xl p-7 sm:p-8" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 16px 40px rgba(15,31,61,0.08)' }}>
    <button onClick={onBack} className="text-sm font-semibold mb-7" style={{ color: '#64748b' }}>← Back to roles</button>
    <div className="text-2xl mb-4">🛡</div>
    <h1 className="font-display text-3xl" style={{ color: '#0f1f3d' }}>Platform admin sign in</h1>
    <p className="text-sm mt-2 mb-6" style={{ color: '#64748b' }}>Access the platform dashboard, review universities, and monitor scholarship activity.</p>
    <form onSubmit={submit} className="space-y-4">
      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@scholarmatch.com" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f1f3d' }} />
      <input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f1f3d' }} />
      {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
      <button disabled={loading} className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>{loading ? 'Please wait…' : 'Sign in to admin dashboard →'}</button>
    </form>
  </section></main>
}

function AdminDashboard({ session, onBack }: { session: AuthSession; onBack: () => void }) {
  const [overview, setOverview] = useState<{ totals: { students: number; universities: number; scholarships: number; applications: number }; pendingUniversities: Array<{ id: string; name: string; verificationStatus: 'pending' | 'verified' | 'rejected' }> } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminOverview(session.token)
      .then((response) => setOverview(response.data))
      .catch(() => setOverview({ totals: { students: 0, universities: 0, scholarships: 0, applications: 0 }, pendingUniversities: [] }))
      .finally(() => setLoading(false))
  }, [session.token])

  const cards = overview ? [
    { label: 'Students', value: overview.totals.students, icon: '🎓' },
    { label: 'Universities', value: overview.totals.universities, icon: '🏛' },
    { label: 'Scholarships', value: overview.totals.scholarships, icon: '📚' },
    { label: 'Applications', value: overview.totals.applications, icon: '📋' },
  ] : []

  return <main className="min-h-screen p-5 sm:p-8" style={{ background: '#f8f9ff' }}><div className="max-w-6xl mx-auto"><div className="flex items-center justify-between mb-8"><div><p className="text-sm" style={{ color: '#64748b' }}>Platform admin</p><h1 className="font-display text-3xl" style={{ color: '#0f1f3d' }}>Admin dashboard</h1></div><button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>← Sign out</button></div>{loading ? <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px solid #e8edf5' }}>Loading platform overview…</div> : <><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{cards.map(card => <div key={card.label} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8edf5' }}><div className="text-2xl mb-3">{card.icon}</div><p className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>{card.value}</p><p className="text-xs mt-1" style={{ color: '#64748b' }}>{card.label}</p></div>)}</div><div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8edf5' }}><h2 className="text-lg font-bold mb-4" style={{ color: '#0f1f3d' }}>Pending university review</h2>{(!overview || overview.pendingUniversities.length === 0) ? <p className="text-sm" style={{ color: '#64748b' }}>No universities are awaiting approval.</p> : <div className="space-y-3">{overview.pendingUniversities.map(university => <div key={university.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}><div><p className="font-semibold" style={{ color: '#0f1f3d' }}>{university.name}</p><p className="text-xs" style={{ color: '#64748b' }}>{university.verificationStatus}</p></div><span className="text-xs px-2 py-1 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>Pending</span></div>)}</div>}</div></>}</div></main>
}

function UniversityDashboard({ session, onBack }: { session: AuthSession; onBack: () => void }) {
  const [active, setActive] = useState<'roster' | 'scholarships' | 'applications'>('roster'); const [rows, setRows] = useState<unknown[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => { const endpoint = active === 'roster' ? '/university/roster' : active === 'scholarships' ? '/university/scholarships' : '/university/applications'; setLoading(true); universityRequest<unknown[]>(session.token, endpoint).then(response => setRows(response.data)).catch(() => setRows([])).finally(() => setLoading(false)) }, [active, session.token])
  const nav = [{ key: 'roster' as const, label: 'Roster', icon: '👥' }, { key: 'scholarships' as const, label: 'My Scholarships', icon: '🎓' }, { key: 'applications' as const, label: 'Applications to Review', icon: '📋' }]
  const current = nav.find(item => item.key === active)!
  const records = rows as Record<string, unknown>[]; const columns = records.length ? Object.keys(records[0]).filter(key => !['id', 'updatedAt'].includes(key)).slice(0, 5) : []
  return <div className="flex min-h-screen" style={{ background: '#f8f9ff' }}><aside className="w-60 hidden lg:flex flex-col min-h-screen" style={{ background: '#0f1f3d' }}><div className="px-5 pt-5 pb-5 flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>🏛</div><span className="font-display text-xl text-white">Scholar<span style={{ color: '#f59e0b' }}>Sync</span></span></div><div className="mx-3 mb-4 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><p className="text-sm font-semibold text-white truncate">{session.university?.name || 'University'}</p><p className="text-xs mt-1" style={{ color: '#94a3b8' }}>University workspace</p></div><nav className="flex-1 px-3 space-y-0.5">{nav.map(item => <button key={item.key} onClick={() => setActive(item.key)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left" style={active === item.key ? { background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff' } : { color: '#94a3b8' }}><span>{item.icon}</span>{item.label}</button>)}</nav><div className="p-3"><button onClick={onBack} className="w-full text-left px-3 py-2.5 text-sm" style={{ color: '#94a3b8' }}>← Back to Home</button></div></aside><main className="flex-1 p-5 sm:p-8 lg:p-10"><div className="mb-8"><p className="text-sm" style={{ color: '#64748b' }}>{session.university?.name}</p><h1 className="font-display text-3xl mt-1" style={{ color: '#0f1f3d' }}>{current.label}</h1></div><div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8edf5' }}>{loading ? <div className="py-16 text-center text-sm" style={{ color: '#64748b' }}>Loading…</div> : rows.length === 0 ? <div className="py-20 px-6 text-center"><p className="text-3xl mb-3">{current.icon}</p><p className="font-semibold" style={{ color: '#0f1f3d' }}>Nothing here yet</p><p className="text-sm mt-2" style={{ color: '#64748b' }}>{active === 'roster' ? 'Students linked to your university will appear here.' : active === 'scholarships' ? 'Your university has not posted any scholarships yet.' : 'Applications to your scholarships will appear here.'}</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead style={{ background: '#f8fafc', color: '#64748b' }}><tr>{columns.map(column => <th key={column} className="px-5 py-3 text-xs font-semibold capitalize">{column.replace(/([A-Z])/g, ' $1')}</th>)}</tr></thead><tbody>{records.map((record, index) => <tr key={String(record.id || index)} style={{ borderTop: '1px solid #e8edf5' }}>{columns.map(column => <td key={column} className="px-5 py-4" style={{ color: '#0f1f3d' }}>{Array.isArray(record[column]) ? record[column].join(', ') : String(record[column] ?? '—')}</td>)}</tr>)}</tbody></table></div>}</div></main></div>
}

function UniversityPendingPage({ session, onBack }: { session: AuthSession; onBack: () => void }) {
  return <main className="min-h-screen flex items-center justify-center px-5" style={{ background: '#f8f9ff' }}><section className="max-w-md text-center rounded-2xl p-8" style={{ background: '#fff', border: '1px solid #e8edf5' }}><div className="text-4xl mb-5">⏳</div><h1 className="font-display text-3xl" style={{ color: '#0f1f3d' }}>Approval pending</h1><p className="text-sm leading-relaxed mt-3" style={{ color: '#64748b' }}>{session.university?.name || 'Your university'} has not been verified yet. Your workspace will unlock after its official email domain is confirmed or a platform administrator approves it.</p><button onClick={onBack} className="mt-7 px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>Back to Home</button></section></main>
}

export default function ScholarApp() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [landingProfile, setLandingProfile] = useState<StudentProfile | null>(null)
  const [resumeTarget, setResumeTarget] = useState<'dashboard' | 'university-dashboard' | null>(null)
  const [view, setView] = useState<'landing' | 'roles' | 'login' | 'register' | 'dashboard' | 'admin-login' | 'admin-dashboard' | 'university-login' | 'university-register' | 'university-dashboard' | 'university-pending'>('landing')

  useEffect(() => {
    const storedSession = getStoredSession()
    if (!storedSession || storedSession.access !== 'granted') return

    if (storedSession.account.role === 'student' && storedSession.account.studentProfileId) {
      setSession(storedSession)
      getProfile(storedSession.token, storedSession.account.studentProfileId)
        .then(response => {
          setLandingProfile(response.data)
          setResumeTarget('dashboard')
        })
        .catch(() => {
          setLandingProfile(null)
          setResumeTarget(null)
        })
      return
    }

    if (storedSession.account.role === 'university_staff' && storedSession.university?.name) {
      setSession(storedSession)
      setResumeTarget('university-dashboard')
      return
    }

    if (storedSession.account.role === 'platform_admin') {
      setSession(storedSession)
      setResumeTarget('admin-dashboard')
    }
  }, [])

  const handleAuthenticated = (nextSession: AuthSession, nextView: typeof view) => {
    setStoredSession(nextSession)
    setSession(nextSession)
    setView(nextView)
  }

  const handleLogout = () => {
    clearStoredSession()
    setSession(null)
    setLandingProfile(null)
    setResumeTarget(null)
    setView('landing')
  }
  const welcomeBackName = landingProfile?.fullName || (session?.account.role === 'university_staff' ? session.university?.name : undefined)
  return (
    <>
      {view === 'landing' && (
        <LandingPage
          onEnter={() => setView('roles')}
          onLogin={() => setView('roles')}
          onRegister={() => setView('roles')}
          onContinue={resumeTarget ? () => setView(resumeTarget) : undefined}
          welcomeBackName={welcomeBackName || undefined}
        />
      )}
      {view === 'roles' && <RoleSelectionPage onBack={() => setView('landing')} onStudentLogin={() => setView('login')} onStudentRegister={() => setView('register')} onUniversityLogin={() => setView('university-login')} onUniversityRegister={() => setView('university-register')} onAdminLogin={() => setView('admin-login')} />}
      {view === 'login' && (
        <LoginPage
          onLogin={(nextSession) => handleAuthenticated(nextSession, 'dashboard')}
          onGoRegister={() => setView('register')}
          onBack={() => setView('landing')}
        />
      )}
      {view === 'register' && (
        <RegisterPage
          onRegister={(nextSession) => handleAuthenticated(nextSession, 'dashboard')}
          onGoLogin={() => setView('login')}
          onBack={() => setView('roles')}
        />
      )}
      {view === 'dashboard' && (
        <DashboardShell session={session} onBack={handleLogout} />
      )}
      {view === 'admin-login' && <AdminAuthPage onBack={() => setView('roles')} onComplete={(nextSession) => handleAuthenticated(nextSession, 'admin-dashboard')} />}
      {view === 'admin-dashboard' && session && <AdminDashboard session={session} onBack={handleLogout} />}
      {(view === 'university-login' || view === 'university-register') && <UniversityAuthPage mode={view === 'university-login' ? 'login' : 'register'} onBack={() => setView('roles')} onComplete={(nextSession) => handleAuthenticated(nextSession, nextSession.access === 'granted' ? 'university-dashboard' : 'university-pending')} />}
      {view === 'university-dashboard' && session && <UniversityDashboard session={session} onBack={handleLogout} />}
      {view === 'university-pending' && session && <UniversityPendingPage session={session} onBack={handleLogout} />}
    </>
  )
}
