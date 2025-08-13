import {FOCUSABLE_ELEMENTS_SELECTOR} from "./focusUtils.ts";

export const createModalGlobalKeyHandler = (
    modalRef: React.RefObject<HTMLDivElement | null>,
    onClose: () => void
) => {
    return (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
        }

        if (event.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR);

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
            const activeElement = document.activeElement;
            const needToBackToStart = event.shiftKey && activeElement === firstElement;
            const needToGoToEnd = !event.shiftKey && activeElement === lastElement;

            if (needToBackToStart || needToGoToEnd) {
                event.preventDefault();
                (needToBackToStart ? lastElement : firstElement).focus();
            }
        }
    };
};
