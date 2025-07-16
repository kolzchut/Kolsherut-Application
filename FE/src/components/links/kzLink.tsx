import useStyles from './links.css'
const LINK = 'https://www.kolzchut.org.il/he/כל-זכות:אודות_המיזם';
const LINK_TEXT = 'כל זכות';
const kzLogo = "/icons/icon-kz.svg"

const KZLink = () => {
    const classes = useStyles();
    return <a href={LINK} className={`${classes.root} ${classes.kzLink}`}>
        <img className={`${classes.icon}`} src={kzLogo} alt={"digital logo"}/>
        {LINK_TEXT}
    </a>;
}

export default KZLink
