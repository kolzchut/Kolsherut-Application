export const FOCUSABLE_ELEMENTS_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), img[tabindex="0"]';

export const focusFirstElement = (container: HTMLElement): HTMLElement | null => {
    const focusableElements = container.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR);
    if (focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        firstElement.focus();
        return firstElement;
    } else {
        container.focus();
        return container;
    }
};
