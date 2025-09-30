import useStyles from './links.css'
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../types/dynamicThemeApp.ts";

const LINK = 'https://www.kolzchut.org.il/he/כל-זכות:אודות_המיזם';
const LINK_TEXT = 'כל זכות'
const kzLogo = '/icons/icon-kz.svg'

const KZLink = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    return <a target={'_blank'} href={LINK} className={`${classes.root} ${classes.kzLink}`}>
        <img className={classes.icon} src={kzLogo} alt={"kz logo"}/>
        {LINK_TEXT}
    </a>;
}

export default KZLink;
