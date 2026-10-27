import type { IndividualAnalysis } from '../types';
export type EditorialRule = {
    id: string;
    section: number;
    theme: string;
    when: Record<string, string>;
    paragraphs: string[];
    kind?: 'contextual';
};
export type EditorialParagraph = {
    text: string;
    ruleId: string;
    evidenceRefs: string[];
    claimType: 'contextual_interpretation' | 'reflection' | 'process_information';
    use: 'deepening' | 'synthesis';
};
export type EditorialSection = {
    number: number;
    title: string;
    paragraphs: EditorialParagraph[];
};
export type EditorialPreview = {
    version: string;
    sourceAnalysisKey: string;
    approval: 'pending_carla';
    productionReady: false;
    participant: {
        sections: EditorialSection[];
    };
    commercial: {
        sections: EditorialSection[];
    };
    internal: {
        evidence: IndividualAnalysis['evidence'];
        selectedRules: {
            id: string;
            section: number;
            theme: string;
            evidenceRefs: string[];
        }[];
        examinedQuestions: string[];
        gaps: {
            section: number | null;
            reason: string;
        }[];
        contextualInterpretations: string[];
        eligibility: {
            status: 'needs_education' | 'education_ineligible' | 'education_eligible_declaration' | 'invalid_education';
            enrollmentOfferAllowed: false;
            requiresServerValidation: true;
            requiresOfferAndCourseRequirements: true;
            requiresDegreeProofAtEnrollment: true;
        };
    };
};
