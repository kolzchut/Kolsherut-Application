export const getKeyForSituation = (key: string): string | null => {
    const keyParts = key.split(':');
    if (keyParts[0] !== 'human_situations') return null;

    const {situationsMap} = window.filters.situations

    if (situationsMap.audiences.includes(keyParts[1])) return 'audiences';
    if (situationsMap.healthIssues.includes(keyParts[1])) return 'health_issues';
    if (situationsMap.ageGroups.includes(keyParts[1])) return 'age_groups';
    if (situationsMap.languages.includes(keyParts[1])) return 'languages';

    const otherKeys = ['employment', 'benefit_holders', 'life_events', 'urgency', 'gender', 'community', 'role'];
    for (const hsroot of otherKeys) {
        if (key.startsWith(`human_situations:${hsroot}`)) {
            return `others.${hsroot}`;
        }
    }

    return null;
};
