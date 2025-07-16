import useStyles from './links.css'
const LINK = 'https://www.gov.il/he/departments/national-digital-agency/govil-landing-page'
const LINK_TEXT = 'מערך הדיגיטל הלאומי'
const digitalLogo = '/icons/icon-state-of-israel.svg'

const DigitalLink = () => {
    const classes = useStyles();
    return <a href={LINK} className={`${classes.root} ${classes.digitalLink}`}>
        <img className={`${classes.icon}`} src={digitalLogo} alt={"digital logo"}/>
        {LINK_TEXT}
    </a>;
}

export default DigitalLink
