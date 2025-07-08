import CardBanner from "../../../components/cardBanner/cardBanner";
import {IService} from "../../../types/serviceType";
import {ICard} from "../../../types/cardType";
import useStyles from "./hits.css";
import Organization from "./organization/organization";
import OrganizationWithSingleBranch from "./organization/organizationWithSingleBranch";

const Hits = ({service}: { service: IService }) => {
    const classes = useStyles();

    return <div className={classes.mainDiv} key={service.id}>
        <CardBanner card={service as unknown as ICard}/>
        <div>
            {service.organizations.map((organization) => {
                const singleBranch = organization.branches.length == 1;
                if(singleBranch) return <OrganizationWithSingleBranch key={organization.id} branch={organization.branches[0]}/>
                return <Organization key={organization.id} organization={organization}/>;
            })}
        </div>
    </div>
}

export default Hits;
