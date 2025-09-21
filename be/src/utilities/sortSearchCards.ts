import {IService} from "../types/serviceType";
import GeneralLifeSituationTags from "../assets/generalLifeSituationTags.json"
import GovernmentTypes from "../assets/governmentTypes.json";

const calculateServiceScore = (service: IService, searchedWithOnlyResponse: boolean): number => {
    const serviceSituations = service.situations.flatMap(situation => situation.id);

    const isServiceDescriptionIncludesMoreThanFiveWords = !!(service.service_description && service.service_description.split(' ').length > 5);
    const isServiceHasGeneralLifeSituation = serviceSituations.some(situationId => GeneralLifeSituationTags.includes(situationId));
    const countBranches = service.organizations.reduce((acc, org) => acc + org.branches.length, 0);
    const isServiceHasGovernmentType = GovernmentTypes.includes(service.organization_kind)
    const countSituations = service.situations.length;
    const serviceScore = Math.min(service.score || 0, 3000);
    const serviceBoost = Math.min(service.service_boost || 0, 100000);

    let score = serviceScore + serviceBoost;

    if (isServiceDescriptionIncludesMoreThanFiveWords) score += 1000;
    if (isServiceHasGeneralLifeSituation) score += 2000;
    score += Math.min(countBranches, 999);
    if (isServiceHasGovernmentType) score += 500;

    if (searchedWithOnlyResponse && countSituations === 0) score += 10000;
    if (countSituations >= 1 && countSituations <= 9) score += (10 - countSituations) * 100;

    return score;
}

const sortSearchCards = (services: IService[], searchedWithOnlyResponse: boolean) => {
    return services.sort((a, b) => {
        const scoreA = calculateServiceScore(a, searchedWithOnlyResponse);
        const scoreB = calculateServiceScore(b, searchedWithOnlyResponse);
        return scoreB - scoreA;
    });
}

export default sortSearchCards;
