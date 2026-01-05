import { useTheme } from 'react-jss';
import useStyle from "./addService.css";
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";
import AddServiceBox from "./addServiceBox/addServiceBox";
import {useState} from "react";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp";
import {createKeyboardHandler} from "../../../../services/keyboardHandler";

interface Service {
    title: string;
    content: { title?: string; paragraphs?: string[]; links?: Array<{ key: string; href: string; }>; }[];
}

const AddService = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle(theme);
    const [selectedService, setSelectedService] = useState<number>(-1);
    const strings = window.strings.staticModals.addService;
    const [services] = useState(window.modules);

    const close = () => store.dispatch(setModal(null));
    const handleCloseKeyDown = createKeyboardHandler(close);
    const click = (clickedPart: number) => setSelectedService(prev => clickedPart !== prev ? clickedPart : -1);
    const showButton = selectedService > -1 && !!services[selectedService].buttonTitle;
    return <div className={classes.root}>
        <img
            className={classes.closeIcon}
            src={closeIcon}
            onClick={close}
            onKeyDown={handleCloseKeyDown}
            tabIndex={0}
            role="button"
            aria-label="Close modal"
            alt={"close icon"}
        />
        <div className={classes.header}>
            <h1 className={classes.title}>{strings.title}</h1>
            <h3 className={classes.subtitle}>{strings.subtitleOne}</h3>
        </div>
        {
            services.map((service:Service, index: number) => {
                const onClick = () => click(index);
                return (<>
                    <AddServiceBox key={service.title+index} isExtendedBox={selectedService === index} onClick={onClick}
                                   title={service.title} content={service.content}/>
                </>);
            })
        }
        {showButton && <a target={"_blank"} href={services[selectedService].href}>
            <button className={classes.button}>{services[selectedService].buttonTitle}</button>
        </a>}
    </div>
}
export default AddService;
