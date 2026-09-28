const API_BASE_URL = 'http://localhost:4000/api'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await response.json()

  if (!response.ok || data.success === false) {
    throw new Error(data.error?.message || data.message || 'API request failed')
  }

  return data
}

export interface AuthSession {
  token: string
  account: { id: string; email: string; role: 'student' | 'university_staff' | 'platform_admin'; studentProfileId?: string; universityId?: string }
  access: 'granted' | 'pending'
  university?: { id: string; name: string; verificationStatus: 'pending' | 'verified' | 'rejected' } | null
}

export async function login(email: string, password: string) {
  return request<{ success: boolean; data: AuthSession }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function registerUniversity(input: { name: string; verifiedEmailDomain: string; address: string; contactPerson: string; email: string; password: string }) {
  return request<{ success: boolean; data: AuthSession }>('/auth/university/register', { method: 'POST', body: JSON.stringify(input) })
}

export async function registerStudent(input: Record<string, unknown>) {
  return request<{ success: boolean; data: AuthSession }>('/auth/student/register', { method: 'POST', body: JSON.stringify(input) })
}

export async function universityRequest<T>(token: string, endpoint: string, options: RequestInit = {}) {
  return request<{ success: boolean; data: T }>(endpoint, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } })
}

function authenticatedRequest<T>(token: string, endpoint: string, options: RequestInit = {}) {
  return request<T>(endpoint, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
}

export interface StudentProfile {
  id: string
  fullName: string
  email: string
  phone?: string
  dob?: string
  gender?: string

  degree: string
  institutionId?: string
  legacyInstitutionName?: string
  yearOfStudy: number
  gpa: number
  fieldOfStudy?: string

  category?: string
  incomeBracket?: string
  isFirstGeneration?: boolean
  ruralBackground?: boolean

  interests?: string[]
  achievements?: string[]

  semester?: 1 | 2
  extracurricularPoint?: number
  totalCredits?: number
  hasFailedCourse?: boolean
  classCode?: string
}

export interface Recommendation {
  rank: number
  scholarshipId: string
  name: string
  description: string
  score: number
  matchPercentage: number
  eligible: boolean
  semanticSimilarity: number
  majorMatch: boolean
  academicFit: number
}

export interface RecommendationResponse {
  mlServiceReachable: boolean
  studentId: number | null
  modelVersion: string | null
  generatedAt: string
  recommendations: Recommendation[]
  message?: string
}

export async function createProfile(
  profile: Omit<StudentProfile, 'id'>
) {
  return request<{ success: boolean; data: StudentProfile }>(
    '/profile',
    {
      method: 'POST',
      body: JSON.stringify(profile),
    }
  )
}

export async function updateProfile(
  token: string,
  profileId: string,
  updates: Partial<StudentProfile>
) {
  return authenticatedRequest<{ success: boolean; data: StudentProfile }>(
    token,
    `/profile/${profileId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  )
}

export async function getProfile(token: string, profileId: string) {
  return authenticatedRequest<{ success: boolean; data: StudentProfile }>(
    token,
    `/profile/${profileId}`
  )
}

export async function getRecommendations(token: string, profileId: string) {
  return authenticatedRequest<{
    success: boolean
    data: RecommendationResponse
  }>(token, '/recommendations', {
    method: 'POST',
    body: JSON.stringify({ profileId }),
  })
}

export async function getEligibility(token: string, profileId: string, scholarshipId: string) {
  return authenticatedRequest(token, '/eligibility', { method: 'POST', body: JSON.stringify({ profileId, scholarshipId }) })
}

export async function getExplanation(token: string, profileId: string, scholarshipId: string) {
  return authenticatedRequest(token, '/explain', { method: 'POST', body: JSON.stringify({ profileId, scholarshipId }) })
}

export async function getAdminOverview(token: string) {
  return authenticatedRequest<{ success: boolean; data: { totals: { students: number; universities: number; scholarships: number; applications: number }; pendingUniversities: Array<{ id: string; name: string; verificationStatus: 'pending' | 'verified' | 'rejected' }> } }>(token, '/admin/overview')
}

export async function getSaved(token: string, profileId: string) {
  return authenticatedRequest(token, `/saved/${profileId}`)
}

export async function saveScholarship(token: string, profileId: string, scholarshipId: string) {
  return authenticatedRequest(token, '/saved', { method: 'POST', body: JSON.stringify({ userId: profileId, scholarshipId }) })
}

export async function getApplications(token: string, profileId: string) {
  return authenticatedRequest(token, `/applications/${profileId}`)
}

export async function createApplication(token: string, profileId: string, scholarshipId: string, submittedDocuments?: string[], notes?: string) {
  return authenticatedRequest(token, '/applications', { method: 'POST', body: JSON.stringify({ userId: profileId, scholarshipId, submittedDocuments, notes }) })
}
