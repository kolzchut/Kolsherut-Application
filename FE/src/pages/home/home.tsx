import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
import OptionalSearch from "./optionalSearch/optionalSearch";
import Footer from "../../components/footer/footer";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../constants/mediaQueryProps";
import getHomeMetaTags from "./getHomeMetaTags";
import MetaTags from "../../services/metaTags";

const Home = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const metaTagsData = getHomeMetaTags();
    const classes = useStyle();
    return <>
        {metaTagsData && <MetaTags {...metaTagsData}/>}
        <main className={classes.root}>
            <section className={classes.main}>

                {!isMobile && <Header showSearchbar={false} showLogo={false}/>}
                <OptionalSearch/>
                <Footer/>
            </section>
            <Search/>
        </main>
    </>
}

export default Home;
