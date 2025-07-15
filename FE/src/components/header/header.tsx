import useStyle from "./header.css";
import logo from "../../assets/logo.svg";
import inactiveSearchIcon from "../../assets/icon-search-blue-1.svg";
import activeSearchIcon from "../../assets/icon-search-blue-0.svg";
import { useRef, useState} from "react";
import {setModal, setPage, setShowSidebar} from "../../store/general/generalSlice";
import {store} from "../../store/store";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../constants/mediaQueryProps.ts";
import hamburger from "../../assets/icon-hamburger.svg";

const Header = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyle();
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const onSearch = () => {
        if (!inputRef.current) return;
        const searchValue = inputRef.current.value.trim();
        if (!searchValue) return;
        //TODO : COMPLETE THIS
        console.log('placeholder until finish search logic', searchValue);
    }
    const handleIconClick = () =>{
        if(!isMobile) return store.dispatch(setPage('home'))
        return store.dispatch(setShowSidebar(true));
    }
    const {names} = window.strings.staticModals
    return <div className={classes.root}>
        <img onClick={handleIconClick} className={classes.logo} src={isMobile ? hamburger : logo} alt={"kolsherut logo"}/>
        <div className={classes.inputDiv}>
            <img className={classes.searchIcon} alt={"search icon"} onClick={onSearch}
                 src={isInputFocused ? activeSearchIcon : inactiveSearchIcon}/>
            <input ref={inputRef} className={classes.input} type={"text"} onFocus={() => setIsInputFocused(true)}
                   onBlur={() => setIsInputFocused(false)} onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();}}/>
        </div>
        {!isMobile && <div className={classes.linksDiv}>
            <span className={classes.link} onClick={() => store.dispatch(setModal("About"))}>{names.about}</span>
            <span className={classes.link} onClick={() => store.dispatch(setModal("AddService"))}>{names.addService}</span>
            <span className={classes.link} onClick={() => store.dispatch(setModal("Partners"))}>{names.partners}</span>
            <span className={classes.link} onClick={() => store.dispatch(setModal("Contact"))}>{names.contact}</span>
        </div>}
    </div>
}

export default Header;
