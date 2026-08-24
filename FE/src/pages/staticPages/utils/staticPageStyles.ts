import {secondaryTextColorTwo} from "../../../services/theme";

// Typography copied from controlledModal/utils/commonModalStyles so the content pages read
// exactly like the modals they replaced. commonModalStyles itself stays untouched because
// the site map modal still depends on it.
export const pageTitleStyle = ({accessibilityActive}: { accessibilityActive: boolean }) => ({
    fontSize: accessibilityActive ? '32px' : '28px',
    fontWeight: 600,
    color: secondaryTextColorTwo
});

export const pageSubtitleStyle = ({accessibilityActive}: { accessibilityActive: boolean }) => ({
    fontSize: accessibilityActive ? '26px' : '22px',
    fontWeight: 400,
    margin: '10px 0',
    color: secondaryTextColorTwo
});

// A page fills the content column: no card shadow, no radius, no internal scroll container.
export const pageRootStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    direction: 'rtl' as const,
    width: '100%',
};
