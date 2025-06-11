import useStyle from "./home.css";
import Header from "../../components/header/header.tsx";
import Search from "./search/search.tsx";
const homePage = () => {
        const classes = useStyle();
        return <div className={classes.root}>
                <Header/>
                <Search/>
        </div>
}

export default homePage;
