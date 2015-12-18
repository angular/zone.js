declare module NodeJS {
  interface Global {
    zone: any;
    Zone: any;
    WebKitBlobBuilder: any;
    WebKitMutationObserver: any;
    fetch: any;
    navigator: any;
  }
}

declare module jasmine {
  interface Matchers {
    toBeChildOf(obj: any): void;
    toBeDirectChildOf(obj: any): void;
  }
}

