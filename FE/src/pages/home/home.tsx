import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
const Home = () => {
        const classes = useStyle();
        return <div className={classes.root}>
                <Header/>
                <Search/>
        </div>
}

export default Home;
