import useStyles from './links.css'
import justiceLogo from '../../../public/icons/icon-state-of-israel.svg'
const LINK = 'https://www.gov.il/he/departments/ministry_of_justice/govil-landing-page'
const LINK_TEXT =  'משרד המשפטים'

const JusticeLink =() => {
    const classes = useStyles();

    return <a href={LINK} className={`${classes.root} ${classes.justiceLink}`}>
        <img className={`${classes.icon}`} src={justiceLogo} alt={"justice logo"}/>
        {LINK_TEXT}
    </a>;
}

export default JusticeLink
