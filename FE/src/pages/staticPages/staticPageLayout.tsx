import React, {useEffect} from "react";
import {useTheme} from "react-jss";
import useStyle from "./staticPageLayout.css";
import Header from "../../components/header/header";
import Search from "../home/search/search";
import Footer from "../../components/footer/footer";
import MetaTags from "../../services/metaTags/metaTags";
import getStaticPageMetaTags from "./getStaticPageMetaTags";
import IDynamicThemeApp from "../../types/dynamicThemeApp";
import {StaticPageSlug} from "../../services/url/staticPages";

const StaticPageLayout = ({slug, children}: { slug: StaticPageSlug, children: React.ReactNode }) => {
    // Read isMobile from the theme, not isMobileScreen(): App seeds it to false and only
    // updates it inside an effect, so the first client render matches the prerendered HTML.
    const {isMobile} = useTheme<IDynamicThemeApp>();
    const classes = useStyle({isMobile});
    const metaTagsData = getStaticPageMetaTags(slug);

    useEffect(() => {
        window.scrollTo({top: 0});
    }, [slug]);

    return <>
        {metaTagsData && <MetaTags {...metaTagsData}/>}
        <main className={classes.root}>
            <div className={classes.hero}>
                <Search titleAs={'p'}/>
            </div>
            <section className={classes.main}>
                {isMobile
                    ? <Header showHomeLink key={`${slug}HeaderMobile`}/>
                    : <Header showSearchbar={false} showLogo={false} showHomeLink key={`${slug}Header`}/>}
                <article className={classes.content}>{children}</article>
                <div className={classes.footerContainer}>
                    <Footer/>
                </div>
            </section>
        </main>
    </>;
};

export default StaticPageLayout;
