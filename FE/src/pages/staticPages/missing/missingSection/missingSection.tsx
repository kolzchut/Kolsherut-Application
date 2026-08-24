import useStyle from "./missingSection.css";
import {useTheme} from 'react-jss';
import IDynamicThemeApp from "../../../../types/dynamicThemeApp";

// Always expanded: on a page there is nothing to collapse into, so the chevron toggle that
// the modal version used is gone and all content renders unconditionally.
const MissingSection = ({title, content}: {
    title: string,
    content: Array<{ title?: string, paragraphs?: string[], links?: Array<{ key: string, href: string }> }>,
}) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});

    return <section className={classes.root}>
        <h2 className={classes.title}>{title}</h2>
        {content.map((item, index) => (
            <div className={classes.openDiv} key={index}>
                {item.title && <h3 className={classes.subtitle}>{item.title}</h3>}
                {item.paragraphs && item.paragraphs.map((paragraph, pIndex) => (
                    <p className={classes.paragraph} key={`${index}-${pIndex}`}>{paragraph}</p>
                ))}
                {item.links && item.links.map((link, lIndex) => (
                    <a className={classes.link} key={`${index}-${lIndex}`} href={link.href}
                       target="_blank" rel="noopener noreferrer">{link.key}</a>
                ))}
            </div>
        ))}
    </section>
}

export default MissingSection;
