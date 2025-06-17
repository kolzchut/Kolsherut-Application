import useStyle from './search.css';
import lightIconSearch from '../../../assets/icon-search-blue-1.svg'
import IconArrowTopRight from '../../../assets/icon-arrow-top-right-gray-4.svg';
import {ChangeEvent, useState} from "react";
import {filterOptions} from "./searchLogic";

const Search = () => {
    const classes = useStyle();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [optionalSearchValues, setOptionalSearchValues] = useState<string[]>([]);
    const MockOptions = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'zzza'];

    const inputChangeEvent = (v: ChangeEvent<HTMLInputElement>,) => {
        const value: string = v.target.value;
        setSearchTerm(value)
        filterOptions({searchTerm: value, Options: MockOptions, setOptionalSearchValues})
    }
    return (
        <section className={classes.root}>
            <h2>{searchTerm}</h2>
            <div className={classes.searchContainer}>
                <img className={classes.searchButton} alt={"חיפוש"} src={lightIconSearch}/>
                <input
                    value={searchTerm}
                    onChange={inputChangeEvent}
                    className={classes.searchInput}
                    placeholder={window.strings.search.label}
                />

            </div>
            <div className={classes.optionalSearchValuesWrapper}>
                {optionalSearchValues.map((value, index) => (
                    <div className={classes.optionalSearchValue}>
                        <span className={classes.iconAndText}>
                            <img className={classes.searchIcon} alt={"חיפוש"} src={lightIconSearch}/>
                            <span key={index} onClick={() => setSearchTerm(value)}>{value}</span>
                        </span>
                        <img className={classes.searchIcon} alt={"חיפוש"} src={IconArrowTopRight}/>

                    </div>
                ))}
            </div>
        </section>
    );
};

export default Search;