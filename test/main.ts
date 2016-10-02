declare var __karma__ : {
  loaded: Function,
  start: Function
  error: Function
};

__karma__.loaded = function() {};
(window as any).global = window;

System.config({
  defaultJSExtensions: true
});
System.import('/base/build/test/browser_entry_point').then(
    () => {
      __karma__.start();
    },
    (error) => {
      console.error(error.stack || error);
    });