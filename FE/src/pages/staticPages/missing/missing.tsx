import {useTheme} from 'react-jss';
import useStyle from "./missing.css";
import MissingSection from "./missingSection/missingSection";
import IDynamicThemeApp from "../../../types/dynamicThemeApp";
import StaticPageLayout from "../staticPageLayout";

interface Service {
    title: string;
    buttonTitle?: string;
    href?: string;
    content: { title?: string; paragraphs?: string[]; links?: Array<{ key: string; href: string; }>; }[];
}

const Missing = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle(theme);
    const strings = window.strings.staticModals.addService;
    const services: Service[] = window.modules;

    return <StaticPageLayout slug={'missing'}>
        <div className={classes.root}>
            <div className={classes.header}>
                <h1 className={classes.title}>{strings.title}</h1>
                <h2 className={classes.subtitle}>{strings.subtitleOne}</h2>
            </div>
            {services.map((service: Service, index: number) => (
                <div className={classes.sectionWrapper} key={`${service.title}${index}`}>
                    <MissingSection title={service.title} content={service.content}/>
                    {service.buttonTitle && service.href &&
                        <a target={"_blank"} rel={"noopener noreferrer"} href={service.href}>
                            <button className={classes.button}>{service.buttonTitle}</button>
                        </a>}
                </div>
            ))}
        </div>
    </StaticPageLayout>
}

export default Missing;
