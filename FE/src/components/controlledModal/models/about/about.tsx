import useStyle from './about.css';
import closeIcon from "../../../../assets/icon-close-black.svg";
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import JusticeLink from "../../../links/justiceLink";
import DigitalLink from "../../../links/digitalLink";
import KZLink from "../../../links/kzLink";

const About = () => {
    const strings = window.strings.staticModals.about;
    const classes = useStyle();
    const close = () => store.dispatch(setModal(null));
    return <div className={classes.root}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
        <div className={classes.header}>
            <h1 className={classes.title}>{strings.title}</h1>
            <h3 className={classes.subtitle}>{strings.subtitleOne}</h3>
            <h3 className={classes.subtitle}>{strings.subtitleTwo}</h3>
        </div>
        <div>
            <span className={classes.boldStartText}>{strings.paragraphOneMarkedStart}</span>
            <p className={classes.inlineParagraph}>
                {strings.paragraphOne}
            </p>
            <p className={classes.paragraph}>{strings.paragraphTwo}</p>
            <p className={classes.paragraph}>{strings.paragraphThree}
                <KZLink/>
            </p>
            <p className={classes.paragraph}> {strings.paragraphFour}
                <JusticeLink/>
            </p>
            <p className={classes.paragraph}>{strings.paragraphFive}
                <DigitalLink/>
            </p>
            <p className={classes.paragraph}>{strings.paragraphSix}</p>
            <p className={classes.paragraph}>{strings.paragraphSeven}</p>
            <p className={classes.paragraph}>{strings.paragraphEight}
                <a className={classes.blackRegularLink} href={window.config.redirects.policyLink}>{strings.paragraphEightLink}</a>
            </p>
        </div>
    </div>

}
export default About;
