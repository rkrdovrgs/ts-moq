export interface ISpy extends jasmine.Spy {
    and: ISpyAnd;
}

export interface ISpyAnd extends jasmine.SpyAnd {
    callFake: {
        (fn: Function): any;
        promise: ISpyPromise; 
    };
}

export interface ISpyPromise {
    (fn: (resolve: (value: any) => Promise<any>, reject: (value: any) => Promise<any>) => Promise<any>): ISpy;
    resolve: (value: any) => ISpy;
    reject: (value: any) => ISpy;
}

export class PromiseMockQueue {
    queue: Promise<any>[];

    constructor() {
        this.queue = [];
    }

    resolve<T>(value: T): Promise<T> {
        let promise = Promise.resolve(value);
        this.queue.push(promise);
        return promise;
    }

    reject<T>(value: T): Promise<void> {
        let promise = Promise.reject(value);
        this.queue.push(promise);
        return promise;
    }

    all(): Promise<any> {
        let promise = Promise.all(this.queue);
        this.queue.splice(0, this.queue.length);
        return promise;
    }

    reset() {
        this.queue = [];
    }
}

export class Mock<T> {
    object: T;

    static promiseQueue: PromiseMockQueue = new PromiseMockQueue();

    constructor() {
        this.object = <T>{};
    }

    private spyOnDeepProperty(propName): ISpy {
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

    private createSpy(name: string): ISpy {
        let spy: ISpy = <ISpy>jasmine.createSpy(name);

        spy.and.callFake.promise = <ISpyPromise>((fn: (resolve: (value: any) => Promise<any>, reject: (value: any) => Promise<void>) => Promise<any>): ISpy => {
            return <ISpy>spy.and.callFake(() => fn(
                (value) => Mock.promiseQueue.resolve(value),
                (value) => Mock.promiseQueue.reject(value)
            ));
        });

        spy.and.callFake.promise.resolve = (fn: Function): ISpy => {
            return <ISpy>spy.and.callFake(function () {
                let value = fn.apply(fn, arguments);
                return Mock.promiseQueue.resolve(value);
            });
        }

        spy.and.callFake.promise.resolve = (fn: Function): ISpy => {
            return <ISpy>spy.and.callFake(function () {
                let value = fn.apply(fn, arguments);
                return Mock.promiseQueue.resolve(value);
            });
        }

        spy.and.callFake.promise.reject = (fn: Function): ISpy => {
            return <ISpy>spy.and.callFake(function () {
                let value = fn.apply(fn, arguments);
                return Mock.promiseQueue.reject(value);
            });
        }

        return spy;
    }

    spyOn(propSelector: (obj: T) => any): ISpy {
        let propName: string,
            pattern = new RegExp("return\\s([a-zA-Z_$][a-zA-Z0-9_$]*\\.?)+"),
            matches = pattern.exec(propSelector.toString());

        if (!matches || !matches[0]) { throw "propSelector regex exception"; }

        propName = matches[0].replace("return ", "").trim();
        if (propName.indexOf(".") !== -1) {
            propName = propName.substring(propName.indexOf(".") + 1);
        }

        return this.spyOnDeepProperty(propName);
    }
}

