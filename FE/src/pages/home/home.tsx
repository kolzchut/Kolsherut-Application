import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
import OptionalSearch from "./optionalSearch/optionalSearch";

const Home = () => {
    const classes = useStyle();
    return <main className={classes.root}>
        <section className={classes.main}>
            <Header/>
            <OptionalSearch/>
        </section>
        <Search/>
    </main>
}

export default Home;
