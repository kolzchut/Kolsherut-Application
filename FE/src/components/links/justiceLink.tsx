import useStyles from './links.css'
const LINK = 'https://www.gov.il/he/departments/ministry_of_justice/govil-landing-page'
const LINK_TEXT =  'משרד המשפטים'

const justiceLogo = "/icons/icon-state-of-israel.svg"

const JusticeLink =() => {
    const classes = useStyles();

    return <a href={LINK} className={`${classes.root} ${classes.justiceLink}`}>
        <img className={`${classes.icon}`} src={justiceLogo} alt={"justice logo"}/>
        {LINK_TEXT}
    </a>;
}

export default JusticeLink
