import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
import OptionalSearch from "./optionalSearch/optionalSearch";
import Footer from "../../components/footer/footer";
import getHomeMetaTags from "./getHomeMetaTags";
import MetaTags from "../../services/metaTags/metaTags";
import {isMobileScreen} from "../../services/media";

const Home = () => {
    const isMobile = isMobileScreen();
    const metaTagsData = getHomeMetaTags();
    const classes = useStyle({isMobile});

    return <>
        {metaTagsData && <MetaTags {...metaTagsData}/>}
        <main className={classes.root}>
            <Search/>
            <section className={classes.main}>
                {!isMobile && <Header showSearchbar={false} showLogo={false} key={'homeHeader'}/>}
                <OptionalSearch/>
                <Footer/>
            </section>
        </main>
    </>
}

export default Home;
