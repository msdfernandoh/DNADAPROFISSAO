import type { CareerAnalysis, CareerContext, OfferContext } from './types';
export type OrientationContext = CareerContext & {
    situation: 'declared_interest' | 'area_undecided' | 'undefined_interest';
    declaredArea?: string;
};
export type ExplorationExperiment = {
    id: string;
    theme: string;
    observation: string;
    experience: string;
    question: string;
    professionalActivity: string;
    evidenceRefs: string[];
    approval: 'proposed_pending_carla';
    inferredInterest: false;
};
export type ExploratoryCourse = {
    courseId: string;
    courseName: string;
    level: 'graduacao' | 'pos_graduacao';
    proposalId: string;
    status: 'exploratory_unhomologated';
    whyIncluded: string;
    concreteActivity: string;
    whatToInvestigate: string;
    differenceToCompare: string;
    individualPrompt: {
        text: string;
        evidenceRefs: string[];
    };
    sources: {
        sourceId: string;
        descriptions: string[];
        urls: string[];
        externalVerification: 'not_performed';
    };
    origins: {
        declaredInterests: string[];
        declaredArea: string | null;
        declaredObjectives: string[];
        declaredEducation: string | null;
        declaredPriorCourse: string | null;
        responsesUsed: string[];
    };
    admission: {
        educationState: string;
        priorFormationReview: 'not_a_universal_requirement' | 'requires_academic_review';
        specificRequirements: 'unknown';
        pending: string[];
    };
    enrollmentOfferAllowed: false;
    offerBlockers: string[];
};
export type ProfessionalOrientation = {
    version: string;
    mode: OrientationContext['situation'];
    approval: 'pending_carla';
    productionReady: false;
    introduction: string;
    experiments: ExplorationExperiment[];
    exploratoryCourses: ExploratoryCourse[];
    homologatedRecommendations: never[];
    activeOffers: never[];
    questions: string[];
    pending: string[];
    internal: {
        examinedResponses: {
            questionId: string;
            alternativeId: string;
            matchingRules: string[];
            selectedRules: string[];
            reason: string;
        }[];
        matrixCount: 107;
        courseScope: 3;
        declaredContext: OrientationContext;
        excluded: {
            courseName: string;
            reason: string;
        }[];
        sourceOfAuthority: 'local_synthetic_context_no_production_authorization';
        selectionPolicy: string;
    };
};
export type OrientationOfferContext = OfferContext[];
export type OrientationAnalysis = CareerAnalysis;
