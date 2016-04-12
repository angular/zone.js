import {zoneSymbol} from "../common/utils";
/*
 * This is necessary for Chrome and Chrome mobile, to enable
 * things like redefining `createdCallback` on an element.
 */

const _defineProperty = Object.defineProperty;
const _getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const _create = Object.create;
const unconfigurablesKey = zoneSymbol('unconfigurables');

export function propertyPatch() {
  Object.defineProperty = function (obj, prop, desc) {
    if (isUnconfigurable(obj, prop)) {
      throw new TypeError('Cannot assign to read only property \'' + prop + '\' of ' + obj);
    }
    if (prop !== 'prototype') {
      desc = rewriteDescriptor(obj, prop, desc);
    }
    return _defineProperty(obj, prop, desc);
  };

  Object.defineProperties = function (obj, props) {
    Object.keys(props).forEach(function (prop) {
      Object.defineProperty(obj, prop, props[prop]);
    });
    return obj;
  };

  Object.create = function (obj, proto) {
    if (typeof proto === 'object') {
      Object.keys(proto).forEach(function (prop) {
        proto[prop] = rewriteDescriptor(obj, prop, proto[prop]);
      });
    }
    return _create(obj, proto);
  };

  Object.getOwnPropertyDescriptor = function (obj, prop) {
    const desc = _getOwnPropertyDescriptor(obj, prop);
    if (isUnconfigurable(obj, prop)) {
      desc.configurable = false;
    }
    return desc;
  };
};

export function _redefineProperty(obj, prop, desc) {
  desc = rewriteDescriptor(obj, prop, desc);
  return _defineProperty(obj, prop, desc);
};

function isUnconfigurable (obj, prop) {
  return obj && obj[unconfigurablesKey] && obj[unconfigurablesKey][prop];
}

function rewriteDescriptor (obj, prop, desc) {
  desc.configurable = true;
  if (!desc.configurable) {
    if (!obj[unconfigurablesKey]) {
      _defineProperty(obj, unconfigurablesKey, { writable: true, value: {} });
    }
    obj[unconfigurablesKey][prop] = true;
  }
  return desc;
}


