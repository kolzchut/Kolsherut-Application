import useStyles from './links.css'
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../store/general/general.selector.ts";

const LINK = 'https://www.kolzchut.org.il/he/כל-זכות:אודות_המיזם';
const LINK_TEXT = 'כל זכות'
const kzLogo = '/icons/icon-kz.svg'

const KZLink = () => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({accessibilityActive});
    return <a href={LINK} className={`${classes.root} ${classes.kzLink}`}>
        <img className={`${classes.icon}`} src={kzLogo} alt={"kz logo"}/>
        {LINK_TEXT}
    </a>;
}

export default KZLink;
