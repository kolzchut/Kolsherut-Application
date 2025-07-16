import useStyles from './links.css'
import digitalLogo from '../../../public/icons/icon-state-of-israel.svg'
const LINK = 'https://www.gov.il/he/departments/national-digital-agency/govil-landing-page'
const LINK_TEXT =  'מערך הדיגיטל הלאומי'

const DigitalLink =() => {
    const classes = useStyles();

    return <a href={LINK} className={`${classes.root} ${classes.digitalLink}`}>
    <img className={`${classes.icon}`} src={digitalLogo} alt={"digital logo"}/>
    {LINK_TEXT}
    </a>;
}

export default DigitalLink
