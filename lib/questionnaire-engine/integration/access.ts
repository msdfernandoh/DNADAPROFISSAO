/** Trusted server-side service contract. Never construct these claims from request JSON. */
export type ReportActor = {
    id: string;
    active: boolean;
    role: 'participant' | 'seller' | 'manager' | 'institution_admin' | 'platform_owner';
    participantId?: string;
    institutionIds: string[];
    unitIds: string[];
    explicitGlobalOwner?: boolean;
    deniedActions?: ('participant_report' | 'commercial_report')[];
};
export type ReportScope = {
    participantId: string;
    institutionId: string;
    unitId: string | null;
    assignedUserId: string | null;
};
export function canReadReport(actor: ReportActor | null, scope: ReportScope, audience: 'participant' | 'commercial'): boolean {
    if (!actor?.active || !actor.id || actor.deniedActions?.includes(audience + '_report' as 'participant_report' | 'commercial_report'))
        return false;
    if (actor.role === 'participant')
        return audience === 'participant' && actor.participantId === scope.participantId && actor.institutionIds.includes(scope.institutionId);
    if (actor.role === 'platform_owner')
        return actor.explicitGlobalOwner === true;
    if (!actor.institutionIds.includes(scope.institutionId))
        return false;
    if (actor.role === 'institution_admin')
        return true;
    if (!scope.unitId || !actor.unitIds.includes(scope.unitId))
        return false;
    if (actor.role === 'manager')
        return true;
    return actor.role === 'seller' && actor.id === scope.assignedUserId;
}
