import type { IndividualAnalysis } from '../individual/types';
export type ReviewField = {
    text: string;
    sourceId: string;
    status: 'received_source_not_externally_verified' | 'proposed_pending_review';
};
export type CourseMatrixRow = {
    candidateAssociations: {
        ruleId: string;
        interestTerms: string[];
        objectiveTerms: string[];
        sourceRationale: string;
        status: 'proposed_pending_carla';
    }[];
    id: string;
    name: string;
    level: 'graduacao' | 'pos_graduacao';
    sourceId: string;
    sourceDescriptions: string[];
    sourceURLs: string[];
    provenance: {
        integrity: 'checked_against_received_file';
        externalVerification: 'not_performed';
        academicReview: 'pending';
        methodologyApproval: 'pending_carla';
    };
    activities: ReviewField[];
    knowledgeAndSkills: ReviewField[];
    workContexts: ReviewField[];
    declaredInterestCandidates: ReviewField[];
    objectiveCandidates: ReviewField[];
    admission: {
        education: string[];
        specificRequirements: null;
        acceptedPriorDegrees: null;
        degreeProofAtEnrollment: boolean;
        policySource: string;
    };
    offers: {
        modality: string;
        format: string | null;
        status: 'not_enabled_in_local_matrix';
        duration: string | null;
    }[];
    institutionalPostAuthorization: 'four_institutions_approved' | 'not_applicable';
    evidenceUse: {
        mayExplain: 'how_to_investigate_only';
        cannotEstablish: string[];
        candidateQuestionIds: string[];
        approval: 'pending_carla';
    };
    pending: string[];
};
export type CareerContext = {
    institution: string;
    unit?: string;
    education?: string;
    priorCourse?: string;
    interests: string[];
    objectives: string[];
};
export type OfferContext = {
    institution: string;
    unit?: string;
    courseId: string;
    globalPostEnabled: boolean;
    institutionEnabled: boolean;
    courseEnabled: boolean;
    unitEnabled: boolean;
    academicRequirementsChecked: boolean;
    verifiedEducationAtEnrollment: boolean;
    status: 'enabled' | 'disabled' | 'unknown';
};
export type CandidateRule = {
    id: string;
    courseName: string;
    level: CourseMatrixRow['level'];
    interestTerms: string[];
    objectiveTerms: string[];
    sourceRationale: string;
    status: 'proposed_pending_carla';
};
export type CareerCandidate = {
    courseRationale: string;
    courseId: string;
    courseName: string;
    level: CourseMatrixRow['level'];
    ruleId: string;
    approval: 'proposed_pending_carla';
    basis: {
        interest: string[];
        objective: string[];
        sourceId: string;
    };
    behavioralExplanation: {
        text: string;
        evidenceRefs: string[];
        doesNotCertifyAptitude: true;
    }[];
    explorationOnly: true;
    enrollmentOfferAllowed: false;
    eligibility: 'education_declared_eligible' | 'education_pending' | 'education_not_eligible';
    pending: string[];
};
export type CareerDemo = {
    mode: 'review_only';
    productionRecommendations: never[];
    proposedCandidates: CareerCandidate[];
    questions: string[];
    excluded: {
        courseId: string;
        reason: string;
    }[];
    unresolvedSelection: boolean;
};
export type CareerAnalysis = Pick<IndividualAnalysis, 'evidence' | 'scores' | 'classification' | 'revision'>;
