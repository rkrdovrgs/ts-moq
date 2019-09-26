export interface IMockQueueWaitConfig {
    ms?: number;
    jasmineClockEnabled?: boolean;
}

/**
 * Defines a class to create promise queue
 */
export class PromiseMockQueue {
    asyncQueue: Promise<any>[];

    /**
     * Creates an instance of a promise queue
     */
    constructor() {
        this.asyncQueue = [];
    }

    /**
     * Creates a promise that resolves itself
     * @param {T} value - value to be returned once the promise has completed
     * @returns a promise mock
     */
    resolve<T>(value: T): Promise<T> {
        let promise = Promise.resolve(value);
        this.asyncQueue.push(promise);
        return promise;
    }

    /**
     * Creates a promise that rejects itself
     * @param {T} value - value error to be returned once the promise has erroed
     * @returns a promise mock
     */
    reject<T>(value: T): Promise<void> {
        let promise = Promise.reject(value);
        this.asyncQueue.push(promise);
        return promise;
    }

    /**
     * Processes all pending promises in queue and empties the queue
     * @returns a promise to be resolved once all pending promises have been executed
     */
    flush(): Promise<any> {
        let promise = Promise.all(this.asyncQueue);
        this.reset();
        return promise;
    }

    /**
     * Processes all pending promises in queue, empties the queue, and waits
     * @returns a promise to be resolved once all pending promises have been executed
     */
    flushAndWait(jasmineClockEnabled?: boolean, ms?: number);
    flushAndWait(config: IMockQueueWaitConfig);
    flushAndWait(): Promise<any> {
        const args = arguments;
        return this.flush().then(() => this.wait.apply(this, args));
    }

    /**
     * Resets the promise queue
     */
    reset() {
        this.asyncQueue = [];
    }

    /**
     * Adds a delay to process exceptions and/or inner promises inside promises
     * @param {boolean = false} jasmineClockEnabled
     * @param {number = 0} ms
     * @returns
     */
    wait(jasmineClockEnabled?: boolean, ms?: number);
    wait(config: IMockQueueWaitConfig);
    wait() {
        let config: IMockQueueWaitConfig = arguments[0],
            jasmineClockEnabled = arguments[0],
            ms = arguments[1];

        if (!!config && config instanceof Object && config.constructor === Object) {
            jasmineClockEnabled = config.jasmineClockEnabled;
            ms = config.ms;
        }

        jasmineClockEnabled = jasmineClockEnabled || false;
        ms = ms || 0;

        if (jasmineClockEnabled) {
            jasmine.clock().uninstall();
        }
        return new Promise(res => {
            setTimeout(() => {
                if (jasmineClockEnabled) {
                    jasmine.clock().install();
                }
                res();
            }, ms);
        });
    }
}