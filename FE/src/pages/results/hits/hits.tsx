import CardBanner from "../../../components/cardBanner/cardBanner";
import {IService} from "../../../types/serviceType";
import {ICardForBanner} from "../../../types/cardType";
import useStyles from "./hits.css";
import Organization from "./organization/organization";
import OrganizationWithSingleBranch from "./organization/organizationWithSingleBranch";
import ShowMore from "./showMore/showMore";
import {useEffect, useState} from "react";

const Hits = ({service}: { service: IService }) => {
    const classes = useStyles();
    const baseMaxOfOrganizationsDisplayed = window.config.baseMaxOfOrganizationsDisplayed;
    useEffect(() => {
        setDisplayShowMore(service.organizations.length > baseMaxOfOrganizationsDisplayed)
    }, [baseMaxOfOrganizationsDisplayed, service.organizations.length]);
    const [maxOfOrganizationsDisplayed, setMaxOfOrganizationsDisplayed] = useState<number>(baseMaxOfOrganizationsDisplayed);
    const [displayShowMore, setDisplayShowMore] = useState<boolean>(service.organizations.length > baseMaxOfOrganizationsDisplayed);
    if(!service || !service.organizations || service.organizations.length === 0) return <></>;
    const showMoreClicked = () => {
        const newMax = maxOfOrganizationsDisplayed + 10;
        if(!displayShowMore) return;
        if(newMax >= service.organizations.length) setDisplayShowMore(false);
        setMaxOfOrganizationsDisplayed(newMax);
    }
    const organizationsToDisplay = service.organizations.slice(0, maxOfOrganizationsDisplayed);
    return <div className={classes.mainDiv} key={service.id}>
        <CardBanner card={service as unknown as ICardForBanner}/>
        <div>
            {organizationsToDisplay.map((organization) => {
                const singleBranch = organization.branches?.length == 1;
                if(singleBranch) return <OrganizationWithSingleBranch key={organization.id} branch={organization.branches[0]} orgName={organization.name}/>
                return <Organization key={organization.id} organization={organization} serviceId={service.id}/>;
            })}
            {displayShowMore && <ShowMore onClick={showMoreClicked} count={service.organizations.length - maxOfOrganizationsDisplayed}/>}
        </div>
    </div>
}

export default Hits;
