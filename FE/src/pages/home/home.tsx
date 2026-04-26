import useStyle from "./home.css";
import Header from "../../components/header/header";
import Search from "./search/search";
import OptionalSearch from "./optionalSearch/optionalSearch";
import Footer from "../../components/footer/footer";
import getHomeMetaTags from "./getHomeMetaTags";
import getHomeJsonLd from "./getHomeJsonLd";
import MetaTags from "../../services/metaTags/metaTags";
import JsonLd from "../../services/jsonLd/jsonLd";
import {isMobileScreen} from "../../services/media";

const Home = () => {
    const isMobile = isMobileScreen();
    const metaTagsData = getHomeMetaTags();
    const jsonLdData = getHomeJsonLd();
    const classes = useStyle({isMobile});

    return <>
        {metaTagsData && <MetaTags {...metaTagsData}/>}
        {jsonLdData && <JsonLd {...jsonLdData}/>}
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
