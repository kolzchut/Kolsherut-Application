import {ICardForBanner} from "../../../../../types/cardType";
import useStyle from "./moreServicesInBranch.css";
import CardBanner from "../../../../../components/cardBanner/cardBanner";
import {reRouteToCard} from "../../../../../services/routes/reRoute";
import {getHrefForCard} from "../../../../../services/href";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp";
import {isMobileScreen} from "../../../../../services/media";

const MoreServicesInBranch = ({moreServicesInBranch, scrollRef}: {
    moreServicesInBranch: ICardForBanner[],
    scrollRef: React.RefObject<HTMLDivElement | null>
}) => {
    const moreServicesInBranchTitle = window.strings.cardDetails.moreServicesInBranchTitle;
    const theme = useTheme<IDynamicThemeApp>();
    const isMobile = isMobileScreen();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    return (
        <div className={classes.mainDiv}>
            <span className={classes.title}>{moreServicesInBranchTitle}</span>
            {moreServicesInBranch.map((service: ICardForBanner) => {
                const href = getHrefForCard(service.card_id);
                const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (isMobile) window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                    });
                    else if (scrollRef.current) scrollRef.current.scrollTo({top: 0, behavior: "smooth"});
                    reRouteToCard({cardId: service.card_id});
                };
                return (<a href={href} key={service.card_id}
                           onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e)} className={classes.aTag}>
                    <CardBanner key={service.card_id} card={service}/>
                </a>);
            })}
        </div>
    )
}
export default MoreServicesInBranch;
