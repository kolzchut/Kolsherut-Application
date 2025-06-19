import Map from "../../components/map/map";
import useStyle from "../home/home.css";

const Card = () => {
    const classes = useStyle();
    return (
        <main className={classes.root}>
            <section>
            <h1>Card Component</h1>
            <p>This is a placeholder for the card component.</p>
            </section>
            <section className={classes.mapContainer}>
                <Map/>
            </section>
        </main>
    );
}
export default Card;