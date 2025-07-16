import useStyle from "./header.css";
import logo from "../../assets/logo.svg";
import inactiveSearchIcon from "../../assets/icon-search-blue-1.svg";
import activeSearchIcon from "../../assets/icon-search-blue-0.svg";
import { useRef, useState} from "react";
import {setModal, setPage, setShowSidebar} from "../../store/general/generalSlice";
import {store} from "../../store/store";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../constants/mediaQueryProps";
import hamburger from "../../assets/icon-hamburger.svg";

const Header = ({showLogo=true,showSearchbar=true}:{showLogo?:boolean, showSearchbar?:boolean}) => {
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
    const inputDescription = "Search for services, organizations, branches, and more"

    return <div className={classes.root}>
        {showLogo && <img onClick={handleIconClick} className={classes.logo} src={isMobile ? hamburger : logo}
              alt={"kolsherut logo"}/>}
        {showSearchbar && <div className={classes.inputDiv}>
            <img className={classes.searchIcon} alt={"search icon"} onClick={onSearch}
                 src={isInputFocused ? activeSearchIcon : inactiveSearchIcon}/>
            <label htmlFor="search-input" className={classes.visuallyHidden}>
                {inputDescription}
            </label>
            <input
                id="search-input"
                ref={inputRef}
                className={classes.input}
                type={"text"}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(e) => {if (e.key === "Enter") onSearch();}}
                aria-label={inputDescription}
            />
        </div>}
        {!isMobile && <div className={classes.linksDiv}>
            <span className={classes.link} onClick={() => store.dispatch(setModal("About"))}>{names.about}</span>
            <span className={classes.link} onClick={() => store.dispatch(setModal("AddService"))}>{names.addService}</span>
            <span className={classes.link} onClick={() => store.dispatch(setModal("Partners"))}>{names.partners}</span>
            <span className={classes.link} onClick={() => store.dispatch(setModal("Contact"))}>{names.contact}</span>
        </div>}
    </div>
}

export default Header;
