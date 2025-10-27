import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
import OptionalSearch from "./optionalSearch/optionalSearch";
import Footer from "../../components/footer/footer";
import getHomeMetaTags from "./getHomeMetaTags";
import MetaTags from "../../services/metaTags";
import {isMobileScreen} from "../../services/media";

const Home = () => {
    const isMobile = isMobileScreen();
    const metaTagsData = getHomeMetaTags();
    const classes = useStyle();

    return <>
        {metaTagsData && <MetaTags {...metaTagsData}/>}
        <main className={classes.root}>
            <section className={classes.main}>

                {!isMobile && <Header showSearchbar={false} showLogo={false} key={'homeHeader'}/>}
                <OptionalSearch/>
                <Footer/>
            </section>
            <Search/>
        </main>
    </>
}

export default Home;
