# Typescript Moq

## Usage

- Import the the `Mock` class

`import { Mock } from "ts-moq/moq";`;

- Declare a variable to hold the instance of the mock

`let dummyServiceMock: Mock<DummyService>;`

- Initialize the mock before each unit test

`dummyServiceMock = new Mock<DummyService>();`

- Setup your mock
```
dummyServiceMock.spyOn(x => x.getDummyData)
  .and.callFake.promise.resolve(() => 
    [
      {name: "John Dae"}, 
      {name: "Nanni Sacase"}, 
      {name: "Terrye Riccetti"}
    ]);
```

- If you are using a dependency injection container, register the mock on your container

`container.registerInstance(DummyService, dummyServiceMock.object);`

- If you are using a dependency injection container, get the instance of your subject under test through your container so that the registration of your mock is injected

`sut = container.get(HomeComponent);`

- Use and flush the mock promise queue on your unit tests as needed. e.g.:

```
it("should disable the edit option until the has loaded", async (done) => {
    // call the function that calls the dataservice
    sut.loadData();
    
    // assert on values that should not change until the promise is resolved (data is back from the server)
    expect(sut.disableEdit).toBe(true);
    
    // control when a promise should be resolved during the unit test
    await Mock.promiseQueue.flushAndWait();
    
     // assert on what should happen when the promise is resolved (data is back from the server)
    expect(sut.disableEdit).toBe(true);

    done();
});
```
