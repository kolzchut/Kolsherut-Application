import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
import OptionalSearch from "./optionalSearch/optionalSearch";

const Home = () => {
    const classes = useStyle();
    return <div className={classes.root}>
        <div className={classes.main}>
            <Header/>
            <OptionalSearch/>
        </div>
        <Search/>
    </div>
}

export default Home;
