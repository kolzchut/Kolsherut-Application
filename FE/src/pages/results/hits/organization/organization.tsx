import useStyles from "./organization.css";
import {IOrganization} from "../../../../types/serviceType";
import openBranches from '../../../../assets/icon-chevron-left-gray-4.svg';
import {store} from "../../../../store/store";
import {setSelectedOrganization} from "../../../../store/data/dataSlice";
import {getSelectedOrganizationId} from "../../../../store/data/data.selector";
import {useSelector} from "react-redux";
import {useSetDistanceFromTop} from "../../context/contextFunctions";
import React from "react";

const Organization = ({organization}: { organization: IOrganization }) => {
    const numOfBranchesText = organization.branches.length + " " + window.strings.results.numOfBranches;
    const selectedOrganizationId = useSelector(getSelectedOrganizationId)
    const isSelected = selectedOrganizationId === organization.id;
    const classes = useStyles({isSelected});
    const setDistanceFromTop = useSetDistanceFromTop();
    const onSelectOrganization = (event: React.MouseEvent<HTMLDivElement>) => {
        if(isSelected) return store.dispatch(setSelectedOrganization(null));
        store.dispatch(setSelectedOrganization(organization));
        const containerTop = (event.currentTarget.parentElement?.parentElement?.parentElement as HTMLElement).offsetTop;
        const currentTargetTop = (event.currentTarget.parentElement?.parentElement as HTMLElement).offsetTop;
        const margin = currentTargetTop - containerTop;
        const mainDiv = (event.currentTarget.parentElement?.parentElement?.parentElement?.parentElement as HTMLElement);
        mainDiv.scrollTo({top:margin, behavior: 'smooth'});
        setDistanceFromTop(margin);
    }

    return  <div onClick={onSelectOrganization} className={classes.organization}>
                <span className={`${classes.text}`}>{organization.name}</span>
                <span className={`${classes.text} ${classes.numOfBranches}`}> {numOfBranchesText}</span>
                <img src={openBranches} alt={"Open Branches"}/>
            </div>
}

export default Organization;
