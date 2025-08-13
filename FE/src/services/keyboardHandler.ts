import React from 'react';

export const createKeyboardHandler = (callback: () => void) => {
    return (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    };
};

export const createKeyboardHandlerWithEvent = (callback: (event: React.KeyboardEvent) => void) => {
    return (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback(event);
        }
    };
};
