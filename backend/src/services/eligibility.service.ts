import type { EligibilityCriterionResult, EligibilityResult, Scholarship, StudentProfile } from "../models";
import { getScholarshipById } from "./scholarship.service";
import { getProfileById } from "./profile.service";

/**
 * Deterministic, rule-based eligibility evaluation — mirrors the frontend's
 * original "gap analysis" table (requirement / yourValue / required / gap /
 * status). This is intentionally separate from the ML recommendation
 * pipeline: eligibility is a transparent, explainable rules check, while
 * recommendation *scoring/ranking* is what the trained model will
 * eventually contribute.
 */
function evaluateCriteria(
  profile: StudentProfile,
  scholarship: Scholarship,
): EligibilityCriterionResult[] {
  const results: EligibilityCriterionResult[] = [];
  const c = scholarship.eligibilityCriteria;

  if (c.studentCategories && c.studentCategories.length > 0) {
    const profileCategory = profile.category;
    const met = profileCategory !== undefined && c.studentCategories.some(
      (category) => category.toLowerCase() === profileCategory.toLowerCase(),
    );
    results.push({
      requirement: "Student category",
      yourValue: profileCategory ?? "Not provided",
      required: c.studentCategories.join(" / "),
      status: met ? "met" : "not-met",
      gap: met ? undefined : "Student category does not match this scholarship's requirement",
    });
  }

  if (c.maxIncomeBracket !== undefined) {
    const incomeBrackets = ["below-2lpa", "2-5lpa", "5-10lpa", "above-10lpa"];
    const profileBracket = profile.incomeBracket;
    const maxIndex = incomeBrackets.indexOf(c.maxIncomeBracket);
    const studentIndex = profileBracket ? incomeBrackets.indexOf(profileBracket) : -1;
    const met = maxIndex >= 0 && studentIndex >= 0 && studentIndex <= maxIndex;
    results.push({
      requirement: "Family income",
      yourValue: profileBracket ?? "Not provided",
      required: `Up to ${c.maxIncomeBracket}`,
      status: met ? "met" : "not-met",
      gap: met ? undefined : "Family income is not provided or exceeds this scholarship's limit",
    });
  }

  if (c.minGpa !== undefined) {
    const met = profile.gpa >= c.minGpa;
    results.push({
      requirement: "Minimum GPA",
      yourValue: `${profile.gpa} / 10`,
      required: `${c.minGpa} / 10`,
      status: met ? "met" : "not-met",
      gap: met ? undefined : `GPA is below the required ${c.minGpa}`,
    });
  }

  if (c.fieldsOfStudy && c.fieldsOfStudy.length > 0) {
    const profileField = profile.fieldOfStudy ?? profile.degree;
    const normalizedField = profileField?.toLowerCase();
    const met = normalizedField !== undefined && c.fieldsOfStudy.some(
      (f) => f.toLowerCase().includes("any") || normalizedField.includes(f.toLowerCase()),
    );
    results.push({
      requirement: "Field of study",
      yourValue: profileField ?? "Not provided",
      required: c.fieldsOfStudy.join(" / "),
      status: met ? "met" : "not-met",
      gap: met ? undefined : "Field of study does not match this scholarship's focus area",
    });
  }

  if (c.requiresFirstGeneration) {
    const met = Boolean(profile.isFirstGeneration);
    results.push({
      requirement: "First-generation student",
      yourValue: profile.isFirstGeneration ? "Yes" : "No / not specified",
      required: "Yes",
      status: met ? "met" : "not-met",
      gap: met ? undefined : "This scholarship requires first-generation student status",
    });
  }

  if (c.requiresRuralBackground) {
    const met = Boolean(profile.ruralBackground);
    results.push({
      requirement: "Rural background",
      yourValue: profile.ruralBackground ? "Yes" : "No / not specified",
      required: "Yes",
      status: met ? "met" : "not-met",
      gap: met ? undefined : "This scholarship requires a rural residential background",
    });
  }

  if (c.genderRestriction) {
    const met = profile.gender === c.genderRestriction;
    results.push({
      requirement: "Gender criterion",
      yourValue: profile.gender ?? "Not specified",
      required: c.genderRestriction,
      status: met ? "met" : "not-met",
      gap: met ? undefined : `This scholarship is restricted to: ${c.genderRestriction}`,
    });
  }

  if (c.minYearOfStudy !== undefined) {
    const met = profile.yearOfStudy >= c.minYearOfStudy;
    results.push({
      requirement: "Minimum year of study",
      yourValue: `Year ${profile.yearOfStudy}`,
      required: `Year ${c.minYearOfStudy}+`,
      status: met ? "met" : "not-met",
      gap: met ? undefined : `Requires at least year ${c.minYearOfStudy}`,
    });
  }

  return results;
}

export async function checkEligibility(
  profileId: string,
  scholarshipId: string,
): Promise<EligibilityResult> {
  const [profile, scholarship] = await Promise.all([
    getProfileById(profileId),
    getScholarshipById(scholarshipId),
  ]);

  const criteria = evaluateCriteria(profile, scholarship);
  const eligible = criteria.every((c) => c.status === "met");

  return {
    scholarshipId,
    eligible,
    criteria,
    evaluatedAt: new Date().toISOString(),
  };
}
