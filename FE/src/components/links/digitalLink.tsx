import useStyles from './links.css'
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../store/general/general.selector.ts";

const LINK = 'https://www.gov.il/he/departments/national-digital-agency/govil-landing-page'
const LINK_TEXT = 'מערך הדיגיטל הלאומי'
const digitalLogo = '/icons/icon-state-of-israel.svg'

const DigitalLink = () => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({accessibilityActive});
    return <a href={LINK} className={`${classes.root} ${classes.digitalLink}`}>
        <img className={`${classes.icon}`} src={digitalLogo} alt={"digital logo"}/>
        {LINK_TEXT}
    </a>;
}

export default DigitalLink
