import useStyles from './links.css'
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../types/dynamicThemeApp.ts";

const LINK = 'https://www.gov.il/he/departments/national-digital-agency/govil-landing-page'
const LINK_TEXT = 'מערך הדיגיטל הלאומי'
const digitalLogo = '/icons/icon-state-of-israel.svg'

const DigitalLink = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    return <a target={'_blank'} href={LINK} className={`${classes.root} ${classes.digitalLink}`}>
        <img className={`${classes.icon}`} src={digitalLogo} alt={"digital logo"}/>
        {LINK_TEXT}
    </a>;
}

export default DigitalLink
