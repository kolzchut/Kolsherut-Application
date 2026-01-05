import {useEffect, useRef} from 'react';
import {createModalGlobalKeyHandler} from './globalKeyHandler';
import {focusFirstElement} from './focusUtils';

export const useModalAccessibility = (
    isOpen: boolean,
    onClose: () => void
): {
    modalRef: React.RefObject<HTMLDivElement | null>;
} => {
    const modalRef = useRef<HTMLDivElement>(null);
    const lastActiveElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            lastActiveElementRef.current = document.activeElement as HTMLElement;
            document.body.style.overflow = 'hidden';

            setTimeout(() => {
                if (modalRef.current) focusFirstElement(modalRef.current);
            }, 0);

            const handleGlobalKeyDown = createModalGlobalKeyHandler(modalRef, onClose);
            document.addEventListener('keydown', handleGlobalKeyDown);
            return () => {
                document.removeEventListener('keydown', handleGlobalKeyDown);
                document.body.style.overflow = 'unset';
                if (lastActiveElementRef.current) lastActiveElementRef.current.focus();
            };
        }
    }, [isOpen, onClose]);

    return {
        modalRef
    };
};
