import Map from "../../components/map/map";
import useStyle from "../home/home.css";
import {getFullCard} from "./cardLogic";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {getCardId} from "../../store/general/general.selector";

const Card = () => {
    const classes = useStyle();
    const cardId = useSelector(getCardId)
    const [fullCard, setFullCard] = useState({})
    useEffect(()=>{
        const fetchCard = async () => {
            const cardData = await getFullCard(cardId);
            setFullCard(cardData);
        };
        fetchCard();
    },[cardId])
    console.log('full card', fullCard)
    return (
        <main className={classes.root}>
            <section className={classes.mapContainer}>
                <Map/>
            </section>
            <section>
            <h1>Card Component</h1>
            <p>This is a placeholder for the card component.</p>
            </section>
        </main>
    );
}
export default Card;