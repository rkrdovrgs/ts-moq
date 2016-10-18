/**
 * Enumeration of Promise Status
 */
export enum SyncPromiseStatus {
    Resolve,
    Reject
}

/**
 * Defines a class to create promises that execute asynchronously
 */
export class SyncPromise<T> implements Promise<T> {
    constructor(
        private status: SyncPromiseStatus,
        private value: T
    ) { }

    then(callback: (value) => any): SyncPromise<T> {
        let next;
        if (this.status === SyncPromiseStatus.Resolve) {
            next = callback(this.value);
        }
        return new SyncPromise<T>(this.status, next);
    }

    catch(callback: (value) => any): SyncPromise<T> {
        let next;
        if (this.status === SyncPromiseStatus.Reject) {
            next = callback(this.value);
        }
        return new SyncPromise<T>(this.status, next);
    }
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
        if (!Mock.asyncDecorator) {
            let promise = Promise.resolve(value);
            this.asyncQueue.push(promise);
            return promise;
        } else {
            return new SyncPromise(SyncPromiseStatus.Resolve, value);
        }
    }

    /**
     * Creates a promise that rejects itself
     * @param {T} value - value error to be returned once the promise has erroed
     * @returns a promise mock
     */
    reject<T>(value: T): Promise<void> {
        if (!Mock.asyncDecorator) {
            let promise = Promise.reject(value);
            this.asyncQueue.push(promise);
            return promise;
        } else {
            return new SyncPromise(SyncPromiseStatus.Reject, value);
        }
    }

    /**
     * Processes all pending promises in queue and empties the queue
     * @returns a promise to be resolved once all pending promises have been executed
     */
    all(): Promise<any> {
        let promise = Promise.all(this.asyncQueue);
        this.reset();
        return promise;
    }

    /**
     * Resets the promise queue
     */
    reset() {
        this.asyncQueue = [];
    }
}

/**
 * Defines a class to create mock objects
 */
export class Mock<T> {
    object: T;

    static promiseQueue: PromiseMockQueue = new PromiseMockQueue();
    static asyncDecorator: boolean = false;

    /**
     * Used to create an instance of a mock of T
     * @param {T} Constructor?
     */
    constructor(Constructor?: T) {
        this.object = !!Constructor ? new (<any>Constructor)() : <T>{};
    }

    /**
     * Gets the name of the property based on a selector
     * @param {Expression<Func<T>>} propSelector - property selector to get the property name
     * @returns the property name
     */
    private getPropertyName(propSelector: (obj: T) => any): string {
        let propName: string,
            pattern = new RegExp("return\\s([a-zA-Z_$][a-zA-Z0-9_$]*\\.?)+"),
            matches = pattern.exec(propSelector.toString());

        if (!matches || !matches[0]) { throw "propSelector regex exception"; }

        propName = matches[0].replace("return ", "").trim();
        if (propName.indexOf(".") !== -1) {
            propName = propName.substring(propName.indexOf(".") + 1);
        }

        return propName;
    }

    /**
     * Sets the value of a property by name
     * @param {string} propName - name of the property
     * @param {C} value - value to be assigned to the property
     * @returns the value that was assigned
     */
    private defineDeepProperty<C>(propName: string, value: C): C {
        let segments = propName.split("."),
            segmentLen = segments.length,
            nextObj = this.object,
            prevObj;

        for (let i = 0; i < segmentLen; i++) {
            let propNameSegment = segments[i];
            prevObj = nextObj;
            nextObj = nextObj[propNameSegment];
            if (nextObj === undefined || nextObj === null) {
                // not the last property segment
                // means complex object should be created
                // else it means it is the actual fuction to mock
                if (segmentLen - i > 1) {
                    prevObj[propNameSegment] = {};
                } else {
                    prevObj[propNameSegment] = value;
                }
            }
        }

        return value;
    }

    /**
     * Creates a spy on a function (e.g.: to be used to mock service calls)
     * @param {string} propName - name of the function to be mocked
     * @returns a spy on the given function
     */
    private spyOnDeepProperty(propName: string): ISpy {
        let segments = propName.split("."),
            segmentLen = segments.length,
            nextObj = this.object,
            prevObj,
            spy: ISpy = this.createSpy(propName);

        for (let i = 0; i < segmentLen; i++) {
            let propNameSegment = segments[i];
            prevObj = nextObj;
            nextObj = nextObj[propNameSegment];
            if (nextObj === undefined || nextObj === null) {
                // not the last property segment
                // means complex object should be created
                // else it means it is the actual fuction to mock
                if (segmentLen - i > 1) {
                    prevObj[propNameSegment] = {};
                } else {
                    prevObj[propNameSegment] = spy;
                }
            }
        }

        return spy;
    }

    /**
     * Creates the custom spy structure
     * @param {string} name - name of the spy
     * @returns a custom spy with promise functionality
     */
    private createSpy(name: string): ISpy {
        let spy: ISpy = <ISpy>jasmine.createSpy(name);

        spy.and.callFake.promise = {
            resolve: (fn: Function): ISpy => {
                return <ISpy>spy.and.callFake(function () {
                    let value = fn.apply(fn, arguments);
                    return Mock.promiseQueue.resolve(value);
                });
            },
            reject: (fn: Function): ISpy => {
                return <ISpy>spy.and.callFake(function () {
                    let value = fn.apply(fn, arguments);
                    return Mock.promiseQueue.reject(value);
                });
            }
        };

        return spy;
    }

    /**
     * Creates a spy on a given property
     * @param {Expression<Func<T>>} propSelector - property selector to get the property name
     * @returns a custom spy with promise capabilities
     */
    spyOn(propSelector: (obj: T) => any): ISpy {
        let propName = this.getPropertyName(propSelector),
            spy: ISpy = this.createSpy(propName);


        return this.defineDeepProperty(propName, spy);
    }

    /**
     * Sets a property value on a given property
     * @param {Expression<Func<T>>} propSelector - property selector to get the property name
     * @param {C} value - value to be assigned to the property
     */
    define<C>(propSelector: (obj: T) => C, value: C) {
        let propName = this.getPropertyName(propSelector);
        this.defineDeepProperty(propName, value);
    }
}


/**
 * Defines a class as a spec to be recognized by the Jasmine framework
 * @param {string} description the description of the spec to be tested
 * @returns
 */
export function spec(description: string) {
    return Spec => describe(description, () => new Spec().describe());
}

/**
 * Defines a class as the only spec to be recognized by the Jasmine framework
 * @param {string} description the description of the spec to be tested
 * @returns
 */
export function fspec(description: string) {
    return Spec => fdescribe(description, () => new Spec().describe());
}

/**
 * Defines a class as a pending spec to be recognized by the Jasmine framework
 * @param {string} description the description of the spec to be tested
 * @returns
 */
export function xspec(description: string) {
    return Spec => xdescribe(description, () => new Spec().describe());
}

/**
 * Specify that the current spec has asynchronous calls
 * Uses the Jasmine clock to execute setTimeouts
 * Executes asynchronous promises
 * Once resolved, executes expectations
 */
export function async(target: any, key: string, descriptor: any) {
    let origMethod = descriptor.value,
        await = (onfulfilled) => {
            jasmine.clock().tick(jasmine.DEFAULT_TIMEOUT_INTERVAL);
            if (onfulfilled) onfulfilled();
        };

    descriptor.value = function (...args) {
        beforeEach(() => {
            Mock.asyncDecorator = true;
            jasmine.clock().install();
        });

        afterEach(() => {
            Mock.asyncDecorator = false;
            jasmine.clock().uninstall();
        });

        origMethod.apply(this, [await]);
    };

    return descriptor;
}
