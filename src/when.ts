import type { Observable } from './observableInterfaces';
import { isObservable } from './helpers';
import { isFunction } from './is';
import { observe } from './observe';

export function when<T>(predicate: Observable<T> | (() => T)): Promise<T>;
export function when<T>(predicate: Observable<T> | (() => T), effect: (T) => any | (() => any)): () => void;
export function when<T>(predicate: Observable<T> | (() => T), effect?: (T) => any | (() => any)) {
    // Create a wrapping fn that calls the effect if predicate returns true
    function run() {
        let ret = predicate as any;
        if (isFunction(ret)) {
            ret = ret();
        }

        if (isObservable(ret)) {
            ret = ret.get();
        }
        if (ret) {
            // If value is truthy then run the effect
            effect(ret);

            // Return false so that observe does not track
            return false;
        }
    }

    // If no effect parameter return a promise
    const promise =
        !effect &&
        new Promise<void>((resolve) => {
            effect = resolve;
        });

    // Create an effect for the fn
    const dispose = observe(run);

    return promise || dispose;
}
