import Map from "../../components/map/map";
import useStyle from "./card.css";
import {backToHome, getFullCard, setMapToCard} from "./cardLogic";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {getCardId} from "../../store/general/general.selector";
import {ICard} from "../../types/cardType";
import CardDetails from "./cardDetails/cardDetails";

const Card = () => {
    const classes = useStyle();
    const cardId = useSelector(getCardId)
    const [fullCard, setFullCard] = useState<ICard | null>(null)
    useEffect(()=>{
        const fetchCard = async () => {
            const cardData = await getFullCard(cardId);
            if(cardData !== null) {
                setFullCard(cardData);
                setMapToCard(cardData)
                return;
            }
            backToHome();
        };
        fetchCard();
    },[cardId])
    return (
        <main className={classes.root}>
            <section className={classes.mapContainer}>
                <Map/>
            </section>
            {fullCard &&<CardDetails card={fullCard}/>}
        </main>
    );
}
export default Card;
