import {ICard} from "../../../../../types/cardType";
import useStyle from "./moreServicesInBranch.css";
import {getLinkToCard} from "../../../../../services/str";
import CardBanner from "../../../../../components/cardBanner/cardBanner";

const MoreServicesInBranch = ({moreServicesInBranch}: { moreServicesInBranch: ICard[] }) => {
    const moreServicesInBranchTitle = window.strings.cardDetails.moreServicesInBranchTitle;
    const classes = useStyle();
    return (
        <div className={classes.mainDiv}>
            <span className={classes.title}>{moreServicesInBranchTitle}</span>
            {moreServicesInBranch.map((service: ICard) => (
                <a key={service.card_id} href={getLinkToCard(service.card_id)} className={classes.aTag}>
                    <CardBanner key={service.card_id} card={service}/>
                </a>
            ))}
        </div>
    )
}
export default MoreServicesInBranch;
