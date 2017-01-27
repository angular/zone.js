# Zone.js's support for non standard apis

Zone.js patched most standard APIs so they can be in zone. such as DOM events listener, XMLHttpRequest in Browser
 and EventEmitter, fs API in nodejs. 
  
But there are still a lot of non standard APIs are not patched by default, such as MediaQuery, Notification, 
 WebAudio and so on. We are adding the support to those APIs, and the progress will be updated here.
 
## Currently supported non standard Web APIs 

* MediaQuery
* Notification 

## Currently supported non standard node APIs

## Usage

By default, those APIs' support will not be loaded in zone.js or zone-node.js,
so if you want to load those API's support, you should load those files by yourself

for example, if you want to add MediaQuery patch, you should do like this. 

```
  <script src="path/zone.js"></script> 
  <script src="path/webapis-media-query.js"></script> 
```  
