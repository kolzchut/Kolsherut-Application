import {ICardForBanner} from "../../../../../types/cardType";
import useStyle from "./moreServicesInBranch.css";
import CardBanner from "../../../../../components/cardBanner/cardBanner";
import {reRouteToCard} from "../../../../../services/routes/reRoute";
import {getHrefForCard} from "../../../../../services/href";

const MoreServicesInBranch = ({moreServicesInBranch}: { moreServicesInBranch: ICardForBanner[] }) => {
    const moreServicesInBranchTitle = window.strings.cardDetails.moreServicesInBranchTitle;

    const classes = useStyle();
    return (
        <div className={classes.mainDiv}>
            <span className={classes.title}>{moreServicesInBranchTitle}</span>
            {moreServicesInBranch.map((service: ICardForBanner) => {
                const href = getHrefForCard(service.card_id);
                const onClick = () => {
                    reRouteToCard({cardId: service.card_id})
                    return false;
                };
                return (<a href={href} key={service.card_id} onClick={onClick} className={classes.aTag}>
                    <CardBanner key={service.card_id} card={service}/>
                </a>);
            })}
        </div>
    )
}
export default MoreServicesInBranch;
