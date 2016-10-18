import {Mock} from "./moq";

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