import {IBranch, IOrganization, IService} from "../../types/serviceType";
import {checkIfAllFirstArrayValuesExistsInSecondArrayValues} from "../../services/str";
import {Response} from "../../types/cardType";
import IFilterOptions from "../../types/filterOptions";
import {checkIfCoordinatesInBounds} from "../../services/geoLogic";
import ILocation from "../../types/locationType";

interface IFilterServicesProps {
    services: IService[];
    filters: {
        responses: string[],
        situations: string[],
        location: ILocation;
    }
}

const checkTags = ({ids, filters}: { ids: string[], filters: string[] }) => {
    if (filters.length === 0 || filters.length === 0) return true;
    const idsTags = ids.flatMap(tag => tag.split(':').map(t => t.trim()));
    const filterTags = filters.flatMap(tag => tag.split(':').map(t => t.trim()));
    return checkIfAllFirstArrayValuesExistsInSecondArrayValues({mustBe: filterTags, data: idsTags});
}

export const filterServices = ({filters, services}: IFilterServicesProps) => {
    const servicesCopy: IService[] = structuredClone(services);
    const filteredServices: IService[] = [];
    for (const service of servicesCopy) {
        const filteredOrganizations: IOrganization[] = [];
        for (const organization of service.organizations) {
            const filteredBranches = organization.branches.filter((branch: IBranch) => {
                if (!checkIfCoordinatesInBounds({
                    bounds: filters.location.bounds,
                    coordinates: branch.geometry
                })) return false;
                if (filters.responses.length > 0 && !checkTags({
                    filters: filters.responses,
                    ids: branch.responses.map(r => r.id)
                })) return false
                if (filters.situations.length > 0 && !checkTags({
                    filters: filters.situations,
                    ids: branch.situations.map(s => s.id)
                })) return false
                return true
            });
            const filteredOrganization: IOrganization = structuredClone(organization);
            filteredOrganization.branches = filteredBranches;
            if (filteredBranches.length > 0) filteredOrganizations.push(filteredOrganization);
        }
        service.organizations = filteredOrganizations;
        if (filteredOrganizations.length > 0) filteredServices.push(service);

    }
    return filteredServices;
}


export const getBranches = (services: IService[]) => {
    const branches: IBranch[] = [];
    if (services.length === 0) return [];
    services.forEach(service => {
        if (!service.organizations || service.organizations.length === 0) return
        service.organizations.forEach((organization: IOrganization) => {
            if (!organization.branches || organization.branches.length === 0) return;
            organization.branches.forEach((branch: IBranch) => {
                const existingBranch = branches.find((b) => b.id === branch.id);
                if (existingBranch) return;
                branches.push(branch)
            })
        })
    });
    return branches;
}

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

export const translateKeyToTitle = (key: string): string => {
    const {titles} = window.filters.situations
    if (!titles[key]) return key;
    return titles[key];
}
export const getKeyForResponse = (id: string): string | null => {
    const keyParts = id.split(':').reverse();
    if (keyParts[keyParts.length - 1] !== 'human_services') return null;
    const {titles} = window.filters.responses;
    for (const part of keyParts) {
        if (titles[part]) return titles[part];
    }
    return null;
}

export const runOverResponsesAndGetOptions = (responses: Response[]) => {
    const options: IFilterOptions = {};
    responses.forEach((response: Response) => {
        if (!response.id) return;
        else if (!options[response.id]) {
            options[response.id] = {count: 1, name: response.name};
        } else {
            options[response.id].count += 1;
        }
    });
    return options;
}

