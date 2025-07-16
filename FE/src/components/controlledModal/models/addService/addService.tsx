import useStyle from "./addService.css";
import {store} from "../../../../store/store";
import {setModal} from "../../../../store/general/generalSlice";
import closeIcon from "../../../../assets/icon-close-black.svg";
import AddServiceBox from "./addServiceBox/addServiceBox";
import {useState} from "react";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../../constants/mediaQueryProps.ts";

interface Service {
    title: string;
    content: { title?: string; paragraphs?: string[]; links?: Array<{ key: string; href: string; }>; }[];
}

const AddService = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyle({isMobile});
    const [selectedService, setSelectedService] = useState<number>(-1);
    const strings = window.strings.staticModals.addService;
    const [services] = useState(window.modules);

    const close = () => store.dispatch(setModal(null));
    const click = (clickedPart: number) => setSelectedService(prev => clickedPart !== prev ? clickedPart : -1);
    const showButton = selectedService > -1 && !!services[selectedService].buttonTitle;
    return <div className={classes.root}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
        <div className={classes.header}>
            <h1 className={classes.title}>{strings.title}</h1>
            <h3 className={classes.subtitle}>{strings.subtitleOne}</h3>
        </div>
        {
            services.map((service:Service, index: number) => {
                const onClick = () => click(index);
                return (<>
                    <AddServiceBox key={service.title} isExtendedBox={selectedService === index} onClick={onClick}
                                   title={service.title} content={service.content}/>
                </>);
            })
        }
        {showButton && <a href={services[selectedService].href}>
            <button className={classes.button}>{services[selectedService].buttonTitle}</button>
        </a>}
    </div>
}
export default AddService;
