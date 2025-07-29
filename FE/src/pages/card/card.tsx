import Map from "../../components/map/map";
import useStyle from "./card.css";
import {backToHome, getFullCard, setCardOnMap, setMapBackToDefault} from "./cardLogic";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {getCardId} from "../../store/general/general.selector";
import {ICard} from "../../types/cardType";
import CardDetails from "./cardDetails/cardDetails";
import cardAnalytics from "../../services/gtag/cardEvents";
import Header from "../../components/header/header.tsx";
import getCardMetaTags from "./getCardMetaTags.ts";
import MetaTags from "../../services/metaTags.tsx";

const Card = () => {
    const classes = useStyle();
    const [fullCard, setFullCard] = useState<ICard | null>(null)
    const cardId = useSelector(getCardId)
    const metaTagsData = fullCard ? getCardMetaTags(fullCard) : null;
    useEffect(() => {
        const fetchCard = async () => {
            const cardData = await getFullCard(cardId); // TODO: Fix this
            if (cardData !== null) {
                setFullCard(cardData);
                setCardOnMap(cardData)
                cardAnalytics.cardEvent(cardData, 0, false, 'card');
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
