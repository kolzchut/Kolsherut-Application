import {IBranch, IOrganization, IService} from "../types/serviceType";
import sortSearchCards from "./sortSearchCards";

const createNewService = (sourceService: any): IService => {
    return {
        id: sourceService.service_id,
        service_name: sourceService.service_name,
        service_description: sourceService.service_description,
        responses: sourceService.responses || [],
        situations: sourceService.situations || [],
        organizations: [],
        service_boost: sourceService.service_boost || 0,
        score: sourceService.score || 1,
        organization_phone_numbers: sourceService.organization_phone_numbers || [],
        service_phone_numbers: sourceService.service_phone_numbers || [],
        organization_kind: sourceService.organization_kind || ''
    };
};

const createNewBranch = (branch: any): IBranch => {
    return {
        id: branch.card_id,
        name: branch.branch_name,
        address: branch.branch_address,
        isNational: branch.national_service,
        isAccurate: branch.branch_location_accurate,
        geometry: branch.branch_geometry,
        responses: branch.responses || [],
        situations: branch.situations || []
    };
};

const processAndAddBranch = (service: IService, branch: any): void => {
    const newBranch = createNewBranch(branch);

    let organization: IOrganization | null = service.organizations.find(
        (org: IOrganization) => org.id === branch.organization_id
    ) || null;

    if (!organization) {
        organization = {
            id: branch.organization_id,
            name: branch.organization_name,
            branches: [newBranch]
        };
        service.organizations.push(organization);
        return;
    }

    const existingBranch = organization.branches.find((b: IBranch) => b.id === branch.branch_id);
    if (!existingBranch) {
        organization.branches.push(newBranch);
    }
};

const processBranchesForService = (service: IService, sourceBranches: any[]): void => {
    sourceBranches.forEach((branch: any) => {
        processAndAddBranch(service, branch);
    });
};

const sortOrganizationsByBranchCount = (services: IService[]): IService[] => {
    return services.map(service => {
        const sortedService = {...service};
        sortedService.organizations = [...service.organizations].sort(
            (a, b) => b.branches.length - a.branches.length
        );
        return sortedService;
    });
};

const transformCardIdToNewFormat = (elasticsearchResponse: any, sortByScore: boolean) => {
    const servicesMap = new Map();

    elasticsearchResponse.hits.hits.forEach((hit: {
        _source: any,
        _score: number,
        inner_hits: { collapse_hits: { hits: { hits: Array<{ _source: any, _score: number }> } } }
    }) => {
        const sourceService = hit._source;
        const sourceBranches = hit.inner_hits.collapse_hits.hits.hits.map(innerHit => {
            return innerHit._source;
        });

        if (!servicesMap.has(sourceService.service_name)) {
            const newService = createNewService(sourceService);
            servicesMap.set(sourceService.service_name, newService);
        }

        const service = servicesMap.get(sourceService.service_name);
        processBranchesForService(service, sourceBranches);
    });

    const services = Array.from(servicesMap.values());
    if (!sortByScore) return services;
    const sortedByScore = sortSearchCards(services);
    return sortOrganizationsByBranchCount(sortedByScore);
};

export default transformCardIdToNewFormat;
