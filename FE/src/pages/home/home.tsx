import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
import OptionalSearch from "./optionalSearch/optionalSearch";
import Footer from "../../components/footer/footer";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../constants/mediaQueryProps";

const Home = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyle();
    return <main className={classes.root}>
        <section className={classes.main}>

            {!isMobile && <Header showSearchbar={false} showLogo={false}/>}
            <OptionalSearch/>
            <Footer/>
        </section>
        <Search/>
    </main>
}

export default Home;
