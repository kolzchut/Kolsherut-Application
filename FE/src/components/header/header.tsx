import useStyle from "./header.css";
import logo from "../../assets/logo.svg";
import inactiveSearchIcon from "../../assets/icon-search-blue-1.svg";
import activeSearchIcon from "../../assets/icon-search-blue-0.svg";
import { useRef, useState} from "react";
import {setModal} from "../../store/general/generalSlice";
import {store} from "../../store/store";


const Header = () => {
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
    return <div className={classes.root}>
        <img className={classes.logo} src={logo} alt={"kolsherut logo"}/>
        <div className={classes.inputDiv}>
            <img className={classes.searchIcon} alt={"search icon"} onClick={onSearch}
                 src={isInputFocused ? activeSearchIcon : inactiveSearchIcon}/>
            <input ref={inputRef} className={classes.input} type={"text"} onFocus={() => setIsInputFocused(true)}
                   onBlur={() => setIsInputFocused(false)} onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();}}/>
        </div>
        <div className={classes.linksDiv}>
            <a className={classes.link} onClick={() => store.dispatch(setModal("About"))}>אודות</a>
            <a className={classes.link} onClick={() => store.dispatch(setModal("AddService"))}>הוספת שירות חסר</a>
            <a className={classes.link} onClick={() => store.dispatch(setModal("Partners"))}>שותפים</a>
            <a className={classes.link} onClick={() => store.dispatch(setModal("Contact"))}>צרו קשר</a>
        </div>
    </div>
}

export default Header;
