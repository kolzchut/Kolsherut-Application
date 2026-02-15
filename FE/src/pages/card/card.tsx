import Map from "../../components/map/map";
import useStyle from "./card.css";
import {backToHome, getFullCard, setCardOnMap, setMapBackToDefault} from "./cardLogic";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {getCardId} from "../../store/general/general.selector";
import {ICard} from "../../types/cardType";
import CardDetails from "./cardDetails/cardDetails";
import cardAnalytics from "../../services/gtag/cardEvents";
import Header from "../../components/header/header";
import getCardMetaTags from "./getCardMetaTags";
import MetaTags from "../../services/metaTags/metaTags";
import {useGetCurrentRoute} from "../../services/url/route";

const Card = () => {
    const classes = useStyle();
    const [fullCard, setFullCard] = useState<ICard | null>(null)
    const cardId = useSelector(getCardId)
    const cardUrl = useGetCurrentRoute();
    const metaTagsData = fullCard ? getCardMetaTags({card: fullCard, cardUrl}) : null;
    useEffect(() => {
        const fetchCard = async () => {
            const cardData = await getFullCard(cardId);
            if (cardData !== null) {
                setFullCard(cardData);
                setCardOnMap(cardData)
                cardAnalytics.cardEvent(cardData, 0, false);
                return;
            }
            backToHome();
        };
        if (cardId) fetchCard();
        return () => {
            setMapBackToDefault();
        }
    }, [cardId])
    return (
        <>
            {metaTagsData && <MetaTags {...metaTagsData}/>}
            <main>
                <Header/>
                <section className={classes.root}>
                    <div className={classes.mapContainer}>
                        <Map/>
                    </div>
                    {fullCard && <CardDetails card={fullCard}/>}
                </section>
            </main>
        </>
    );
}
export default Card;
