import useStyle from './footer.css';
import LinksMenu from "./linksMenu/linksMenu";
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../types/dynamicThemeApp.ts";

const israelIcon = "/icons/icon-state-of-israel.svg"
const logoKZ = "/icons/icon-kz.svg"

const Footer = ({hideLinks=false}: {hideLinks?: boolean}) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle(theme);

    const nameOfWebsite = window.strings.footer.nameOfWebsite;
    const firstParagraph = window.strings.footer.firstParagraph;
    const runBy = window.strings.footer.runBy;
    const nameOfOrganization = window.strings.footer.nameOfOrganization;
    const secondParagraph = window.strings.footer.secondParagraph.split('%%MACRO%%');
    const secondParagraphFirstMacro = window.strings.footer.secondParagraphFirstMacro
    const secondParagraphSecondMacro = window.strings.footer.secondParagraphSecondMacro;
    const thirdParagraph = window.strings.footer.thirdParagraph.split('%%MACRO%%');
    const thirdParagraphMacro = window.strings.footer.thirdParagraphMacro;
    const kzLink = window.config.redirects.kolzchutLink;
    const justiceLink = window.config.redirects.justiceLink;
    const nationalDigitalLink = window.config.redirects.nationalDigitalLink;
    const policyLink = window.config.redirects.policyLink;

    return (<footer>
        <div className={classes.disclaimer}>
            <span className={classes.firstParagraph}>
                <span className={classes.bolder}>{nameOfWebsite} </span>
                {firstParagraph}
            </span>
            <p className={classes.secondAndThirdParagraphs}>{runBy}
                <a href={kzLink} target='_blank'>
                    <img className={classes.icons} src={logoKZ} alt={"logo kolzchut"}/>
                    {nameOfOrganization}
                </a>
            </p>
            <p className={classes.secondAndThirdParagraphs}>{secondParagraph[0]}
                <a href={justiceLink} target='_blank'>
                    <img className={classes.icons} src={israelIcon} alt={"justice department icon"}/>
                    {secondParagraphFirstMacro}</a>
                {secondParagraph[1]}
                <a href={nationalDigitalLink} target='_blank'>
                    <img className={classes.icons} src={israelIcon} alt={"national digital icon"}/>
                    {secondParagraphSecondMacro}</a>
                {secondParagraph[2]}
            </p>
            <p className={classes.secondAndThirdParagraphs}>{thirdParagraph[0]}
                <a href={policyLink} target='_blank'>{thirdParagraphMacro}</a>
                {thirdParagraph[1]}
            </p>
        </div>
        {!hideLinks && <LinksMenu/>}
    </footer>)
}
export default Footer;
