import { PromiseMockQueue } from "./promise-mock-queue";

/**
 * Defines a class to create mock objects
 */
export class Mock<T> {
    object: T;

    static promiseQueue: PromiseMockQueue = new PromiseMockQueue();

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
            pattern = new RegExp("(=>|return)\\s([a-zA-Z_$][a-zA-Z0-9_$]*\\.?)+"),
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