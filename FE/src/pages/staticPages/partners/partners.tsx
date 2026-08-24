import useStyle from "./partners.css";
import {useTheme} from 'react-jss';
import IDynamicThemeApp from "../../../types/dynamicThemeApp";
import StaticPageLayout from "../staticPageLayout";

const Partners = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle(theme);
    const strings = window.strings.staticModals.partners;
    return <StaticPageLayout slug={'partners'}>
        <div className={classes.root}>
            <div>
                <h1 className={classes.title}>{strings.title}</h1>
            </div>
            <div>
                <p className={classes.text}>{strings.paragraphOne}</p>
                <ul>
                    {strings.list.map((item: string, index: number) => (
                        <li className={classes.text} key={index}>{item}</li>
                    ))}
                </ul>
                <p className={classes.text}>{strings.paragraphTwo}</p>
            </div>
        </div>
    </StaticPageLayout>
}

export default Partners;
