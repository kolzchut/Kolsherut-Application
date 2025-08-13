const EVENTS_TO_BLOCK = ['pointermove','mousemove','mouseover','wheel','touchstart','touchmove'] as const;

type GuardedElement = HTMLElement & { dataset: { guardsApplied?: string } };

export const addPopupInteractionGuards = (el: GuardedElement) => {
    if (!el || el.dataset.guardsApplied === '1') return;
    const stop = (e: Event) => e.stopPropagation();
    EVENTS_TO_BLOCK.forEach(evt => el.addEventListener(evt, stop));
    el.dataset.guardsApplied = '1';
};

export default addPopupInteractionGuards;
