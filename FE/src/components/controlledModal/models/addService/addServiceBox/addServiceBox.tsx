import openIcon from "../../../../../assets/icon-chevron-down-blue.svg";
import useStyle from "./addServiceBox.css";
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp";
import {createKeyboardHandler} from "../../../../../services/keyboardHandler";

const AddServiceBox = ({title, content, isExtendedBox, onClick}: {
    title: string,
    content: Array<{ title?: string, paragraphs?: string[], links?: Array<{ key: string, href: string }> }>,
    isExtendedBox: boolean,
    onClick: () => void
}) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({isExtendedBox, accessibilityActive: theme.accessibilityActive});

    const handleKeyDown = createKeyboardHandler(onClick);

    return <div className={classes.root}>
        <img
            src={openIcon}
            className={classes.arrow}
            alt={"Toggle Details"}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={isExtendedBox ? "Collapse details" : "Expand details"}
        />
        <h4 className={classes.title}>{title}</h4>
        {isExtendedBox && content.map((item, index) => (
            <div className={classes.openDiv}>
                <h5 className={classes.subtitle}>{item.title}</h5>
                {item.paragraphs && item.paragraphs.map((paragraph, pIndex) => (
                    <p className={classes.paragraph} key={`${index}-${pIndex}`}>{paragraph}</p>
                ))}
                {item.links && item.links.map((link, lIndex) => (
                    <a className={classes.link} key={`${index}-${lIndex}`} href={link.href}
                       target="_blank">{link.key}</a>
                ))}
            </div>
        ))
        }
    </div>

}
export default AddServiceBox;
