interface ISpec {
    describe(await?): void;
}

interface ISpy extends jasmine.Spy {
    and: ISpyAnd;
}

interface ISpyAnd extends jasmine.SpyAnd {
    callFake: {
        (fn: Function): any;
        promise: ISpyPromise;
    };
}

interface ISpyPromise {
    /**
     * Creates a promise that resolves itself
     * @param {T} value - value to be returned once the promise has completed
     * @returns a promise mock
     */
    resolve: (value: any) => ISpy;

    /**
     * Creates a promise that rejects itself
     * @param {T} value - value error to be returned once the promise has erroed
     * @returns a promise mock
     */
    reject: (value: any) => ISpy;
}