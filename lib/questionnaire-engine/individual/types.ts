import type { Answer, CalculateQuestionnaireResultInput } from '../types';
export const PROFILE_CODES = ['L', 'C', 'E', 'H', 'P'] as const;
export type ProfileCode = typeof PROFILE_CODES[number];
export type OfficialQuestion = {
    number: number;
    title: string;
    situation: string;
    options: {
        letter: string;
        text: string;
        weights: Partial<Record<ProfileCode, number>>;
    }[];
};
export type IndividualInstrument = {
    revision: string;
    questions: OfficialQuestion[];
    engine: Omit<CalculateQuestionnaireResultInput, 'answers'>;
};
export type IndividualInput = {
    revision: string;
    answers: Answer[];
    declared?: {
        interest?: string;
        education?: string;
        objective?: string;
        priorCourse?: string;
    };
};
export type Evidence = {
    id: string;
    questionId: string;
    alternativeId: string;
    revision: string;
    letter: string;
    scenario: string;
    selectedText: string;
    claimType: 'declared';
    primarySection: number;
};
export type ContentBlock = {
    id: string;
    ruleId: string;
    section: number;
    audience: 'participant' | 'commercial';
    claimType: 'declared' | 'hypothesis' | 'question';
    text: string;
    evidenceRefs: string[];
    source: string;
    contentVersion: string;
    editorialStatus: 'provided_reference' | 'pending_carla';
};
export type Gap = {
    id: string;
    section: number | null;
    questionId: string | null;
    reason: string;
};
export type Classification = {
    state: 'defined' | 'tied_main' | 'tied_secondary' | 'structurally_insufficient';
    groups: {
        score: number;
        profiles: ProfileCode[];
    }[];
    main: ProfileCode | null;
    secondaryCandidates: ProfileCode[];
    pair: string | null;
};
export type PairReference = {
    code: string;
    title: string;
    text: string;
    source: string;
    editorialStatus: string;
};
export type IndividualAnalysis = {
    analysisVersion: string;
    contentVersion: string;
    revision: string;
    analysisKey: string;
    scores: Record<ProfileCode, number>;
    classification: Classification;
    evidence: Evidence[];
    coverage: {
        questionId: string;
        alternativeId: string;
        examined: true;
        evaluatedRules: string[];
        ruleChecks: {
            ruleId: string;
            matched: boolean;
        }[];
        selectedBlockIds: string[];
        gapIds: string[];
    }[];
    participant: {
        audience: 'participant';
        sections: {
            number: number;
            title: string;
            blocks: ContentBlock[];
            gapIds: string[];
        }[];
        pairReference: PairReference | null;
        careerPaths: never[];
        status: 'editorial_review_required';
    };
    commercial: {
        audience: 'commercial';
        facts: ContentBlock[];
        questions: ContentBlock[];
        declared: NonNullable<IndividualInput['declared']>;
        hypotheses: ContentBlock[];
        avoidAssuming: {
            text: string;
            evidenceRefs: string[];
            source: string;
        }[];
        careerPaths: never[];
        nextStep: string;
        status: 'editorial_review_required';
    };
    contextualDifferences: {
        id: string;
        evidenceRefs: string[];
        kind: 'different_context_choices';
        editorialStatus: 'pending_carla';
    }[];
    gaps: Gap[];
    methodologicalSufficiency: 'not_homologated';
    productionReady: false;
};
