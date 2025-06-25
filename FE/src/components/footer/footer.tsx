import logoKZ from '../../assets/icon-kz.svg';
import israelIcon from '../../assets/icon-state-of-israel.svg'
import useStyle from './footer.css';
import LinksMenu from "./linksMenu/linksMenu";

const Footer = () => {

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
    const classes = useStyle();

    return (<footer>
        <div className={classes.disclaimer}>
            <span className={classes.firstParagraph}>
                <span className={classes.bolder}>{nameOfWebsite} </span>
                {firstParagraph}
            </span>
            <p className={classes.secondAndThirdParagraphs}>{runBy}
                <a href={kzLink} target='_blank'>
                    <img className={classes.icons} src={logoKZ} alt={"logo kol zchut"}/>
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
        <LinksMenu/>
    </footer>)
}
export default Footer;
