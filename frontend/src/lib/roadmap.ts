/**
 * Rule-based eligibility + improvement roadmap engine.
 *
 * Nothing here is generated or guessed: every gap and every recommendation is
 * derived by comparing a StudentProfile against the structured criteria of ONE
 * selected scholarship. The shapes below are the contract the FastAPI backend
 * can fill in later (see `fetchProfile` / `fetchCriteria` notes at the bottom).
 */

// ─── Student profile ─────────────────────────────────────────────────────────
export interface StudentProfile {
  name: string
  cgpa: number // on a 10-point scale
  field: string
  degreeLevel: string
  residence: 'urban' | 'semi-urban' | 'rural'
  firstGen: boolean
  familyIncomeLPA: number
  englishTest: { name: 'IELTS' | 'TOEFL'; score: number } | null
  gre: number | null
  gmat: number | null
  certifications: string[]
  skills: string[]
  languages: string[]
  portfolioPieces: number
  recommendationLetters: number
  researchProposal: boolean
  leadershipRoles: number
  communityServiceHours: number
  /** Improvements the student has marked as started, keyed by criterion id. */
  inProgress: string[]
}

/** Current signed-in student. Replace with backend `GET /profile`. */
export const STUDENT_PROFILE: StudentProfile = {
  name: 'Priya Sharma',
  cgpa: 7.2,
  field: 'Computer Science',
  degreeLevel: 'Undergraduate (3rd year)',
  residence: 'urban',
  firstGen: true,
  familyIncomeLPA: 4.2,
  englishTest: null,
  gre: null,
  gmat: null,
  certifications: ['Google Data Analytics'],
  skills: ['Python', 'React', 'SQL'],
  languages: ['English', 'Hindi'],
  portfolioPieces: 0,
  recommendationLetters: 1,
  researchProposal: false,
  leadershipRoles: 1,
  communityServiceHours: 20,
  inProgress: [],
}

// ─── Criteria model ──────────────────────────────────────────────────────────
export type CriterionKind =
  | 'academic'
  | 'exam'
  | 'language'
  | 'skill'
  | 'certification'
  | 'document'
  | 'demographic'

export interface Criterion {
  id: string
  kind: CriterionKind
  label: string
  /** Why this requirement exists / matters for this scholarship. */
  why: string
  /** Reads the student's current value for display. */
  current: (p: StudentProfile) => string
  /** Human-readable required value. */
  required: string
  /** Rule: does the profile satisfy this criterion? */
  meets: (p: StudentProfile) => boolean
  /** Gap sentence when unmet. */
  gap: (p: StudentProfile) => string
  /** Concrete, criterion-specific action. */
  action: string
  /** Target value the student should reach. */
  target?: string
  /** True when no amount of effort can change it (hard filter). */
  fixed?: boolean
  /** Programs that address THIS criterion only. */
  programs?: RecommendedProgram[]
}

export interface RecommendedProgram {
  title: string
  type:
    | 'Certification'
    | 'Online course'
    | 'Skill program'
    | 'Language prep'
    | 'Exam prep'
    | 'Academic improvement'
    | 'Guided workshop'
  provider: string
  duration: string
  outcome: string
}

// ─── Reusable criteria builders ──────────────────────────────────────────────
const cgpaCriterion = (min: number): Criterion => ({
  id: `cgpa-${min}`,
  kind: 'academic',
  label: 'Minimum CGPA',
  why: 'This award is merit-weighted — the CGPA cut-off is applied before any other review.',
  current: p => `${p.cgpa.toFixed(1)} / 10`,
  required: `${min.toFixed(1)} / 10`,
  meets: p => p.cgpa >= min,
  gap: p => `${(min - p.cgpa).toFixed(1)} CGPA points below the cut-off`,
  action: `Improve your academic performance and target a CGPA of ${min.toFixed(1)}.`,
  target: `${min.toFixed(1)} / 10 CGPA`,
  programs: [
    {
      title: 'Semester GPA Recovery Plan',
      type: 'Academic improvement',
      provider: 'ScholarMatch Academic Coaching',
      duration: '1 semester',
      outcome: 'Structured study plan + weekly tracking to lift CGPA by 0.5–1.0',
    },
    {
      title: 'Advanced Mathematics for CS',
      type: 'Online course',
      provider: 'NPTEL',
      duration: '8 weeks',
      outcome: 'Grade-lifting credit in a high-weight core subject',
    },
  ],
})

const fieldCriterion = (allowed: string[], label = 'Field of study'): Criterion => ({
  id: `field-${allowed.join('-').toLowerCase()}`,
  kind: 'demographic',
  label,
  why: 'The funder restricts this award to specific disciplines, so the major is a hard filter.',
  current: p => p.field,
  required: allowed.join(' / '),
  meets: p => allowed.some(a => a === 'Any STEM' ? true : a.toLowerCase().includes(p.field.toLowerCase()) || p.field.toLowerCase().includes(a.toLowerCase())),
  gap: () => `Your major is outside ${allowed.join(' / ')}`,
  action: `This scholarship only accepts ${allowed.join(' / ')} students — consider closely related awards instead.`,
  fixed: true,
})

const ieltsCriterion = (min: number): Criterion => ({
  id: `ielts-${min}`,
  kind: 'language',
  label: 'English proficiency (IELTS)',
  why: 'The host university requires certified English proficiency before an offer can be issued.',
  current: p => (p.englishTest ? `${p.englishTest.name} ${p.englishTest.score}` : 'No test taken'),
  required: `IELTS ${min.toFixed(1)} overall`,
  meets: p => !!p.englishTest && p.englishTest.score >= min,
  gap: p => (p.englishTest ? `${(min - p.englishTest.score).toFixed(1)} band below requirement` : 'No IELTS/TOEFL score on file'),
  action: `Complete an IELTS preparation programme and book a test targeting band ${min.toFixed(1)}.`,
  target: `IELTS ${min.toFixed(1)}`,
  programs: [
    {
      title: 'IELTS Academic Intensive',
      type: 'Language prep',
      provider: 'British Council',
      duration: '6 weeks',
      outcome: `Mock tests and band-by-band coaching to reach ${min.toFixed(1)}`,
    },
    {
      title: 'Academic Writing for IELTS Task 2',
      type: 'Online course',
      provider: 'FutureLearn',
      duration: '4 weeks',
      outcome: 'Targets the band that most often blocks the overall score',
    },
  ],
})

const greCriterion = (min: number): Criterion => ({
  id: `gre-${min}`,
  kind: 'exam',
  label: 'GRE score',
  why: 'Graduate research funding is screened on standardised quantitative and verbal performance.',
  current: p => (p.gre ? String(p.gre) : 'Not attempted'),
  required: `${min}+`,
  meets: p => !!p.gre && p.gre >= min,
  gap: p => (p.gre ? `${min - p.gre} points short` : 'No GRE score on file'),
  action: `Take a structured GRE preparation programme and sit the exam targeting ${min}+.`,
  target: `GRE ${min}`,
  programs: [
    {
      title: 'GRE Quant + Verbal Bootcamp',
      type: 'Exam prep',
      provider: 'ScholarMatch Test Prep',
      duration: '10 weeks',
      outcome: `Full-length adaptive mocks aimed at a ${min}+ composite`,
    },
  ],
})

const researchProposalCriterion = (): Criterion => ({
  id: 'research-proposal',
  kind: 'document',
  label: 'Research proposal',
  why: 'The review panel scores the proposal first — applications without one are not read further.',
  current: p => (p.researchProposal ? 'Submitted' : 'Not started'),
  required: '1 submitted proposal',
  meets: p => p.researchProposal,
  gap: () => 'No research proposal drafted',
  action: 'Draft a 2,000-word proposal with a faculty mentor and submit it before the deadline.',
  target: '1 reviewed proposal',
  programs: [
    {
      title: 'Research Proposal Writing Workshop',
      type: 'Guided workshop',
      provider: 'ScholarMatch Mentors',
      duration: '3 weeks',
      outcome: 'Proposal outline, methodology section and mentor review',
    },
    {
      title: 'Introduction to Research Methodology',
      type: 'Online course',
      provider: 'Coursera',
      duration: '5 weeks',
      outcome: 'Methodology vocabulary expected by review panels',
    },
  ],
})

const recommendationCriterion = (n: number): Criterion => ({
  id: `recs-${n}`,
  kind: 'document',
  label: 'Recommendation letters',
  why: 'Incomplete recommendation sets are auto-rejected at the document check stage.',
  current: p => `${p.recommendationLetters} uploaded`,
  required: `${n} letters`,
  meets: p => p.recommendationLetters >= n,
  gap: p => `${n - p.recommendationLetters} more letter(s) needed`,
  action: `Request ${n} letters from faculty who have graded your core coursework.`,
  target: `${n} letters on file`,
})

const portfolioCriterion = (n: number): Criterion => ({
  id: `portfolio-${n}`,
  kind: 'skill',
  label: 'Creative portfolio',
  why: 'The jury scores the portfolio directly; it is the primary selection artefact.',
  current: p => `${p.portfolioPieces} pieces`,
  required: `${n} pieces`,
  meets: p => p.portfolioPieces >= n,
  gap: p => `${n - p.portfolioPieces} more portfolio pieces required`,
  action: `Build a ${n}-piece portfolio with a documented artist statement.`,
  target: `${n} curated pieces`,
  programs: [
    {
      title: 'Digital Portfolio Studio',
      type: 'Skill program',
      provider: 'Domestika',
      duration: '8 weeks',
      outcome: 'A reviewed, jury-ready portfolio and artist statement',
    },
  ],
})

const residenceCriterion = (): Criterion => ({
  id: 'residence-rural',
  kind: 'demographic',
  label: 'Residential background',
  why: 'The grant is funded to serve rural and non-metro communities specifically.',
  current: p => `${p.residence} residence`,
  required: 'Rural / non-metro residence',
  meets: p => p.residence === 'rural',
  gap: () => 'Location criterion cannot be met from an urban address',
  action: 'This is a fixed eligibility filter — focus on need-based awards open to urban students.',
  fixed: true,
})

const communityCriterion = (hours: number): Criterion => ({
  id: `community-${hours}`,
  kind: 'skill',
  label: 'Community engagement',
  why: 'The selection rubric weights sustained community service as heavily as academics.',
  current: p => `${p.communityServiceHours} logged hours`,
  required: `${hours}+ hours`,
  meets: p => p.communityServiceHours >= hours,
  gap: p => `${hours - p.communityServiceHours} more service hours to log`,
  action: `Join a documented volunteering programme and log ${hours}+ verified hours.`,
  target: `${hours} verified hours`,
  programs: [
    {
      title: 'Campus Community Fellowship',
      type: 'Skill program',
      provider: 'University Outreach Office',
      duration: '1 semester',
      outcome: 'Verified service hours with a supervisor certificate',
    },
  ],
})

const leadershipCriterion = (n: number): Criterion => ({
  id: `leadership-${n}`,
  kind: 'skill',
  label: 'Leadership record',
  why: 'The award funds student leaders, so documented roles are scored before essays.',
  current: p => `${p.leadershipRoles} documented role(s)`,
  required: `${n}+ documented role(s)`,
  meets: p => p.leadershipRoles >= n,
  gap: p => `${n - p.leadershipRoles} more documented leadership role(s)`,
  action: `Take on ${n} formal role(s) (club lead, project lead) and document outcomes.`,
  target: `${n} documented roles`,
})

const cloudCertCriterion = (): Criterion => ({
  id: 'cert-cloud',
  kind: 'certification',
  label: 'Cloud / technical certification',
  why: 'The sponsor requires proof of applied technical skill beyond coursework.',
  current: p => (p.certifications.length ? p.certifications.join(', ') : 'None'),
  required: '1 recognised cloud or ML certification',
  meets: p => p.certifications.some(c => /aws|azure|google cloud|tensorflow|kubernetes/i.test(c)),
  gap: () => 'No recognised cloud/ML certification on file',
  action: 'Complete one recognised cloud or ML certification and attach the credential ID.',
  target: '1 verified certification',
  programs: [
    {
      title: 'AWS Certified Cloud Practitioner',
      type: 'Certification',
      provider: 'Amazon Web Services',
      duration: '6 weeks',
      outcome: 'Verifiable credential accepted by the sponsor',
    },
    {
      title: 'Machine Learning Specialisation',
      type: 'Online course',
      provider: 'DeepLearning.AI',
      duration: '3 months',
      outcome: 'Certificate plus 3 applied projects for your profile',
    },
  ],
})

// ─── Per-scholarship criteria (keyed by scholarship id) ──────────────────────
export const SCHOLARSHIP_CRITERIA: Record<number, Criterion[]> = {
  1: [cgpaCriterion(8.5), fieldCriterion(['Any STEM']), recommendationCriterion(2)],
  2: [leadershipCriterion(1), communityCriterion(60), recommendationCriterion(1)],
  3: [fieldCriterion(['Computer Science', 'Engineering']), cloudCertCriterion(), portfolioCriterion(3)],
  4: [cgpaCriterion(7.0), recommendationCriterion(1)],
  5: [residenceCriterion(), fieldCriterion(['Agriculture', 'Environmental Science']), cgpaCriterion(6.5)],
  6: [fieldCriterion(['Fine Arts', 'Design', 'Music']), portfolioCriterion(10), recommendationCriterion(1)],
  7: [cgpaCriterion(8.0), greCriterion(320), researchProposalCriterion(), recommendationCriterion(3)],
  8: [fieldCriterion(['Any STEM']), ieltsCriterion(7.0), communityCriterion(40)],
}

// ─── Evaluation ──────────────────────────────────────────────────────────────
export type CriterionStatus = 'Met' | 'In Progress' | 'Required' | 'Blocked'

export interface EvaluatedCriterion {
  criterion: Criterion
  status: CriterionStatus
  currentValue: string
  requiredValue: string
  gap: string
}

export interface RoadmapPhase {
  key: string
  label: string
  detail: string
  done: boolean
  active: boolean
}

export interface RoadmapResult {
  criteria: EvaluatedCriterion[]
  met: EvaluatedCriterion[]
  gaps: EvaluatedCriterion[]
  blocked: EvaluatedCriterion[]
  actionable: EvaluatedCriterion[]
  programs: { program: RecommendedProgram; forCriterion: string }[]
  progress: number
  eligible: boolean
  phases: RoadmapPhase[]
}

export function evaluateScholarship(
  profile: StudentProfile,
  criteria: Criterion[],
): RoadmapResult {
  const evaluated: EvaluatedCriterion[] = criteria.map(c => {
    const ok = c.meets(profile)
    const status: CriterionStatus = ok
      ? 'Met'
      : c.fixed
        ? 'Blocked'
        : profile.inProgress.includes(c.id)
          ? 'In Progress'
          : 'Required'
    return {
      criterion: c,
      status,
      currentValue: c.current(profile),
      requiredValue: c.required,
      gap: ok ? '—' : c.gap(profile),
    }
  })

  const met = evaluated.filter(e => e.status === 'Met')
  const gaps = evaluated.filter(e => e.status !== 'Met')
  const blocked = evaluated.filter(e => e.status === 'Blocked')
  const actionable = gaps.filter(e => e.status !== 'Blocked')

  const programs = actionable.flatMap(e =>
    (e.criterion.programs ?? []).map(program => ({ program, forCriterion: e.criterion.label })),
  )

  const progress = Math.round((met.length / Math.max(1, evaluated.length)) * 100)
  const eligible = gaps.length === 0

  const phases: RoadmapPhase[] = [
    {
      key: 'profile',
      label: 'Current profile',
      detail: `${met.length} of ${evaluated.length} requirements already satisfied`,
      done: true,
      active: false,
    },
    {
      key: 'gaps',
      label: 'Identify gaps',
      detail: gaps.length ? `${gaps.length} unmet requirement(s) detected` : 'No gaps found',
      done: true,
      active: false,
    },
    {
      key: 'improve',
      label: 'Improve required areas',
      detail: actionable.length
        ? actionable.map(e => e.criterion.label).join(', ')
        : 'Nothing to improve',
      done: actionable.length === 0,
      active: actionable.length > 0 && !actionable.some(e => e.status === 'In Progress'),
    },
    {
      key: 'programs',
      label: 'Complete course / certification',
      detail: programs.length
        ? `${programs.length} matched program(s) for your gaps`
        : 'No programs required',
      done: actionable.length === 0,
      active: actionable.some(e => e.status === 'In Progress'),
    },
    {
      key: 'meet',
      label: 'Meet scholarship requirements',
      detail: eligible ? 'All criteria satisfied' : `${gaps.length} still open`,
      done: eligible,
      active: false,
    },
    {
      key: 'recheck',
      label: 'Re-evaluate eligibility',
      detail: eligible ? 'Eligible — ready to apply' : 'Run a re-check after updating your profile',
      done: eligible,
      active: false,
    },
  ]

  return { criteria: evaluated, met, gaps, blocked, actionable, programs, progress, eligible, phases }
}

/**
 * Backend integration point.
 * Swap STUDENT_PROFILE and SCHOLARSHIP_CRITERIA for:
 *   GET  /api/profile              -> StudentProfile
 *   GET  /api/scholarships/:id     -> { criteria: Criterion[] }  (serialised rules)
 *   POST /api/eligibility/recheck  -> RoadmapResult
 * `evaluateScholarship` stays the client-side mirror of the same rules, so no
 * scores or eligibility verdicts are ever invented locally.
 */
