import useStyles from "./organization.css";
import {IOrganization} from "../../../../types/serviceType";
import openBranches from '../../../../assets/icon-chevron-left-gray-4.svg';
import {store} from "../../../../store/store";
import {setSelectedOrganization} from "../../../../store/data/dataSlice";
import {getSelectedOrganizationIdAndServiceId} from "../../../../store/data/data.selector";
import {useSelector} from "react-redux";
import {useSetDistanceFromTop} from "../../context/contextFunctions";
import React from "react";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp.ts";
import {useTheme} from "react-jss";
import {createKeyboardHandlerWithEvent} from "../../../../services/keyboardHandler";

const Organization = ({organization, serviceId}: { organization: IOrganization, serviceId: string }) => {
    const numOfBranchesText = organization.branches.length + " " + window.strings.results.numOfBranches;
    const selectedOrgIdAndServiceId = useSelector(getSelectedOrganizationIdAndServiceId)
    const isSelected = selectedOrgIdAndServiceId.orgId === organization.id && selectedOrgIdAndServiceId.serviceId === serviceId;
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({isSelected, accessibilityActive: theme.accessibilityActive});
    const setDistanceFromTop = useSetDistanceFromTop();
    const onSelectOrganization = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isSelected) return store.dispatch(setSelectedOrganization(null));
        store.dispatch(setSelectedOrganization({organization, serviceId}));
        const containerTop = (event.currentTarget.parentElement?.parentElement?.parentElement as HTMLElement).offsetTop;
        const currentTargetTop = (event.currentTarget.parentElement?.parentElement as HTMLElement).offsetTop;
        const margin = currentTargetTop - containerTop;
        const mainDiv = (event.currentTarget.parentElement?.parentElement?.parentElement?.parentElement as HTMLElement);
        mainDiv.scrollTo({top: margin, behavior: 'smooth'});
        setDistanceFromTop(margin);
    }

    const handleKeyDown = createKeyboardHandlerWithEvent((event) => {
        const mouseEvent = {
            currentTarget: event.currentTarget
        } as React.MouseEvent<HTMLDivElement>;
        onSelectOrganization(mouseEvent);
    });

    return <div
        onClick={onSelectOrganization}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${isSelected ? 'Collapse' : 'Expand'} ${organization.name} organization with ${organization.branches.length} branches`}
        className={classes.organization}>
        <span className={classes.organizationName}>{organization.name}</span>
        <span className={classes.numOfBranches}> {numOfBranchesText}</span>
        <img src={openBranches} alt={"Open Branches"}/>
    </div>
}

export default Organization;
