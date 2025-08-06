import React from "react";
import Label from "../../../components/label/label";
import {getHrefForCard} from "../../../services/href";
import mapAnalytics from "../../../services/gtag/mapEvents";
import {reRouteToCard} from "../../../services/routes/reRoute";
import useStyles from "./branchServicesForMobile.css.ts";
import {Situation, Response} from "../../../types/cardType.ts";
import {useDispatch, useSelector} from "react-redux";
import {isAccessibilityActive} from "../../../store/general/general.selector.ts";
import {setSelectedFeatureId} from "../../../store/general/generalSlice.ts";

export interface FeatureItemProps {
    responses: Response[];
    situations: Situation[];
    organization_name: string;
    service_name: string;
    branch_name: string;
    cardId: string;
    lengthOfFeatures: number;
}

const FeatureItem = ({service_name, organization_name, branch_name, cardId, responses = [], situations = [], lengthOfFeatures}: FeatureItemProps) => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({accessibilityActive});
    const href = getHrefForCard(cardId);
    const dispatch = useDispatch();
    const handleFeatureClick = (event: React.MouseEvent, cardId: string) => {
        event.preventDefault();
        if (lengthOfFeatures === 1) {
            mapAnalytics.enterServiceFromMapPopupSingleBranchEvent(cardId);
        } else {
            mapAnalytics.enterServiceFromMapPopupMultiBranchEvent(cardId);
        }
        dispatch(setSelectedFeatureId(null))
        reRouteToCard({cardId: cardId});
    };

    return (
        <a
            className={classes.featureSection}
            href={href}
            onClick={(e) => handleFeatureClick(e, cardId)}
        >
            <strong className={classes.branchTitle}>
                {branch_name || organization_name || service_name}
            </strong>
            <div className={classes.featureLabels}>
                {responses.length > 0 && (
                    <Label
                        response={responses[0]}
                        extra={responses.length > 1 ? responses.length - 1 : 0}
                    />
                )}
                {situations.length > 0 && (
                    <Label
                        situation={situations[0]}
                        extra={situations.length > 1 ? situations.length - 1 : 0}
                    />
                )}
            </div>
        </a>
    );
};

export default FeatureItem;
