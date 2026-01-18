import { Signal, computed, signal } from '@angular/core';

const deepEqual = (left: unknown, right: unknown): boolean => {
    return JSON.stringify(left) === JSON.stringify(right);
};

export const createDirtyTracker = <T>(formSignal: Signal<T>) => {
    const snapshot = signal(formSignal());
    const isDirty = computed(() => !deepEqual(snapshot(), formSignal()));
    const resetSnapshot = (value?: T) => {
        snapshot.set(value ?? formSignal());
    };

    return {
        snapshot,
        isDirty,
        resetSnapshot,
    };
};
