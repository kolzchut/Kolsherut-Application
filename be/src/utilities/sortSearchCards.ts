interface ServiceData {
    service_id: string;
    service_description?: string;
    service_boost?: number;
    organization_branch_count?: number;
    national_service?: boolean;
    service_phone_numbers?: string[];
    organization_phone_numbers?: string[];
    organization_kind?: string;
}

export function calculateServiceScore(data: ServiceData): number {
    const branchCount = data.organization_branch_count || 1;
    const nationalService = Boolean(data.national_service);
    const isMeser = data.service_id.startsWith('meser-');
    const hasDescription = Boolean(data.service_description && data.service_description.length > 5);
    const governmentTypes = ['משרד ממשלתי', 'רשות מקומית', 'תאגיד סטטוטורי'];

    let score = 1;

    if (!isMeser) score *= 8;
    if (hasDescription) score *= 5;

    if (nationalService) {
        score *= 6;

        const servicePhones = data.service_phone_numbers || [];
        const orgPhones = data.organization_phone_numbers || [];
        const allPhones = [...servicePhones, ...orgPhones].filter(phone => phone && phone.trim());

        if (allPhones.length > 0) {
            const firstPhone = allPhones[0];
            if (firstPhone.length <= 5 || firstPhone.startsWith('1')) score *= 3;
        }
    } else {
        if (branchCount > 100) score *= Math.min(branchCount / 20, 8);
         else score *= Math.sqrt(branchCount);
    }

    if (data.organization_kind && governmentTypes.includes(data.organization_kind)) score *= 4;
    score = Math.max(score, 1);
    const serviceBoost = Math.min(data.service_boost || 0, 2);
    score *= Math.pow(3, serviceBoost);
    return score;
}

export function applyElasticsearchScoreModifier(baseScore: number): number {
    return Math.sqrt(baseScore);
}

export function calculateFinalElasticsearchScore(data: ServiceData): number {
    const baseScore = calculateServiceScore(data);
    return applyElasticsearchScoreModifier(baseScore);
}
