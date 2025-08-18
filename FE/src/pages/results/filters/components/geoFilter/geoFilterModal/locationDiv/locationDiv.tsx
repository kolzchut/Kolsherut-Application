import ILocation from "../../../../../../../types/locationType";
import {createKeyboardHandler} from "../../../../../../../services/keyboardHandler";

interface LocationDivProps {
    location: ILocation;
    icon: string;
    iconAlt: string;
    onClick: (location: ILocation, zoom?: number) => void;
    zoom?: number;
    className: string;
}

const LocationDiv = ({location, icon, iconAlt, onClick, zoom, className}: LocationDivProps) => {
    const handleClick = () => onClick(location, zoom);
    const handleKeyDown = createKeyboardHandler(handleClick);

    return (
        <div
            className={className}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Select ${location.key} location`}
        >
            <img src={icon} alt={iconAlt}/>
            <span>{location.key}</span>
        </div>
    );
};

export default LocationDiv;
