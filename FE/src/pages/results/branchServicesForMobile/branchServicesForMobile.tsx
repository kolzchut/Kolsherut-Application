import {useEffect} from "react";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import PoiData from "../../../types/poiData";
import useStyles from "./branchServicesForMobile.css.ts";
import findFeatureByIdentifier from "./findFeatureByIdentifier.ts";
import {useSetDisplayResultsMap} from "../context/contextFunctions.ts";
import FeatureItem, {FeatureItemProps} from "./FeatureItem";
import closeIcon from "../../../assets/icon-close-black.svg";
import {useDispatch, useSelector} from "react-redux";
import {setSelectedFeatureId} from "../../../store/general/generalSlice.ts";
import {isAccessibilityActive} from "../../../store/general/general.selector.ts";

interface BranchServicesPopupProps {
    featureId: string;
}


const BranchServicesForMobile = ({featureId}: BranchServicesPopupProps) => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({accessibilityActive});
    const setDisplayResultsMap = useSetDisplayResultsMap()
    const feature = findFeatureByIdentifier(featureId);
    const dispatch = useDispatch();
    useEffect(() => {
        if (!feature) return;
        setDisplayResultsMap(false);
    }, [feature]);
    if (!feature) return null;

    const featuresProperties = feature.getProperties().features?.map((f: Feature<Geometry>) => f.getProperties() as PoiData) || [];
    const lengthOfFeatures = featuresProperties.length;
    const serviceName = featuresProperties[0]?.organization_name || '';
    const onClose = () => dispatch(setSelectedFeatureId(null));
    return (
        <div className={classes.branchServicesPopupDiv}>
            <div className={classes.branchServiceTopDiv}>
                <strong className={classes.strongText}>{serviceName}</strong>
                <img className={classes.closeIcon} src={closeIcon} onClick={onClose} alt={"Close branch list"}/>
            </div>
            <div className={classes.branchServicesContent}>
                {featuresProperties.map((props: FeatureItemProps) => (
                    <FeatureItem
                        key={props.cardId}
                        {...props}
                        lengthOfFeatures={lengthOfFeatures}
                    />
                ))}
            </div>
        </div>
    );
};

export default BranchServicesForMobile;
