import useStyle from './about.css';
import JusticeLink from "../../../components/links/justiceLink";
import DigitalLink from "../../../components/links/digitalLink";
import KZLink from "../../../components/links/kzLink";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../types/dynamicThemeApp";
import StaticPageLayout from "../staticPageLayout";

const About = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const strings = window.strings.staticModals.about;
    const classes = useStyle(theme);
    return <StaticPageLayout slug={'about'}>
        <div className={classes.root}>
            <div className={classes.header}>
                <h1 className={classes.title}>{strings.title}</h1>
                <h2 className={classes.subtitle}>{strings.subtitleOne}</h2>
                <h2 className={classes.subtitle}>{strings.subtitleTwo}</h2>
            </div>
            <div>
                <span className={classes.boldStartText}>{strings.paragraphOneMarkedStart}</span>
                <p className={classes.inlineParagraph}>
                    {strings.paragraphOne}
                </p>
                <p className={classes.paragraph}>{strings.paragraphTwo}</p>
                <div className={classes.links}>
                    <p className={classes.paragraph}>{strings.paragraphThree}
                        <KZLink/>
                    </p>
                    <p className={classes.paragraph}> {strings.paragraphFour}
                        <JusticeLink/>
                    </p>
                    <p className={classes.paragraph}>{strings.paragraphFive}
                        <DigitalLink/>
                    </p>
                </div>
                <p className={classes.paragraph}>{strings.paragraphSix}</p>
                <p className={classes.paragraph}>{strings.paragraphSeven}</p>
                <p className={classes.inlineParagraph}>{strings.paragraphEight}
                    <a target={'_blank'} className={classes.blackRegularLink}
                       href={window.config.redirects.policyLink}>{strings.paragraphEightLink}</a>
                </p>
            </div>
        </div>
    </StaticPageLayout>
}

export default About;
