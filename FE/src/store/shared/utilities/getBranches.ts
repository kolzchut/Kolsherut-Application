import {IBranch, IOrganization, IService} from "../../../types/serviceType";

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
                const extendedBranch = {
                    ...branch,
                    organizationName: organization.name,
                    serviceDescription: service.service_description,
                    serviceName: service.service_name
                };
                branches.push(extendedBranch)
            })
        })
    });
    return branches;
}
