import { getAgentDir, getMarkdownTheme, keyText } from '@earendil-works/pi-coding-agent';
import { Text, Container, Spacer, Markdown } from '@earendil-works/pi-tui';
import { Type } from '@sinclair/typebox';
import { randomUUID } from 'crypto';
import { once } from 'events';
import { createWriteStream } from 'fs';
import { readFile, mkdir, chmod, writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join, parse } from 'path';
import { pipeline } from 'stream/promises';
import { Defuddle } from 'defuddle/node';
import { getProfiles, fetch } from 'wreq-js';
import { parseHTML } from 'linkedom';
import { createRequire } from 'node:module';

// The upstream bundle embeds CommonJS dependencies (notably mime-types).
// tsup's generated __require helper needs a real require in Pi's ESM loader.
const require = createRequire(import.meta.url);

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (const key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  __defProp(target, "default", { value: mod, enumerable: true }) ,
  mod
));

// ../../node_modules/lodash/_basePropertyOf.js
var require_basePropertyOf = __commonJS({
  "../../node_modules/lodash/_basePropertyOf.js"(exports$1, module) {
    function basePropertyOf(object) {
      return (key) => object == null ? void 0 : object[key];
    }
    module.exports = basePropertyOf;
  }
});

// ../../node_modules/lodash/_deburrLetter.js
var require_deburrLetter = __commonJS({
  "../../node_modules/lodash/_deburrLetter.js"(exports$1, module) {
    var basePropertyOf = require_basePropertyOf();
    var deburredLetters = {
      // Latin-1 Supplement block.
      "\xC0": "A",
      "\xC1": "A",
      "\xC2": "A",
      "\xC3": "A",
      "\xC4": "A",
      "\xC5": "A",
      "\xE0": "a",
      "\xE1": "a",
      "\xE2": "a",
      "\xE3": "a",
      "\xE4": "a",
      "\xE5": "a",
      "\xC7": "C",
      "\xE7": "c",
      "\xD0": "D",
      "\xF0": "d",
      "\xC8": "E",
      "\xC9": "E",
      "\xCA": "E",
      "\xCB": "E",
      "\xE8": "e",
      "\xE9": "e",
      "\xEA": "e",
      "\xEB": "e",
      "\xCC": "I",
      "\xCD": "I",
      "\xCE": "I",
      "\xCF": "I",
      "\xEC": "i",
      "\xED": "i",
      "\xEE": "i",
      "\xEF": "i",
      "\xD1": "N",
      "\xF1": "n",
      "\xD2": "O",
      "\xD3": "O",
      "\xD4": "O",
      "\xD5": "O",
      "\xD6": "O",
      "\xD8": "O",
      "\xF2": "o",
      "\xF3": "o",
      "\xF4": "o",
      "\xF5": "o",
      "\xF6": "o",
      "\xF8": "o",
      "\xD9": "U",
      "\xDA": "U",
      "\xDB": "U",
      "\xDC": "U",
      "\xF9": "u",
      "\xFA": "u",
      "\xFB": "u",
      "\xFC": "u",
      "\xDD": "Y",
      "\xFD": "y",
      "\xFF": "y",
      "\xC6": "Ae",
      "\xE6": "ae",
      "\xDE": "Th",
      "\xFE": "th",
      "\xDF": "ss",
      // Latin Extended-A block.
      "\u0100": "A",
      "\u0102": "A",
      "\u0104": "A",
      "\u0101": "a",
      "\u0103": "a",
      "\u0105": "a",
      "\u0106": "C",
      "\u0108": "C",
      "\u010A": "C",
      "\u010C": "C",
      "\u0107": "c",
      "\u0109": "c",
      "\u010B": "c",
      "\u010D": "c",
      "\u010E": "D",
      "\u0110": "D",
      "\u010F": "d",
      "\u0111": "d",
      "\u0112": "E",
      "\u0114": "E",
      "\u0116": "E",
      "\u0118": "E",
      "\u011A": "E",
      "\u0113": "e",
      "\u0115": "e",
      "\u0117": "e",
      "\u0119": "e",
      "\u011B": "e",
      "\u011C": "G",
      "\u011E": "G",
      "\u0120": "G",
      "\u0122": "G",
      "\u011D": "g",
      "\u011F": "g",
      "\u0121": "g",
      "\u0123": "g",
      "\u0124": "H",
      "\u0126": "H",
      "\u0125": "h",
      "\u0127": "h",
      "\u0128": "I",
      "\u012A": "I",
      "\u012C": "I",
      "\u012E": "I",
      "\u0130": "I",
      "\u0129": "i",
      "\u012B": "i",
      "\u012D": "i",
      "\u012F": "i",
      "\u0131": "i",
      "\u0134": "J",
      "\u0135": "j",
      "\u0136": "K",
      "\u0137": "k",
      "\u0138": "k",
      "\u0139": "L",
      "\u013B": "L",
      "\u013D": "L",
      "\u013F": "L",
      "\u0141": "L",
      "\u013A": "l",
      "\u013C": "l",
      "\u013E": "l",
      "\u0140": "l",
      "\u0142": "l",
      "\u0143": "N",
      "\u0145": "N",
      "\u0147": "N",
      "\u014A": "N",
      "\u0144": "n",
      "\u0146": "n",
      "\u0148": "n",
      "\u014B": "n",
      "\u014C": "O",
      "\u014E": "O",
      "\u0150": "O",
      "\u014D": "o",
      "\u014F": "o",
      "\u0151": "o",
      "\u0154": "R",
      "\u0156": "R",
      "\u0158": "R",
      "\u0155": "r",
      "\u0157": "r",
      "\u0159": "r",
      "\u015A": "S",
      "\u015C": "S",
      "\u015E": "S",
      "\u0160": "S",
      "\u015B": "s",
      "\u015D": "s",
      "\u015F": "s",
      "\u0161": "s",
      "\u0162": "T",
      "\u0164": "T",
      "\u0166": "T",
      "\u0163": "t",
      "\u0165": "t",
      "\u0167": "t",
      "\u0168": "U",
      "\u016A": "U",
      "\u016C": "U",
      "\u016E": "U",
      "\u0170": "U",
      "\u0172": "U",
      "\u0169": "u",
      "\u016B": "u",
      "\u016D": "u",
      "\u016F": "u",
      "\u0171": "u",
      "\u0173": "u",
      "\u0174": "W",
      "\u0175": "w",
      "\u0176": "Y",
      "\u0177": "y",
      "\u0178": "Y",
      "\u0179": "Z",
      "\u017B": "Z",
      "\u017D": "Z",
      "\u017A": "z",
      "\u017C": "z",
      "\u017E": "z",
      "\u0132": "IJ",
      "\u0133": "ij",
      "\u0152": "Oe",
      "\u0153": "oe",
      "\u0149": "'n",
      "\u017F": "s"
    };
    var deburrLetter = basePropertyOf(deburredLetters);
    module.exports = deburrLetter;
  }
});

// ../../node_modules/lodash/_freeGlobal.js
var require_freeGlobal = __commonJS({
  "../../node_modules/lodash/_freeGlobal.js"(exports$1, module) {
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    module.exports = freeGlobal;
  }
});

// ../../node_modules/lodash/_root.js
var require_root = __commonJS({
  "../../node_modules/lodash/_root.js"(exports$1, module) {
    var freeGlobal = require_freeGlobal();
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    module.exports = root;
  }
});

// ../../node_modules/lodash/_Symbol.js
var require_Symbol = __commonJS({
  "../../node_modules/lodash/_Symbol.js"(exports$1, module) {
    var root = require_root();
    var Symbol2 = root.Symbol;
    module.exports = Symbol2;
  }
});

// ../../node_modules/lodash/_arrayMap.js
var require_arrayMap = __commonJS({
  "../../node_modules/lodash/_arrayMap.js"(exports$1, module) {
    function arrayMap(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    module.exports = arrayMap;
  }
});

// ../../node_modules/lodash/isArray.js
var require_isArray = __commonJS({
  "../../node_modules/lodash/isArray.js"(exports$1, module) {
    var isArray = Array.isArray;
    module.exports = isArray;
  }
});

// ../../node_modules/lodash/_getRawTag.js
var require_getRawTag = __commonJS({
  "../../node_modules/lodash/_getRawTag.js"(exports$1, module) {
    var Symbol2 = require_Symbol();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    module.exports = getRawTag;
  }
});

// ../../node_modules/lodash/_objectToString.js
var require_objectToString = __commonJS({
  "../../node_modules/lodash/_objectToString.js"(exports$1, module) {
    var objectProto = Object.prototype;
    var nativeObjectToString = objectProto.toString;
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    module.exports = objectToString;
  }
});

// ../../node_modules/lodash/_baseGetTag.js
var require_baseGetTag = __commonJS({
  "../../node_modules/lodash/_baseGetTag.js"(exports$1, module) {
    var Symbol2 = require_Symbol();
    var getRawTag = require_getRawTag();
    var objectToString = require_objectToString();
    var nullTag = "[object Null]";
    var undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    module.exports = baseGetTag;
  }
});

// ../../node_modules/lodash/isObjectLike.js
var require_isObjectLike = __commonJS({
  "../../node_modules/lodash/isObjectLike.js"(exports$1, module) {
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    module.exports = isObjectLike;
  }
});

// ../../node_modules/lodash/isSymbol.js
var require_isSymbol = __commonJS({
  "../../node_modules/lodash/isSymbol.js"(exports$1, module) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var symbolTag = "[object Symbol]";
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
    }
    module.exports = isSymbol;
  }
});

// ../../node_modules/lodash/_baseToString.js
var require_baseToString = __commonJS({
  "../../node_modules/lodash/_baseToString.js"(exports$1, module) {
    var Symbol2 = require_Symbol();
    var arrayMap = require_arrayMap();
    var isArray = require_isArray();
    var isSymbol = require_isSymbol();
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseToString(value) {
      if (typeof value == "string") {
        return value;
      }
      if (isArray(value)) {
        return arrayMap(value, baseToString) + "";
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : "";
      }
      var result = value + "";
      return result == "0" && 1 / value == -Infinity ? "-0" : result;
    }
    module.exports = baseToString;
  }
});

// ../../node_modules/lodash/toString.js
var require_toString = __commonJS({
  "../../node_modules/lodash/toString.js"(exports$1, module) {
    var baseToString = require_baseToString();
    function toString(value) {
      return value == null ? "" : baseToString(value);
    }
    module.exports = toString;
  }
});

// ../../node_modules/lodash/deburr.js
var require_deburr = __commonJS({
  "../../node_modules/lodash/deburr.js"(exports$1, module) {
    var deburrLetter = require_deburrLetter();
    var toString = require_toString();
    var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
    var rsComboMarksRange = "\\u0300-\\u036f";
    var reComboHalfMarksRange = "\\ufe20-\\ufe2f";
    var rsComboSymbolsRange = "\\u20d0-\\u20ff";
    var rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;
    var rsCombo = "[" + rsComboRange + "]";
    var reComboMark = RegExp(rsCombo, "g");
    function deburr2(string) {
      string = toString(string);
      return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
    }
    module.exports = deburr2;
  }
});

// ../../node_modules/mime-db/db.json
var require_db = __commonJS({
  "../../node_modules/mime-db/db.json"(exports$1, module) {
    module.exports = {
      "application/1d-interleaved-parityfec": {
        source: "iana"
      },
      "application/3gpdash-qoe-report+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/3gpp-ims+xml": {
        source: "iana",
        compressible: true
      },
      "application/3gpphal+json": {
        source: "iana",
        compressible: true
      },
      "application/3gpphalforms+json": {
        source: "iana",
        compressible: true
      },
      "application/a2l": {
        source: "iana"
      },
      "application/ace+cbor": {
        source: "iana"
      },
      "application/ace+json": {
        source: "iana",
        compressible: true
      },
      "application/ace-groupcomm+cbor": {
        source: "iana"
      },
      "application/ace-trl+cbor": {
        source: "iana"
      },
      "application/activemessage": {
        source: "iana"
      },
      "application/activity+json": {
        source: "iana",
        compressible: true
      },
      "application/aif+cbor": {
        source: "iana"
      },
      "application/aif+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-cdni+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-cdnifilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-directory+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcost+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcostparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointprop+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointpropparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-error+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-propmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-propmapparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-tips+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-tipsparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamcontrol+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamparams+json": {
        source: "iana",
        compressible: true
      },
      "application/aml": {
        source: "iana"
      },
      "application/andrew-inset": {
        source: "iana",
        extensions: ["ez"]
      },
      "application/appinstaller": {
        compressible: false,
        extensions: ["appinstaller"]
      },
      "application/applefile": {
        source: "iana"
      },
      "application/applixware": {
        source: "apache",
        extensions: ["aw"]
      },
      "application/appx": {
        compressible: false,
        extensions: ["appx"]
      },
      "application/appxbundle": {
        compressible: false,
        extensions: ["appxbundle"]
      },
      "application/at+jwt": {
        source: "iana"
      },
      "application/atf": {
        source: "iana"
      },
      "application/atfx": {
        source: "iana"
      },
      "application/atom+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atom"]
      },
      "application/atomcat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomcat"]
      },
      "application/atomdeleted+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomdeleted"]
      },
      "application/atomicmail": {
        source: "iana"
      },
      "application/atomsvc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomsvc"]
      },
      "application/atsc-dwd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dwd"]
      },
      "application/atsc-dynamic-event-message": {
        source: "iana"
      },
      "application/atsc-held+xml": {
        source: "iana",
        compressible: true,
        extensions: ["held"]
      },
      "application/atsc-rdt+json": {
        source: "iana",
        compressible: true
      },
      "application/atsc-rsat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsat"]
      },
      "application/atxml": {
        source: "iana"
      },
      "application/auth-policy+xml": {
        source: "iana",
        compressible: true
      },
      "application/automationml-aml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["aml"]
      },
      "application/automationml-amlx+zip": {
        source: "iana",
        compressible: false,
        extensions: ["amlx"]
      },
      "application/bacnet-xdd+zip": {
        source: "iana",
        compressible: false
      },
      "application/batch-smtp": {
        source: "iana"
      },
      "application/bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/beep+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/bufr": {
        source: "iana"
      },
      "application/c2pa": {
        source: "iana"
      },
      "application/calendar+json": {
        source: "iana",
        compressible: true
      },
      "application/calendar+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xcs"]
      },
      "application/call-completion": {
        source: "iana"
      },
      "application/cals-1840": {
        source: "iana"
      },
      "application/captive+json": {
        source: "iana",
        compressible: true
      },
      "application/cbor": {
        source: "iana"
      },
      "application/cbor-seq": {
        source: "iana"
      },
      "application/cccex": {
        source: "iana"
      },
      "application/ccmp+xml": {
        source: "iana",
        compressible: true
      },
      "application/ccxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ccxml"]
      },
      "application/cda+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/cdfx+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdfx"]
      },
      "application/cdmi-capability": {
        source: "iana",
        extensions: ["cdmia"]
      },
      "application/cdmi-container": {
        source: "iana",
        extensions: ["cdmic"]
      },
      "application/cdmi-domain": {
        source: "iana",
        extensions: ["cdmid"]
      },
      "application/cdmi-object": {
        source: "iana",
        extensions: ["cdmio"]
      },
      "application/cdmi-queue": {
        source: "iana",
        extensions: ["cdmiq"]
      },
      "application/cdni": {
        source: "iana"
      },
      "application/ce+cbor": {
        source: "iana"
      },
      "application/cea": {
        source: "iana"
      },
      "application/cea-2018+xml": {
        source: "iana",
        compressible: true
      },
      "application/cellml+xml": {
        source: "iana",
        compressible: true
      },
      "application/cfw": {
        source: "iana"
      },
      "application/cid-edhoc+cbor-seq": {
        source: "iana"
      },
      "application/city+json": {
        source: "iana",
        compressible: true
      },
      "application/city+json-seq": {
        source: "iana"
      },
      "application/clr": {
        source: "iana"
      },
      "application/clue+xml": {
        source: "iana",
        compressible: true
      },
      "application/clue_info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cms": {
        source: "iana"
      },
      "application/cnrp+xml": {
        source: "iana",
        compressible: true
      },
      "application/coap-eap": {
        source: "iana"
      },
      "application/coap-group+json": {
        source: "iana",
        compressible: true
      },
      "application/coap-payload": {
        source: "iana"
      },
      "application/commonground": {
        source: "iana"
      },
      "application/concise-problem-details+cbor": {
        source: "iana"
      },
      "application/conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cose": {
        source: "iana"
      },
      "application/cose-key": {
        source: "iana"
      },
      "application/cose-key-set": {
        source: "iana"
      },
      "application/cose-x509": {
        source: "iana"
      },
      "application/cpl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cpl"]
      },
      "application/csrattrs": {
        source: "iana"
      },
      "application/csta+xml": {
        source: "iana",
        compressible: true
      },
      "application/cstadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/csvm+json": {
        source: "iana",
        compressible: true
      },
      "application/cu-seeme": {
        source: "apache",
        extensions: ["cu"]
      },
      "application/cwl": {
        source: "iana",
        extensions: ["cwl"]
      },
      "application/cwl+json": {
        source: "iana",
        compressible: true
      },
      "application/cwl+yaml": {
        source: "iana"
      },
      "application/cwt": {
        source: "iana"
      },
      "application/cybercash": {
        source: "iana"
      },
      "application/dart": {
        compressible: true
      },
      "application/dash+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpd"]
      },
      "application/dash-patch+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpp"]
      },
      "application/dashdelta": {
        source: "iana"
      },
      "application/davmount+xml": {
        source: "iana",
        compressible: true,
        extensions: ["davmount"]
      },
      "application/dca-rft": {
        source: "iana"
      },
      "application/dcd": {
        source: "iana"
      },
      "application/dec-dx": {
        source: "iana"
      },
      "application/dialog-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/dicom": {
        source: "iana",
        extensions: ["dcm"]
      },
      "application/dicom+json": {
        source: "iana",
        compressible: true
      },
      "application/dicom+xml": {
        source: "iana",
        compressible: true
      },
      "application/dii": {
        source: "iana"
      },
      "application/dit": {
        source: "iana"
      },
      "application/dns": {
        source: "iana"
      },
      "application/dns+json": {
        source: "iana",
        compressible: true
      },
      "application/dns-message": {
        source: "iana"
      },
      "application/docbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dbk"]
      },
      "application/dots+cbor": {
        source: "iana"
      },
      "application/dpop+jwt": {
        source: "iana"
      },
      "application/dskpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/dssc+der": {
        source: "iana",
        extensions: ["dssc"]
      },
      "application/dssc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdssc"]
      },
      "application/dvcs": {
        source: "iana"
      },
      "application/eat+cwt": {
        source: "iana"
      },
      "application/eat+jwt": {
        source: "iana"
      },
      "application/eat-bun+cbor": {
        source: "iana"
      },
      "application/eat-bun+json": {
        source: "iana",
        compressible: true
      },
      "application/eat-ucs+cbor": {
        source: "iana"
      },
      "application/eat-ucs+json": {
        source: "iana",
        compressible: true
      },
      "application/ecmascript": {
        source: "apache",
        compressible: true,
        extensions: ["ecma"]
      },
      "application/edhoc+cbor-seq": {
        source: "iana"
      },
      "application/edi-consent": {
        source: "iana"
      },
      "application/edi-x12": {
        source: "iana",
        compressible: false
      },
      "application/edifact": {
        source: "iana",
        compressible: false
      },
      "application/efi": {
        source: "iana"
      },
      "application/elm+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/elm+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.cap+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/emergencycalldata.comment+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.control+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.deviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.ecall.msd": {
        source: "iana"
      },
      "application/emergencycalldata.legacyesn+json": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.providerinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.serviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.subscriberinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.veds+xml": {
        source: "iana",
        compressible: true
      },
      "application/emma+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emma"]
      },
      "application/emotionml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emotionml"]
      },
      "application/encaprtp": {
        source: "iana"
      },
      "application/entity-statement+jwt": {
        source: "iana"
      },
      "application/epp+xml": {
        source: "iana",
        compressible: true
      },
      "application/epub+zip": {
        source: "iana",
        compressible: false,
        extensions: ["epub"]
      },
      "application/eshop": {
        source: "iana"
      },
      "application/exi": {
        source: "iana",
        extensions: ["exi"]
      },
      "application/expect-ct-report+json": {
        source: "iana",
        compressible: true
      },
      "application/express": {
        source: "iana",
        extensions: ["exp"]
      },
      "application/fastinfoset": {
        source: "iana"
      },
      "application/fastsoap": {
        source: "iana"
      },
      "application/fdf": {
        source: "iana",
        extensions: ["fdf"]
      },
      "application/fdt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fdt"]
      },
      "application/fhir+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fhir+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fido.trusted-apps+json": {
        compressible: true
      },
      "application/fits": {
        source: "iana"
      },
      "application/flexfec": {
        source: "iana"
      },
      "application/font-sfnt": {
        source: "iana"
      },
      "application/font-tdpfr": {
        source: "iana",
        extensions: ["pfr"]
      },
      "application/font-woff": {
        source: "iana",
        compressible: false
      },
      "application/framework-attributes+xml": {
        source: "iana",
        compressible: true
      },
      "application/geo+json": {
        source: "iana",
        compressible: true,
        extensions: ["geojson"]
      },
      "application/geo+json-seq": {
        source: "iana"
      },
      "application/geopackage+sqlite3": {
        source: "iana"
      },
      "application/geopose+json": {
        source: "iana",
        compressible: true
      },
      "application/geoxacml+json": {
        source: "iana",
        compressible: true
      },
      "application/geoxacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/gltf-buffer": {
        source: "iana"
      },
      "application/gml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["gml"]
      },
      "application/gnap-binding-jws": {
        source: "iana"
      },
      "application/gnap-binding-jwsd": {
        source: "iana"
      },
      "application/gnap-binding-rotation-jws": {
        source: "iana"
      },
      "application/gnap-binding-rotation-jwsd": {
        source: "iana"
      },
      "application/gpx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["gpx"]
      },
      "application/grib": {
        source: "iana"
      },
      "application/gxf": {
        source: "apache",
        extensions: ["gxf"]
      },
      "application/gzip": {
        source: "iana",
        compressible: false,
        extensions: ["gz"]
      },
      "application/h224": {
        source: "iana"
      },
      "application/held+xml": {
        source: "iana",
        compressible: true
      },
      "application/hjson": {
        extensions: ["hjson"]
      },
      "application/hl7v2+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/http": {
        source: "iana"
      },
      "application/hyperstudio": {
        source: "iana",
        extensions: ["stk"]
      },
      "application/ibe-key-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pkg-reply+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pp-data": {
        source: "iana"
      },
      "application/iges": {
        source: "iana"
      },
      "application/im-iscomposing+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/index": {
        source: "iana"
      },
      "application/index.cmd": {
        source: "iana"
      },
      "application/index.obj": {
        source: "iana"
      },
      "application/index.response": {
        source: "iana"
      },
      "application/index.vnd": {
        source: "iana"
      },
      "application/inkml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ink", "inkml"]
      },
      "application/iotp": {
        source: "iana"
      },
      "application/ipfix": {
        source: "iana",
        extensions: ["ipfix"]
      },
      "application/ipp": {
        source: "iana"
      },
      "application/isup": {
        source: "iana"
      },
      "application/its+xml": {
        source: "iana",
        compressible: true,
        extensions: ["its"]
      },
      "application/java-archive": {
        source: "iana",
        compressible: false,
        extensions: ["jar", "war", "ear"]
      },
      "application/java-serialized-object": {
        source: "apache",
        compressible: false,
        extensions: ["ser"]
      },
      "application/java-vm": {
        source: "apache",
        compressible: false,
        extensions: ["class"]
      },
      "application/javascript": {
        source: "apache",
        charset: "UTF-8",
        compressible: true,
        extensions: ["js"]
      },
      "application/jf2feed+json": {
        source: "iana",
        compressible: true
      },
      "application/jose": {
        source: "iana"
      },
      "application/jose+json": {
        source: "iana",
        compressible: true
      },
      "application/jrd+json": {
        source: "iana",
        compressible: true
      },
      "application/jscalendar+json": {
        source: "iana",
        compressible: true
      },
      "application/jscontact+json": {
        source: "iana",
        compressible: true
      },
      "application/json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["json", "map"]
      },
      "application/json-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/json-seq": {
        source: "iana"
      },
      "application/json5": {
        extensions: ["json5"]
      },
      "application/jsonml+json": {
        source: "apache",
        compressible: true,
        extensions: ["jsonml"]
      },
      "application/jsonpath": {
        source: "iana"
      },
      "application/jwk+json": {
        source: "iana",
        compressible: true
      },
      "application/jwk-set+json": {
        source: "iana",
        compressible: true
      },
      "application/jwk-set+jwt": {
        source: "iana"
      },
      "application/jwt": {
        source: "iana"
      },
      "application/kpml-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/kpml-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/ld+json": {
        source: "iana",
        compressible: true,
        extensions: ["jsonld"]
      },
      "application/lgr+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lgr"]
      },
      "application/link-format": {
        source: "iana"
      },
      "application/linkset": {
        source: "iana"
      },
      "application/linkset+json": {
        source: "iana",
        compressible: true
      },
      "application/load-control+xml": {
        source: "iana",
        compressible: true
      },
      "application/logout+jwt": {
        source: "iana"
      },
      "application/lost+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lostxml"]
      },
      "application/lostsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/lpf+zip": {
        source: "iana",
        compressible: false
      },
      "application/lxf": {
        source: "iana"
      },
      "application/mac-binhex40": {
        source: "iana",
        extensions: ["hqx"]
      },
      "application/mac-compactpro": {
        source: "apache",
        extensions: ["cpt"]
      },
      "application/macwriteii": {
        source: "iana"
      },
      "application/mads+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mads"]
      },
      "application/manifest+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["webmanifest"]
      },
      "application/marc": {
        source: "iana",
        extensions: ["mrc"]
      },
      "application/marcxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mrcx"]
      },
      "application/mathematica": {
        source: "iana",
        extensions: ["ma", "nb", "mb"]
      },
      "application/mathml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mathml"]
      },
      "application/mathml-content+xml": {
        source: "iana",
        compressible: true
      },
      "application/mathml-presentation+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-associated-procedure-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-deregister+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-envelope+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-protection-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-reception-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-schedule+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-user-service-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbox": {
        source: "iana",
        extensions: ["mbox"]
      },
      "application/media-policy-dataset+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpf"]
      },
      "application/media_control+xml": {
        source: "iana",
        compressible: true
      },
      "application/mediaservercontrol+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mscml"]
      },
      "application/merge-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/metalink+xml": {
        source: "apache",
        compressible: true,
        extensions: ["metalink"]
      },
      "application/metalink4+xml": {
        source: "iana",
        compressible: true,
        extensions: ["meta4"]
      },
      "application/mets+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mets"]
      },
      "application/mf4": {
        source: "iana"
      },
      "application/mikey": {
        source: "iana"
      },
      "application/mipc": {
        source: "iana"
      },
      "application/missing-blocks+cbor-seq": {
        source: "iana"
      },
      "application/mmt-aei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["maei"]
      },
      "application/mmt-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musd"]
      },
      "application/mods+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mods"]
      },
      "application/moss-keys": {
        source: "iana"
      },
      "application/moss-signature": {
        source: "iana"
      },
      "application/mosskey-data": {
        source: "iana"
      },
      "application/mosskey-request": {
        source: "iana"
      },
      "application/mp21": {
        source: "iana",
        extensions: ["m21", "mp21"]
      },
      "application/mp4": {
        source: "iana",
        extensions: ["mp4", "mpg4", "mp4s", "m4p"]
      },
      "application/mpeg4-generic": {
        source: "iana"
      },
      "application/mpeg4-iod": {
        source: "iana"
      },
      "application/mpeg4-iod-xmt": {
        source: "iana"
      },
      "application/mrb-consumer+xml": {
        source: "iana",
        compressible: true
      },
      "application/mrb-publish+xml": {
        source: "iana",
        compressible: true
      },
      "application/msc-ivr+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msc-mixer+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msix": {
        compressible: false,
        extensions: ["msix"]
      },
      "application/msixbundle": {
        compressible: false,
        extensions: ["msixbundle"]
      },
      "application/msword": {
        source: "iana",
        compressible: false,
        extensions: ["doc", "dot"]
      },
      "application/mud+json": {
        source: "iana",
        compressible: true
      },
      "application/multipart-core": {
        source: "iana"
      },
      "application/mxf": {
        source: "iana",
        extensions: ["mxf"]
      },
      "application/n-quads": {
        source: "iana",
        extensions: ["nq"]
      },
      "application/n-triples": {
        source: "iana",
        extensions: ["nt"]
      },
      "application/nasdata": {
        source: "iana"
      },
      "application/news-checkgroups": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-groupinfo": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-transmission": {
        source: "iana"
      },
      "application/nlsml+xml": {
        source: "iana",
        compressible: true
      },
      "application/node": {
        source: "iana",
        extensions: ["cjs"]
      },
      "application/nss": {
        source: "iana"
      },
      "application/oauth-authz-req+jwt": {
        source: "iana"
      },
      "application/oblivious-dns-message": {
        source: "iana"
      },
      "application/ocsp-request": {
        source: "iana"
      },
      "application/ocsp-response": {
        source: "iana"
      },
      "application/octet-stream": {
        source: "iana",
        compressible: true,
        extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"]
      },
      "application/oda": {
        source: "iana",
        extensions: ["oda"]
      },
      "application/odm+xml": {
        source: "iana",
        compressible: true
      },
      "application/odx": {
        source: "iana"
      },
      "application/oebps-package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["opf"]
      },
      "application/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogx"]
      },
      "application/ohttp-keys": {
        source: "iana"
      },
      "application/omdoc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["omdoc"]
      },
      "application/onenote": {
        source: "apache",
        extensions: ["onetoc", "onetoc2", "onetmp", "onepkg", "one", "onea"]
      },
      "application/opc-nodeset+xml": {
        source: "iana",
        compressible: true
      },
      "application/oscore": {
        source: "iana"
      },
      "application/oxps": {
        source: "iana",
        extensions: ["oxps"]
      },
      "application/p21": {
        source: "iana"
      },
      "application/p21+zip": {
        source: "iana",
        compressible: false
      },
      "application/p2p-overlay+xml": {
        source: "iana",
        compressible: true,
        extensions: ["relo"]
      },
      "application/parityfec": {
        source: "iana"
      },
      "application/passport": {
        source: "iana"
      },
      "application/patch-ops-error+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xer"]
      },
      "application/pdf": {
        source: "iana",
        compressible: false,
        extensions: ["pdf"]
      },
      "application/pdx": {
        source: "iana"
      },
      "application/pem-certificate-chain": {
        source: "iana"
      },
      "application/pgp-encrypted": {
        source: "iana",
        compressible: false,
        extensions: ["pgp"]
      },
      "application/pgp-keys": {
        source: "iana",
        extensions: ["asc"]
      },
      "application/pgp-signature": {
        source: "iana",
        extensions: ["sig", "asc"]
      },
      "application/pics-rules": {
        source: "apache",
        extensions: ["prf"]
      },
      "application/pidf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pidf-diff+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pkcs10": {
        source: "iana",
        extensions: ["p10"]
      },
      "application/pkcs12": {
        source: "iana"
      },
      "application/pkcs7-mime": {
        source: "iana",
        extensions: ["p7m", "p7c"]
      },
      "application/pkcs7-signature": {
        source: "iana",
        extensions: ["p7s"]
      },
      "application/pkcs8": {
        source: "iana",
        extensions: ["p8"]
      },
      "application/pkcs8-encrypted": {
        source: "iana"
      },
      "application/pkix-attr-cert": {
        source: "iana",
        extensions: ["ac"]
      },
      "application/pkix-cert": {
        source: "iana",
        extensions: ["cer"]
      },
      "application/pkix-crl": {
        source: "iana",
        extensions: ["crl"]
      },
      "application/pkix-pkipath": {
        source: "iana",
        extensions: ["pkipath"]
      },
      "application/pkixcmp": {
        source: "iana",
        extensions: ["pki"]
      },
      "application/pls+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pls"]
      },
      "application/poc-settings+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/postscript": {
        source: "iana",
        compressible: true,
        extensions: ["ai", "eps", "ps"]
      },
      "application/ppsp-tracker+json": {
        source: "iana",
        compressible: true
      },
      "application/private-token-issuer-directory": {
        source: "iana"
      },
      "application/private-token-request": {
        source: "iana"
      },
      "application/private-token-response": {
        source: "iana"
      },
      "application/problem+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+xml": {
        source: "iana",
        compressible: true
      },
      "application/provenance+xml": {
        source: "iana",
        compressible: true,
        extensions: ["provx"]
      },
      "application/provided-claims+jwt": {
        source: "iana"
      },
      "application/prs.alvestrand.titrax-sheet": {
        source: "iana"
      },
      "application/prs.cww": {
        source: "iana",
        extensions: ["cww"]
      },
      "application/prs.cyn": {
        source: "iana",
        charset: "7-BIT"
      },
      "application/prs.hpub+zip": {
        source: "iana",
        compressible: false
      },
      "application/prs.implied-document+xml": {
        source: "iana",
        compressible: true
      },
      "application/prs.implied-executable": {
        source: "iana"
      },
      "application/prs.implied-object+json": {
        source: "iana",
        compressible: true
      },
      "application/prs.implied-object+json-seq": {
        source: "iana"
      },
      "application/prs.implied-object+yaml": {
        source: "iana"
      },
      "application/prs.implied-structure": {
        source: "iana"
      },
      "application/prs.mayfile": {
        source: "iana"
      },
      "application/prs.nprend": {
        source: "iana"
      },
      "application/prs.plucker": {
        source: "iana"
      },
      "application/prs.rdf-xml-crypt": {
        source: "iana"
      },
      "application/prs.vcfbzip2": {
        source: "iana"
      },
      "application/prs.xsf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xsf"]
      },
      "application/pskc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pskcxml"]
      },
      "application/pvd+json": {
        source: "iana",
        compressible: true
      },
      "application/qsig": {
        source: "iana"
      },
      "application/raml+yaml": {
        compressible: true,
        extensions: ["raml"]
      },
      "application/raptorfec": {
        source: "iana"
      },
      "application/rdap+json": {
        source: "iana",
        compressible: true
      },
      "application/rdf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rdf", "owl"]
      },
      "application/reginfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rif"]
      },
      "application/relax-ng-compact-syntax": {
        source: "iana",
        extensions: ["rnc"]
      },
      "application/remote-printing": {
        source: "apache"
      },
      "application/reputon+json": {
        source: "iana",
        compressible: true
      },
      "application/resolve-response+jwt": {
        source: "iana"
      },
      "application/resource-lists+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rl"]
      },
      "application/resource-lists-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rld"]
      },
      "application/rfc+xml": {
        source: "iana",
        compressible: true
      },
      "application/riscos": {
        source: "iana"
      },
      "application/rlmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/rls-services+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rs"]
      },
      "application/route-apd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rapd"]
      },
      "application/route-s-tsid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sls"]
      },
      "application/route-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rusd"]
      },
      "application/rpki-checklist": {
        source: "iana"
      },
      "application/rpki-ghostbusters": {
        source: "iana",
        extensions: ["gbr"]
      },
      "application/rpki-manifest": {
        source: "iana",
        extensions: ["mft"]
      },
      "application/rpki-publication": {
        source: "iana"
      },
      "application/rpki-roa": {
        source: "iana",
        extensions: ["roa"]
      },
      "application/rpki-signed-tal": {
        source: "iana"
      },
      "application/rpki-updown": {
        source: "iana"
      },
      "application/rsd+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rsd"]
      },
      "application/rss+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rss"]
      },
      "application/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "application/rtploopback": {
        source: "iana"
      },
      "application/rtx": {
        source: "iana"
      },
      "application/samlassertion+xml": {
        source: "iana",
        compressible: true
      },
      "application/samlmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/sarif+json": {
        source: "iana",
        compressible: true
      },
      "application/sarif-external-properties+json": {
        source: "iana",
        compressible: true
      },
      "application/sbe": {
        source: "iana"
      },
      "application/sbml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sbml"]
      },
      "application/scaip+xml": {
        source: "iana",
        compressible: true
      },
      "application/scim+json": {
        source: "iana",
        compressible: true
      },
      "application/scvp-cv-request": {
        source: "iana",
        extensions: ["scq"]
      },
      "application/scvp-cv-response": {
        source: "iana",
        extensions: ["scs"]
      },
      "application/scvp-vp-request": {
        source: "iana",
        extensions: ["spq"]
      },
      "application/scvp-vp-response": {
        source: "iana",
        extensions: ["spp"]
      },
      "application/sdp": {
        source: "iana",
        extensions: ["sdp"]
      },
      "application/secevent+jwt": {
        source: "iana"
      },
      "application/senml+cbor": {
        source: "iana"
      },
      "application/senml+json": {
        source: "iana",
        compressible: true
      },
      "application/senml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["senmlx"]
      },
      "application/senml-etch+cbor": {
        source: "iana"
      },
      "application/senml-etch+json": {
        source: "iana",
        compressible: true
      },
      "application/senml-exi": {
        source: "iana"
      },
      "application/sensml+cbor": {
        source: "iana"
      },
      "application/sensml+json": {
        source: "iana",
        compressible: true
      },
      "application/sensml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sensmlx"]
      },
      "application/sensml-exi": {
        source: "iana"
      },
      "application/sep+xml": {
        source: "iana",
        compressible: true
      },
      "application/sep-exi": {
        source: "iana"
      },
      "application/session-info": {
        source: "iana"
      },
      "application/set-payment": {
        source: "iana"
      },
      "application/set-payment-initiation": {
        source: "iana",
        extensions: ["setpay"]
      },
      "application/set-registration": {
        source: "iana"
      },
      "application/set-registration-initiation": {
        source: "iana",
        extensions: ["setreg"]
      },
      "application/sgml": {
        source: "iana"
      },
      "application/sgml-open-catalog": {
        source: "iana"
      },
      "application/shf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["shf"]
      },
      "application/sieve": {
        source: "iana",
        extensions: ["siv", "sieve"]
      },
      "application/simple-filter+xml": {
        source: "iana",
        compressible: true
      },
      "application/simple-message-summary": {
        source: "iana"
      },
      "application/simplesymbolcontainer": {
        source: "iana"
      },
      "application/sipc": {
        source: "iana"
      },
      "application/slate": {
        source: "iana"
      },
      "application/smil": {
        source: "apache"
      },
      "application/smil+xml": {
        source: "iana",
        compressible: true,
        extensions: ["smi", "smil"]
      },
      "application/smpte336m": {
        source: "iana"
      },
      "application/soap+fastinfoset": {
        source: "iana"
      },
      "application/soap+xml": {
        source: "iana",
        compressible: true
      },
      "application/sparql-query": {
        source: "iana",
        extensions: ["rq"]
      },
      "application/sparql-results+xml": {
        source: "iana",
        compressible: true,
        extensions: ["srx"]
      },
      "application/spdx+json": {
        source: "iana",
        compressible: true
      },
      "application/spirits-event+xml": {
        source: "iana",
        compressible: true
      },
      "application/sql": {
        source: "iana",
        extensions: ["sql"]
      },
      "application/srgs": {
        source: "iana",
        extensions: ["gram"]
      },
      "application/srgs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["grxml"]
      },
      "application/sru+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sru"]
      },
      "application/ssdl+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ssdl"]
      },
      "application/sslkeylogfile": {
        source: "iana"
      },
      "application/ssml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ssml"]
      },
      "application/st2110-41": {
        source: "iana"
      },
      "application/stix+json": {
        source: "iana",
        compressible: true
      },
      "application/stratum": {
        source: "iana"
      },
      "application/swid+cbor": {
        source: "iana"
      },
      "application/swid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["swidtag"]
      },
      "application/tamp-apex-update": {
        source: "iana"
      },
      "application/tamp-apex-update-confirm": {
        source: "iana"
      },
      "application/tamp-community-update": {
        source: "iana"
      },
      "application/tamp-community-update-confirm": {
        source: "iana"
      },
      "application/tamp-error": {
        source: "iana"
      },
      "application/tamp-sequence-adjust": {
        source: "iana"
      },
      "application/tamp-sequence-adjust-confirm": {
        source: "iana"
      },
      "application/tamp-status-query": {
        source: "iana"
      },
      "application/tamp-status-response": {
        source: "iana"
      },
      "application/tamp-update": {
        source: "iana"
      },
      "application/tamp-update-confirm": {
        source: "iana"
      },
      "application/tar": {
        compressible: true
      },
      "application/taxii+json": {
        source: "iana",
        compressible: true
      },
      "application/td+json": {
        source: "iana",
        compressible: true
      },
      "application/tei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tei", "teicorpus"]
      },
      "application/tetra_isi": {
        source: "iana"
      },
      "application/thraud+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tfi"]
      },
      "application/timestamp-query": {
        source: "iana"
      },
      "application/timestamp-reply": {
        source: "iana"
      },
      "application/timestamped-data": {
        source: "iana",
        extensions: ["tsd"]
      },
      "application/tlsrpt+gzip": {
        source: "iana"
      },
      "application/tlsrpt+json": {
        source: "iana",
        compressible: true
      },
      "application/tm+json": {
        source: "iana",
        compressible: true
      },
      "application/tnauthlist": {
        source: "iana"
      },
      "application/toc+cbor": {
        source: "iana"
      },
      "application/token-introspection+jwt": {
        source: "iana"
      },
      "application/toml": {
        source: "iana",
        compressible: true,
        extensions: ["toml"]
      },
      "application/trickle-ice-sdpfrag": {
        source: "iana"
      },
      "application/trig": {
        source: "iana",
        extensions: ["trig"]
      },
      "application/trust-chain+json": {
        source: "iana",
        compressible: true
      },
      "application/trust-mark+jwt": {
        source: "iana"
      },
      "application/trust-mark-delegation+jwt": {
        source: "iana"
      },
      "application/ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ttml"]
      },
      "application/tve-trigger": {
        source: "iana"
      },
      "application/tzif": {
        source: "iana"
      },
      "application/tzif-leap": {
        source: "iana"
      },
      "application/ubjson": {
        compressible: false,
        extensions: ["ubj"]
      },
      "application/uccs+cbor": {
        source: "iana"
      },
      "application/ujcs+json": {
        source: "iana",
        compressible: true
      },
      "application/ulpfec": {
        source: "iana"
      },
      "application/urc-grpsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/urc-ressheet+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsheet"]
      },
      "application/urc-targetdesc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["td"]
      },
      "application/urc-uisocketdesc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vc": {
        source: "iana"
      },
      "application/vc+cose": {
        source: "iana"
      },
      "application/vc+jwt": {
        source: "iana"
      },
      "application/vcard+json": {
        source: "iana",
        compressible: true
      },
      "application/vcard+xml": {
        source: "iana",
        compressible: true
      },
      "application/vemmi": {
        source: "iana"
      },
      "application/vividence.scriptfile": {
        source: "apache"
      },
      "application/vnd.1000minds.decision-model+xml": {
        source: "iana",
        compressible: true,
        extensions: ["1km"]
      },
      "application/vnd.1ob": {
        source: "iana"
      },
      "application/vnd.3gpp-prose+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3a+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3ach+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3ch+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc8+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-v2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.5gnas": {
        source: "iana"
      },
      "application/vnd.3gpp.5gsa2x": {
        source: "iana"
      },
      "application/vnd.3gpp.5gsa2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.5gsv2x": {
        source: "iana"
      },
      "application/vnd.3gpp.5gsv2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.access-transfer-events+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.bsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.crs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.current-location-discovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gmop+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gtpc": {
        source: "iana"
      },
      "application/vnd.3gpp.interworking-data": {
        source: "iana"
      },
      "application/vnd.3gpp.lpp": {
        source: "iana"
      },
      "application/vnd.3gpp.mc-signalling-ear": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-msgstore-ctrl-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-payload": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-regroup+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-signalling": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-floor-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-regroup+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-signed+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-init-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-regroup+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-transmission-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mid-call+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ngap": {
        source: "iana"
      },
      "application/vnd.3gpp.pfcp": {
        source: "iana"
      },
      "application/vnd.3gpp.pic-bw-large": {
        source: "iana",
        extensions: ["plb"]
      },
      "application/vnd.3gpp.pic-bw-small": {
        source: "iana",
        extensions: ["psb"]
      },
      "application/vnd.3gpp.pic-bw-var": {
        source: "iana",
        extensions: ["pvb"]
      },
      "application/vnd.3gpp.pinapp-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.s1ap": {
        source: "iana"
      },
      "application/vnd.3gpp.seal-group-doc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.seal-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.seal-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.seal-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.seal-network-qos-management-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.seal-ue-config-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.seal-unicast-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.seal-user-profile-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.sms": {
        source: "iana"
      },
      "application/vnd.3gpp.sms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-ext+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.state-and-event-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ussd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.v2x": {
        source: "iana"
      },
      "application/vnd.3gpp.vae-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.bcmcsinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.sms": {
        source: "iana"
      },
      "application/vnd.3gpp2.tcap": {
        source: "iana",
        extensions: ["tcap"]
      },
      "application/vnd.3lightssoftware.imagescal": {
        source: "iana"
      },
      "application/vnd.3m.post-it-notes": {
        source: "iana",
        extensions: ["pwn"]
      },
      "application/vnd.accpac.simply.aso": {
        source: "iana",
        extensions: ["aso"]
      },
      "application/vnd.accpac.simply.imp": {
        source: "iana",
        extensions: ["imp"]
      },
      "application/vnd.acm.addressxfer+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.acm.chatbot+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.acucobol": {
        source: "iana",
        extensions: ["acu"]
      },
      "application/vnd.acucorp": {
        source: "iana",
        extensions: ["atc", "acutc"]
      },
      "application/vnd.adobe.air-application-installer-package+zip": {
        source: "apache",
        compressible: false,
        extensions: ["air"]
      },
      "application/vnd.adobe.flash.movie": {
        source: "iana"
      },
      "application/vnd.adobe.formscentral.fcdt": {
        source: "iana",
        extensions: ["fcdt"]
      },
      "application/vnd.adobe.fxp": {
        source: "iana",
        extensions: ["fxp", "fxpl"]
      },
      "application/vnd.adobe.partial-upload": {
        source: "iana"
      },
      "application/vnd.adobe.xdp+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdp"]
      },
      "application/vnd.adobe.xfdf": {
        source: "apache",
        extensions: ["xfdf"]
      },
      "application/vnd.aether.imp": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata-pagedef": {
        source: "iana"
      },
      "application/vnd.afpc.cmoca-cmresource": {
        source: "iana"
      },
      "application/vnd.afpc.foca-charset": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codedfont": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codepage": {
        source: "iana"
      },
      "application/vnd.afpc.modca": {
        source: "iana"
      },
      "application/vnd.afpc.modca-cmtable": {
        source: "iana"
      },
      "application/vnd.afpc.modca-formdef": {
        source: "iana"
      },
      "application/vnd.afpc.modca-mediummap": {
        source: "iana"
      },
      "application/vnd.afpc.modca-objectcontainer": {
        source: "iana"
      },
      "application/vnd.afpc.modca-overlay": {
        source: "iana"
      },
      "application/vnd.afpc.modca-pagesegment": {
        source: "iana"
      },
      "application/vnd.age": {
        source: "iana",
        extensions: ["age"]
      },
      "application/vnd.ah-barcode": {
        source: "apache"
      },
      "application/vnd.ahead.space": {
        source: "iana",
        extensions: ["ahead"]
      },
      "application/vnd.airzip.filesecure.azf": {
        source: "iana",
        extensions: ["azf"]
      },
      "application/vnd.airzip.filesecure.azs": {
        source: "iana",
        extensions: ["azs"]
      },
      "application/vnd.amadeus+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.amazon.ebook": {
        source: "apache",
        extensions: ["azw"]
      },
      "application/vnd.amazon.mobi8-ebook": {
        source: "iana"
      },
      "application/vnd.americandynamics.acc": {
        source: "iana",
        extensions: ["acc"]
      },
      "application/vnd.amiga.ami": {
        source: "iana",
        extensions: ["ami"]
      },
      "application/vnd.amundsen.maze+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.android.ota": {
        source: "iana"
      },
      "application/vnd.android.package-archive": {
        source: "apache",
        compressible: false,
        extensions: ["apk"]
      },
      "application/vnd.anki": {
        source: "iana"
      },
      "application/vnd.anser-web-certificate-issue-initiation": {
        source: "iana",
        extensions: ["cii"]
      },
      "application/vnd.anser-web-funds-transfer-initiation": {
        source: "apache",
        extensions: ["fti"]
      },
      "application/vnd.antix.game-component": {
        source: "iana",
        extensions: ["atx"]
      },
      "application/vnd.apache.arrow.file": {
        source: "iana"
      },
      "application/vnd.apache.arrow.stream": {
        source: "iana"
      },
      "application/vnd.apache.parquet": {
        source: "iana"
      },
      "application/vnd.apache.thrift.binary": {
        source: "iana"
      },
      "application/vnd.apache.thrift.compact": {
        source: "iana"
      },
      "application/vnd.apache.thrift.json": {
        source: "iana"
      },
      "application/vnd.apexlang": {
        source: "iana"
      },
      "application/vnd.api+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.aplextor.warrp+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apothekende.reservation+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apple.installer+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpkg"]
      },
      "application/vnd.apple.keynote": {
        source: "iana",
        extensions: ["key"]
      },
      "application/vnd.apple.mpegurl": {
        source: "iana",
        extensions: ["m3u8"]
      },
      "application/vnd.apple.numbers": {
        source: "iana",
        extensions: ["numbers"]
      },
      "application/vnd.apple.pages": {
        source: "iana",
        extensions: ["pages"]
      },
      "application/vnd.apple.pkpass": {
        compressible: false,
        extensions: ["pkpass"]
      },
      "application/vnd.arastra.swi": {
        source: "apache"
      },
      "application/vnd.aristanetworks.swi": {
        source: "iana",
        extensions: ["swi"]
      },
      "application/vnd.artisan+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.artsquare": {
        source: "iana"
      },
      "application/vnd.astraea-software.iota": {
        source: "iana",
        extensions: ["iota"]
      },
      "application/vnd.audiograph": {
        source: "iana",
        extensions: ["aep"]
      },
      "application/vnd.autodesk.fbx": {
        extensions: ["fbx"]
      },
      "application/vnd.autopackage": {
        source: "iana"
      },
      "application/vnd.avalon+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.avistar+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.balsamiq.bmml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["bmml"]
      },
      "application/vnd.balsamiq.bmpr": {
        source: "iana"
      },
      "application/vnd.banana-accounting": {
        source: "iana"
      },
      "application/vnd.bbf.usp.error": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bekitzur-stech+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.belightsoft.lhzd+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.belightsoft.lhzl+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.bint.med-content": {
        source: "iana"
      },
      "application/vnd.biopax.rdf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.blink-idb-value-wrapper": {
        source: "iana"
      },
      "application/vnd.blueice.multipass": {
        source: "iana",
        extensions: ["mpm"]
      },
      "application/vnd.bluetooth.ep.oob": {
        source: "iana"
      },
      "application/vnd.bluetooth.le.oob": {
        source: "iana"
      },
      "application/vnd.bmi": {
        source: "iana",
        extensions: ["bmi"]
      },
      "application/vnd.bpf": {
        source: "iana"
      },
      "application/vnd.bpf3": {
        source: "iana"
      },
      "application/vnd.businessobjects": {
        source: "iana",
        extensions: ["rep"]
      },
      "application/vnd.byu.uapi+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bzip3": {
        source: "iana"
      },
      "application/vnd.c3voc.schedule+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cab-jscript": {
        source: "iana"
      },
      "application/vnd.canon-cpdl": {
        source: "iana"
      },
      "application/vnd.canon-lips": {
        source: "iana"
      },
      "application/vnd.capasystems-pg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cendio.thinlinc.clientconf": {
        source: "iana"
      },
      "application/vnd.century-systems.tcp_stream": {
        source: "iana"
      },
      "application/vnd.chemdraw+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdxml"]
      },
      "application/vnd.chess-pgn": {
        source: "iana"
      },
      "application/vnd.chipnuts.karaoke-mmd": {
        source: "iana",
        extensions: ["mmd"]
      },
      "application/vnd.ciedi": {
        source: "iana"
      },
      "application/vnd.cinderella": {
        source: "iana",
        extensions: ["cdy"]
      },
      "application/vnd.cirpack.isdn-ext": {
        source: "iana"
      },
      "application/vnd.citationstyles.style+xml": {
        source: "iana",
        compressible: true,
        extensions: ["csl"]
      },
      "application/vnd.claymore": {
        source: "iana",
        extensions: ["cla"]
      },
      "application/vnd.cloanto.rp9": {
        source: "iana",
        extensions: ["rp9"]
      },
      "application/vnd.clonk.c4group": {
        source: "iana",
        extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
      },
      "application/vnd.cluetrust.cartomobile-config": {
        source: "iana",
        extensions: ["c11amc"]
      },
      "application/vnd.cluetrust.cartomobile-config-pkg": {
        source: "iana",
        extensions: ["c11amz"]
      },
      "application/vnd.cncf.helm.chart.content.v1.tar+gzip": {
        source: "iana"
      },
      "application/vnd.cncf.helm.chart.provenance.v1.prov": {
        source: "iana"
      },
      "application/vnd.cncf.helm.config.v1+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.coffeescript": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet-template": {
        source: "iana"
      },
      "application/vnd.collection+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.doc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.next+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.comicbook+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.comicbook-rar": {
        source: "iana"
      },
      "application/vnd.commerce-battelle": {
        source: "iana"
      },
      "application/vnd.commonspace": {
        source: "iana",
        extensions: ["csp"]
      },
      "application/vnd.contact.cmsg": {
        source: "iana",
        extensions: ["cdbcmsg"]
      },
      "application/vnd.coreos.ignition+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cosmocaller": {
        source: "iana",
        extensions: ["cmc"]
      },
      "application/vnd.crick.clicker": {
        source: "iana",
        extensions: ["clkx"]
      },
      "application/vnd.crick.clicker.keyboard": {
        source: "iana",
        extensions: ["clkk"]
      },
      "application/vnd.crick.clicker.palette": {
        source: "iana",
        extensions: ["clkp"]
      },
      "application/vnd.crick.clicker.template": {
        source: "iana",
        extensions: ["clkt"]
      },
      "application/vnd.crick.clicker.wordbank": {
        source: "iana",
        extensions: ["clkw"]
      },
      "application/vnd.criticaltools.wbs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wbs"]
      },
      "application/vnd.cryptii.pipe+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.crypto-shade-file": {
        source: "iana"
      },
      "application/vnd.cryptomator.encrypted": {
        source: "iana"
      },
      "application/vnd.cryptomator.vault": {
        source: "iana"
      },
      "application/vnd.ctc-posml": {
        source: "iana",
        extensions: ["pml"]
      },
      "application/vnd.ctct.ws+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cups-pdf": {
        source: "iana"
      },
      "application/vnd.cups-postscript": {
        source: "iana"
      },
      "application/vnd.cups-ppd": {
        source: "iana",
        extensions: ["ppd"]
      },
      "application/vnd.cups-raster": {
        source: "iana"
      },
      "application/vnd.cups-raw": {
        source: "iana"
      },
      "application/vnd.curl": {
        source: "iana"
      },
      "application/vnd.curl.car": {
        source: "apache",
        extensions: ["car"]
      },
      "application/vnd.curl.pcurl": {
        source: "apache",
        extensions: ["pcurl"]
      },
      "application/vnd.cyan.dean.root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cybank": {
        source: "iana"
      },
      "application/vnd.cyclonedx+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cyclonedx+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.d2l.coursepackage1p0+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.d3m-dataset": {
        source: "iana"
      },
      "application/vnd.d3m-problem": {
        source: "iana"
      },
      "application/vnd.dart": {
        source: "iana",
        compressible: true,
        extensions: ["dart"]
      },
      "application/vnd.data-vision.rdz": {
        source: "iana",
        extensions: ["rdz"]
      },
      "application/vnd.datalog": {
        source: "iana"
      },
      "application/vnd.datapackage+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dataresource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dbf": {
        source: "iana",
        extensions: ["dbf"]
      },
      "application/vnd.dcmp+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dcmp"]
      },
      "application/vnd.debian.binary-package": {
        source: "iana"
      },
      "application/vnd.dece.data": {
        source: "iana",
        extensions: ["uvf", "uvvf", "uvd", "uvvd"]
      },
      "application/vnd.dece.ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uvt", "uvvt"]
      },
      "application/vnd.dece.unspecified": {
        source: "iana",
        extensions: ["uvx", "uvvx"]
      },
      "application/vnd.dece.zip": {
        source: "iana",
        extensions: ["uvz", "uvvz"]
      },
      "application/vnd.denovo.fcselayout-link": {
        source: "iana",
        extensions: ["fe_launch"]
      },
      "application/vnd.desmume.movie": {
        source: "iana"
      },
      "application/vnd.dir-bi.plate-dl-nosuffix": {
        source: "iana"
      },
      "application/vnd.dm.delegation+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dna": {
        source: "iana",
        extensions: ["dna"]
      },
      "application/vnd.document+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dolby.mlp": {
        source: "apache",
        extensions: ["mlp"]
      },
      "application/vnd.dolby.mobile.1": {
        source: "iana"
      },
      "application/vnd.dolby.mobile.2": {
        source: "iana"
      },
      "application/vnd.doremir.scorecloud-binary-document": {
        source: "iana"
      },
      "application/vnd.dpgraph": {
        source: "iana",
        extensions: ["dpg"]
      },
      "application/vnd.dreamfactory": {
        source: "iana",
        extensions: ["dfac"]
      },
      "application/vnd.drive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ds-keypoint": {
        source: "apache",
        extensions: ["kpxx"]
      },
      "application/vnd.dtg.local": {
        source: "iana"
      },
      "application/vnd.dtg.local.flash": {
        source: "iana"
      },
      "application/vnd.dtg.local.html": {
        source: "iana"
      },
      "application/vnd.dvb.ait": {
        source: "iana",
        extensions: ["ait"]
      },
      "application/vnd.dvb.dvbisl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.dvbj": {
        source: "iana"
      },
      "application/vnd.dvb.esgcontainer": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcdftnotifaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess2": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgpdd": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcroaming": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-base": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-enhancement": {
        source: "iana"
      },
      "application/vnd.dvb.notif-aggregate-root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-container+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-generic+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-msglist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-init+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.pfr": {
        source: "iana"
      },
      "application/vnd.dvb.service": {
        source: "iana",
        extensions: ["svc"]
      },
      "application/vnd.dxr": {
        source: "iana"
      },
      "application/vnd.dynageo": {
        source: "iana",
        extensions: ["geo"]
      },
      "application/vnd.dzr": {
        source: "iana"
      },
      "application/vnd.easykaraoke.cdgdownload": {
        source: "iana"
      },
      "application/vnd.ecdis-update": {
        source: "iana"
      },
      "application/vnd.ecip.rlp": {
        source: "iana"
      },
      "application/vnd.eclipse.ditto+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ecowin.chart": {
        source: "iana",
        extensions: ["mag"]
      },
      "application/vnd.ecowin.filerequest": {
        source: "iana"
      },
      "application/vnd.ecowin.fileupdate": {
        source: "iana"
      },
      "application/vnd.ecowin.series": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesrequest": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesupdate": {
        source: "iana"
      },
      "application/vnd.efi.img": {
        source: "iana"
      },
      "application/vnd.efi.iso": {
        source: "iana"
      },
      "application/vnd.eln+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.emclient.accessrequest+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.enliven": {
        source: "iana",
        extensions: ["nml"]
      },
      "application/vnd.enphase.envoy": {
        source: "iana"
      },
      "application/vnd.eprints.data+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.epson.esf": {
        source: "iana",
        extensions: ["esf"]
      },
      "application/vnd.epson.msf": {
        source: "iana",
        extensions: ["msf"]
      },
      "application/vnd.epson.quickanime": {
        source: "iana",
        extensions: ["qam"]
      },
      "application/vnd.epson.salt": {
        source: "iana",
        extensions: ["slt"]
      },
      "application/vnd.epson.ssf": {
        source: "iana",
        extensions: ["ssf"]
      },
      "application/vnd.ericsson.quickcall": {
        source: "iana"
      },
      "application/vnd.erofs": {
        source: "iana"
      },
      "application/vnd.espass-espass+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.eszigno3+xml": {
        source: "iana",
        compressible: true,
        extensions: ["es3", "et3"]
      },
      "application/vnd.etsi.aoc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.asic-e+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.asic-s+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.cug+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvcommand+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-bc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-cod+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-npvr+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvservice+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mcid+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mheg5": {
        source: "iana"
      },
      "application/vnd.etsi.overload-control-policy-dataset+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.pstn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.sci+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.simservs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.timestamp-token": {
        source: "iana"
      },
      "application/vnd.etsi.tsl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.tsl.der": {
        source: "iana"
      },
      "application/vnd.eu.kasparian.car+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.eudora.data": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.profile": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.settings": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.theme": {
        source: "iana"
      },
      "application/vnd.exstream-empower+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.exstream-package": {
        source: "iana"
      },
      "application/vnd.ezpix-album": {
        source: "iana",
        extensions: ["ez2"]
      },
      "application/vnd.ezpix-package": {
        source: "iana",
        extensions: ["ez3"]
      },
      "application/vnd.f-secure.mobile": {
        source: "iana"
      },
      "application/vnd.familysearch.gedcom+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.fastcopy-disk-image": {
        source: "iana"
      },
      "application/vnd.fdf": {
        source: "apache",
        extensions: ["fdf"]
      },
      "application/vnd.fdsn.mseed": {
        source: "iana",
        extensions: ["mseed"]
      },
      "application/vnd.fdsn.seed": {
        source: "iana",
        extensions: ["seed", "dataless"]
      },
      "application/vnd.fdsn.stationxml+xml": {
        source: "iana",
        charset: "XML-BASED",
        compressible: true
      },
      "application/vnd.ffsns": {
        source: "iana"
      },
      "application/vnd.ficlab.flb+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.filmit.zfc": {
        source: "iana"
      },
      "application/vnd.fints": {
        source: "iana"
      },
      "application/vnd.firemonkeys.cloudcell": {
        source: "iana"
      },
      "application/vnd.flographit": {
        source: "iana",
        extensions: ["gph"]
      },
      "application/vnd.fluxtime.clip": {
        source: "iana",
        extensions: ["ftc"]
      },
      "application/vnd.font-fontforge-sfd": {
        source: "iana"
      },
      "application/vnd.framemaker": {
        source: "iana",
        extensions: ["fm", "frame", "maker", "book"]
      },
      "application/vnd.freelog.comic": {
        source: "iana"
      },
      "application/vnd.frogans.fnc": {
        source: "apache",
        extensions: ["fnc"]
      },
      "application/vnd.frogans.ltf": {
        source: "apache",
        extensions: ["ltf"]
      },
      "application/vnd.fsc.weblaunch": {
        source: "iana",
        extensions: ["fsc"]
      },
      "application/vnd.fujifilm.fb.docuworks": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.binder": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.jfi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fujitsu.oasys": {
        source: "iana",
        extensions: ["oas"]
      },
      "application/vnd.fujitsu.oasys2": {
        source: "iana",
        extensions: ["oa2"]
      },
      "application/vnd.fujitsu.oasys3": {
        source: "iana",
        extensions: ["oa3"]
      },
      "application/vnd.fujitsu.oasysgp": {
        source: "iana",
        extensions: ["fg5"]
      },
      "application/vnd.fujitsu.oasysprs": {
        source: "iana",
        extensions: ["bh2"]
      },
      "application/vnd.fujixerox.art-ex": {
        source: "iana"
      },
      "application/vnd.fujixerox.art4": {
        source: "iana"
      },
      "application/vnd.fujixerox.ddd": {
        source: "iana",
        extensions: ["ddd"]
      },
      "application/vnd.fujixerox.docuworks": {
        source: "iana",
        extensions: ["xdw"]
      },
      "application/vnd.fujixerox.docuworks.binder": {
        source: "iana",
        extensions: ["xbd"]
      },
      "application/vnd.fujixerox.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujixerox.hbpl": {
        source: "iana"
      },
      "application/vnd.fut-misnet": {
        source: "iana"
      },
      "application/vnd.futoin+cbor": {
        source: "iana"
      },
      "application/vnd.futoin+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fuzzysheet": {
        source: "iana",
        extensions: ["fzs"]
      },
      "application/vnd.ga4gh.passport+jwt": {
        source: "iana"
      },
      "application/vnd.genomatix.tuxedo": {
        source: "iana",
        extensions: ["txd"]
      },
      "application/vnd.genozip": {
        source: "iana"
      },
      "application/vnd.gentics.grd+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gentoo.catmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gentoo.ebuild": {
        source: "iana"
      },
      "application/vnd.gentoo.eclass": {
        source: "iana"
      },
      "application/vnd.gentoo.gpkg": {
        source: "iana"
      },
      "application/vnd.gentoo.manifest": {
        source: "iana"
      },
      "application/vnd.gentoo.pkgmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gentoo.xpak": {
        source: "iana"
      },
      "application/vnd.geo+json": {
        source: "apache",
        compressible: true
      },
      "application/vnd.geocube+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.geogebra.file": {
        source: "iana",
        extensions: ["ggb"]
      },
      "application/vnd.geogebra.pinboard": {
        source: "iana"
      },
      "application/vnd.geogebra.slides": {
        source: "iana",
        extensions: ["ggs"]
      },
      "application/vnd.geogebra.tool": {
        source: "iana",
        extensions: ["ggt"]
      },
      "application/vnd.geometry-explorer": {
        source: "iana",
        extensions: ["gex", "gre"]
      },
      "application/vnd.geonext": {
        source: "iana",
        extensions: ["gxt"]
      },
      "application/vnd.geoplan": {
        source: "iana",
        extensions: ["g2w"]
      },
      "application/vnd.geospace": {
        source: "iana",
        extensions: ["g3w"]
      },
      "application/vnd.gerber": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt-response": {
        source: "iana"
      },
      "application/vnd.gmx": {
        source: "iana",
        extensions: ["gmx"]
      },
      "application/vnd.gnu.taler.exchange+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gnu.taler.merchant+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.google-apps.audio": {},
      "application/vnd.google-apps.document": {
        compressible: false,
        extensions: ["gdoc"]
      },
      "application/vnd.google-apps.drawing": {
        compressible: false,
        extensions: ["gdraw"]
      },
      "application/vnd.google-apps.drive-sdk": {
        compressible: false
      },
      "application/vnd.google-apps.file": {},
      "application/vnd.google-apps.folder": {
        compressible: false
      },
      "application/vnd.google-apps.form": {
        compressible: false,
        extensions: ["gform"]
      },
      "application/vnd.google-apps.fusiontable": {},
      "application/vnd.google-apps.jam": {
        compressible: false,
        extensions: ["gjam"]
      },
      "application/vnd.google-apps.mail-layout": {},
      "application/vnd.google-apps.map": {
        compressible: false,
        extensions: ["gmap"]
      },
      "application/vnd.google-apps.photo": {},
      "application/vnd.google-apps.presentation": {
        compressible: false,
        extensions: ["gslides"]
      },
      "application/vnd.google-apps.script": {
        compressible: false,
        extensions: ["gscript"]
      },
      "application/vnd.google-apps.shortcut": {},
      "application/vnd.google-apps.site": {
        compressible: false,
        extensions: ["gsite"]
      },
      "application/vnd.google-apps.spreadsheet": {
        compressible: false,
        extensions: ["gsheet"]
      },
      "application/vnd.google-apps.unknown": {},
      "application/vnd.google-apps.video": {},
      "application/vnd.google-earth.kml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["kml"]
      },
      "application/vnd.google-earth.kmz": {
        source: "iana",
        compressible: false,
        extensions: ["kmz"]
      },
      "application/vnd.gov.sk.e-form+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.gov.sk.e-form+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.gov.sk.xmldatacontainer+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdcf"]
      },
      "application/vnd.gpxsee.map+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.grafeq": {
        source: "iana",
        extensions: ["gqf", "gqs"]
      },
      "application/vnd.gridmp": {
        source: "iana"
      },
      "application/vnd.groove-account": {
        source: "iana",
        extensions: ["gac"]
      },
      "application/vnd.groove-help": {
        source: "iana",
        extensions: ["ghf"]
      },
      "application/vnd.groove-identity-message": {
        source: "iana",
        extensions: ["gim"]
      },
      "application/vnd.groove-injector": {
        source: "iana",
        extensions: ["grv"]
      },
      "application/vnd.groove-tool-message": {
        source: "iana",
        extensions: ["gtm"]
      },
      "application/vnd.groove-tool-template": {
        source: "iana",
        extensions: ["tpl"]
      },
      "application/vnd.groove-vcard": {
        source: "iana",
        extensions: ["vcg"]
      },
      "application/vnd.hal+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hal+xml": {
        source: "iana",
        compressible: true,
        extensions: ["hal"]
      },
      "application/vnd.handheld-entertainment+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zmm"]
      },
      "application/vnd.hbci": {
        source: "iana",
        extensions: ["hbci"]
      },
      "application/vnd.hc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hcl-bireports": {
        source: "iana"
      },
      "application/vnd.hdt": {
        source: "iana"
      },
      "application/vnd.heroku+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hhe.lesson-player": {
        source: "iana",
        extensions: ["les"]
      },
      "application/vnd.hp-hpgl": {
        source: "iana",
        extensions: ["hpgl"]
      },
      "application/vnd.hp-hpid": {
        source: "iana",
        extensions: ["hpid"]
      },
      "application/vnd.hp-hps": {
        source: "iana",
        extensions: ["hps"]
      },
      "application/vnd.hp-jlyt": {
        source: "iana",
        extensions: ["jlt"]
      },
      "application/vnd.hp-pcl": {
        source: "iana",
        extensions: ["pcl"]
      },
      "application/vnd.hp-pclxl": {
        source: "iana",
        extensions: ["pclxl"]
      },
      "application/vnd.hsl": {
        source: "iana"
      },
      "application/vnd.httphone": {
        source: "iana"
      },
      "application/vnd.hydrostatix.sof-data": {
        source: "iana",
        extensions: ["sfd-hdstx"]
      },
      "application/vnd.hyper+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyper-item+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyperdrive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hzn-3d-crossword": {
        source: "iana"
      },
      "application/vnd.ibm.afplinedata": {
        source: "apache"
      },
      "application/vnd.ibm.electronic-media": {
        source: "iana"
      },
      "application/vnd.ibm.minipay": {
        source: "iana",
        extensions: ["mpy"]
      },
      "application/vnd.ibm.modcap": {
        source: "apache",
        extensions: ["afp", "listafp", "list3820"]
      },
      "application/vnd.ibm.rights-management": {
        source: "iana",
        extensions: ["irm"]
      },
      "application/vnd.ibm.secure-container": {
        source: "iana",
        extensions: ["sc"]
      },
      "application/vnd.iccprofile": {
        source: "iana",
        extensions: ["icc", "icm"]
      },
      "application/vnd.ieee.1905": {
        source: "iana"
      },
      "application/vnd.igloader": {
        source: "iana",
        extensions: ["igl"]
      },
      "application/vnd.imagemeter.folder+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.imagemeter.image+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.immervision-ivp": {
        source: "iana",
        extensions: ["ivp"]
      },
      "application/vnd.immervision-ivu": {
        source: "iana",
        extensions: ["ivu"]
      },
      "application/vnd.ims.imsccv1p1": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p2": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p3": {
        source: "iana"
      },
      "application/vnd.ims.lis.v2.result+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy.id+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings.simple+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informedcontrol.rms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informix-visionary": {
        source: "apache"
      },
      "application/vnd.infotech.project": {
        source: "iana"
      },
      "application/vnd.infotech.project+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.innopath.wamp.notification": {
        source: "iana"
      },
      "application/vnd.insors.igm": {
        source: "iana",
        extensions: ["igm"]
      },
      "application/vnd.intercon.formnet": {
        source: "iana",
        extensions: ["xpw", "xpx"]
      },
      "application/vnd.intergeo": {
        source: "iana",
        extensions: ["i2g"]
      },
      "application/vnd.intertrust.digibox": {
        source: "iana"
      },
      "application/vnd.intertrust.nncp": {
        source: "iana"
      },
      "application/vnd.intu.qbo": {
        source: "iana",
        extensions: ["qbo"]
      },
      "application/vnd.intu.qfx": {
        source: "iana",
        extensions: ["qfx"]
      },
      "application/vnd.ipfs.ipns-record": {
        source: "iana"
      },
      "application/vnd.ipld.car": {
        source: "iana"
      },
      "application/vnd.ipld.dag-cbor": {
        source: "iana"
      },
      "application/vnd.ipld.dag-json": {
        source: "iana"
      },
      "application/vnd.ipld.raw": {
        source: "iana"
      },
      "application/vnd.iptc.g2.catalogitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.conceptitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.knowledgeitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.packageitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.planningitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ipunplugged.rcprofile": {
        source: "iana",
        extensions: ["rcprofile"]
      },
      "application/vnd.irepository.package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["irp"]
      },
      "application/vnd.is-xpr": {
        source: "iana",
        extensions: ["xpr"]
      },
      "application/vnd.isac.fcs": {
        source: "iana",
        extensions: ["fcs"]
      },
      "application/vnd.iso11783-10+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.jam": {
        source: "iana",
        extensions: ["jam"]
      },
      "application/vnd.japannet-directory-service": {
        source: "iana"
      },
      "application/vnd.japannet-jpnstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-payment-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-registration": {
        source: "iana"
      },
      "application/vnd.japannet-registration-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-setstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-verification": {
        source: "iana"
      },
      "application/vnd.japannet-verification-wakeup": {
        source: "iana"
      },
      "application/vnd.jcp.javame.midlet-rms": {
        source: "iana",
        extensions: ["rms"]
      },
      "application/vnd.jisp": {
        source: "iana",
        extensions: ["jisp"]
      },
      "application/vnd.joost.joda-archive": {
        source: "iana",
        extensions: ["joda"]
      },
      "application/vnd.jsk.isdn-ngn": {
        source: "iana"
      },
      "application/vnd.kahootz": {
        source: "iana",
        extensions: ["ktz", "ktr"]
      },
      "application/vnd.kde.karbon": {
        source: "iana",
        extensions: ["karbon"]
      },
      "application/vnd.kde.kchart": {
        source: "iana",
        extensions: ["chrt"]
      },
      "application/vnd.kde.kformula": {
        source: "iana",
        extensions: ["kfo"]
      },
      "application/vnd.kde.kivio": {
        source: "iana",
        extensions: ["flw"]
      },
      "application/vnd.kde.kontour": {
        source: "iana",
        extensions: ["kon"]
      },
      "application/vnd.kde.kpresenter": {
        source: "iana",
        extensions: ["kpr", "kpt"]
      },
      "application/vnd.kde.kspread": {
        source: "iana",
        extensions: ["ksp"]
      },
      "application/vnd.kde.kword": {
        source: "iana",
        extensions: ["kwd", "kwt"]
      },
      "application/vnd.kdl": {
        source: "iana"
      },
      "application/vnd.kenameaapp": {
        source: "iana",
        extensions: ["htke"]
      },
      "application/vnd.keyman.kmp+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.keyman.kmx": {
        source: "iana"
      },
      "application/vnd.kidspiration": {
        source: "iana",
        extensions: ["kia"]
      },
      "application/vnd.kinar": {
        source: "iana",
        extensions: ["kne", "knp"]
      },
      "application/vnd.koan": {
        source: "iana",
        extensions: ["skp", "skd", "skt", "skm"]
      },
      "application/vnd.kodak-descriptor": {
        source: "iana",
        extensions: ["sse"]
      },
      "application/vnd.las": {
        source: "iana"
      },
      "application/vnd.las.las+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.las.las+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lasxml"]
      },
      "application/vnd.laszip": {
        source: "iana"
      },
      "application/vnd.ldev.productlicensing": {
        source: "iana"
      },
      "application/vnd.leap+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.liberty-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.llamagraphics.life-balance.desktop": {
        source: "iana",
        extensions: ["lbd"]
      },
      "application/vnd.llamagraphics.life-balance.exchange+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lbe"]
      },
      "application/vnd.logipipe.circuit+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.loom": {
        source: "iana"
      },
      "application/vnd.lotus-1-2-3": {
        source: "iana",
        extensions: ["123"]
      },
      "application/vnd.lotus-approach": {
        source: "iana",
        extensions: ["apr"]
      },
      "application/vnd.lotus-freelance": {
        source: "iana",
        extensions: ["pre"]
      },
      "application/vnd.lotus-notes": {
        source: "iana",
        extensions: ["nsf"]
      },
      "application/vnd.lotus-organizer": {
        source: "iana",
        extensions: ["org"]
      },
      "application/vnd.lotus-screencam": {
        source: "iana",
        extensions: ["scm"]
      },
      "application/vnd.lotus-wordpro": {
        source: "iana",
        extensions: ["lwp"]
      },
      "application/vnd.macports.portpkg": {
        source: "iana",
        extensions: ["portpkg"]
      },
      "application/vnd.mapbox-vector-tile": {
        source: "iana",
        extensions: ["mvt"]
      },
      "application/vnd.marlin.drm.actiontoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.conftoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.license+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.mdcf": {
        source: "iana"
      },
      "application/vnd.mason+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.maxar.archive.3tz+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.maxmind.maxmind-db": {
        source: "iana"
      },
      "application/vnd.mcd": {
        source: "iana",
        extensions: ["mcd"]
      },
      "application/vnd.mdl": {
        source: "iana"
      },
      "application/vnd.mdl-mbsdf": {
        source: "iana"
      },
      "application/vnd.medcalcdata": {
        source: "iana",
        extensions: ["mc1"]
      },
      "application/vnd.mediastation.cdkey": {
        source: "iana",
        extensions: ["cdkey"]
      },
      "application/vnd.medicalholodeck.recordxr": {
        source: "iana"
      },
      "application/vnd.meridian-slingshot": {
        source: "iana"
      },
      "application/vnd.mermaid": {
        source: "iana"
      },
      "application/vnd.mfer": {
        source: "iana",
        extensions: ["mwf"]
      },
      "application/vnd.mfmp": {
        source: "iana",
        extensions: ["mfm"]
      },
      "application/vnd.micro+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.micrografx.flo": {
        source: "iana",
        extensions: ["flo"]
      },
      "application/vnd.micrografx.igx": {
        source: "iana",
        extensions: ["igx"]
      },
      "application/vnd.microsoft.portable-executable": {
        source: "iana"
      },
      "application/vnd.microsoft.windows.thumbnail-cache": {
        source: "iana"
      },
      "application/vnd.miele+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.mif": {
        source: "iana",
        extensions: ["mif"]
      },
      "application/vnd.minisoft-hp3000-save": {
        source: "iana"
      },
      "application/vnd.mitsubishi.misty-guard.trustweb": {
        source: "iana"
      },
      "application/vnd.mobius.daf": {
        source: "iana",
        extensions: ["daf"]
      },
      "application/vnd.mobius.dis": {
        source: "iana",
        extensions: ["dis"]
      },
      "application/vnd.mobius.mbk": {
        source: "iana",
        extensions: ["mbk"]
      },
      "application/vnd.mobius.mqy": {
        source: "iana",
        extensions: ["mqy"]
      },
      "application/vnd.mobius.msl": {
        source: "iana",
        extensions: ["msl"]
      },
      "application/vnd.mobius.plc": {
        source: "iana",
        extensions: ["plc"]
      },
      "application/vnd.mobius.txf": {
        source: "iana",
        extensions: ["txf"]
      },
      "application/vnd.modl": {
        source: "iana"
      },
      "application/vnd.mophun.application": {
        source: "iana",
        extensions: ["mpn"]
      },
      "application/vnd.mophun.certificate": {
        source: "iana",
        extensions: ["mpc"]
      },
      "application/vnd.motorola.flexsuite": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.adsi": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.fis": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.gotap": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.kmr": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.ttc": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.wem": {
        source: "iana"
      },
      "application/vnd.motorola.iprm": {
        source: "iana"
      },
      "application/vnd.mozilla.xul+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xul"]
      },
      "application/vnd.ms-3mfdocument": {
        source: "iana"
      },
      "application/vnd.ms-artgalry": {
        source: "iana",
        extensions: ["cil"]
      },
      "application/vnd.ms-asf": {
        source: "iana"
      },
      "application/vnd.ms-cab-compressed": {
        source: "iana",
        extensions: ["cab"]
      },
      "application/vnd.ms-color.iccprofile": {
        source: "apache"
      },
      "application/vnd.ms-excel": {
        source: "iana",
        compressible: false,
        extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
      },
      "application/vnd.ms-excel.addin.macroenabled.12": {
        source: "iana",
        extensions: ["xlam"]
      },
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        source: "iana",
        extensions: ["xlsb"]
      },
      "application/vnd.ms-excel.sheet.macroenabled.12": {
        source: "iana",
        extensions: ["xlsm"]
      },
      "application/vnd.ms-excel.template.macroenabled.12": {
        source: "iana",
        extensions: ["xltm"]
      },
      "application/vnd.ms-fontobject": {
        source: "iana",
        compressible: true,
        extensions: ["eot"]
      },
      "application/vnd.ms-htmlhelp": {
        source: "iana",
        extensions: ["chm"]
      },
      "application/vnd.ms-ims": {
        source: "iana",
        extensions: ["ims"]
      },
      "application/vnd.ms-lrm": {
        source: "iana",
        extensions: ["lrm"]
      },
      "application/vnd.ms-office.activex+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-officetheme": {
        source: "iana",
        extensions: ["thmx"]
      },
      "application/vnd.ms-opentype": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-outlook": {
        compressible: false,
        extensions: ["msg"]
      },
      "application/vnd.ms-package.obfuscated-opentype": {
        source: "apache"
      },
      "application/vnd.ms-pki.seccat": {
        source: "apache",
        extensions: ["cat"]
      },
      "application/vnd.ms-pki.stl": {
        source: "apache",
        extensions: ["stl"]
      },
      "application/vnd.ms-playready.initiator+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-powerpoint": {
        source: "iana",
        compressible: false,
        extensions: ["ppt", "pps", "pot"]
      },
      "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        source: "iana",
        extensions: ["ppam"]
      },
      "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        source: "iana",
        extensions: ["pptm"]
      },
      "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        source: "iana",
        extensions: ["sldm"]
      },
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        source: "iana",
        extensions: ["ppsm"]
      },
      "application/vnd.ms-powerpoint.template.macroenabled.12": {
        source: "iana",
        extensions: ["potm"]
      },
      "application/vnd.ms-printdevicecapabilities+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-printing.printticket+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-printschematicket+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-project": {
        source: "iana",
        extensions: ["mpp", "mpt"]
      },
      "application/vnd.ms-tnef": {
        source: "iana"
      },
      "application/vnd.ms-visio.viewer": {
        extensions: ["vdx"]
      },
      "application/vnd.ms-windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.nwprinting.oob": {
        source: "iana"
      },
      "application/vnd.ms-windows.printerpairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.wsd.oob": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-resp": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-resp": {
        source: "iana"
      },
      "application/vnd.ms-word.document.macroenabled.12": {
        source: "iana",
        extensions: ["docm"]
      },
      "application/vnd.ms-word.template.macroenabled.12": {
        source: "iana",
        extensions: ["dotm"]
      },
      "application/vnd.ms-works": {
        source: "iana",
        extensions: ["wps", "wks", "wcm", "wdb"]
      },
      "application/vnd.ms-wpl": {
        source: "iana",
        extensions: ["wpl"]
      },
      "application/vnd.ms-xpsdocument": {
        source: "iana",
        compressible: false,
        extensions: ["xps"]
      },
      "application/vnd.msa-disk-image": {
        source: "iana"
      },
      "application/vnd.mseq": {
        source: "iana",
        extensions: ["mseq"]
      },
      "application/vnd.msgpack": {
        source: "iana"
      },
      "application/vnd.msign": {
        source: "iana"
      },
      "application/vnd.multiad.creator": {
        source: "iana"
      },
      "application/vnd.multiad.creator.cif": {
        source: "iana"
      },
      "application/vnd.music-niff": {
        source: "iana"
      },
      "application/vnd.musician": {
        source: "iana",
        extensions: ["mus"]
      },
      "application/vnd.muvee.style": {
        source: "iana",
        extensions: ["msty"]
      },
      "application/vnd.mynfc": {
        source: "iana",
        extensions: ["taglet"]
      },
      "application/vnd.nacamar.ybrid+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nato.bindingdataobject+cbor": {
        source: "iana"
      },
      "application/vnd.nato.bindingdataobject+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nato.bindingdataobject+xml": {
        source: "iana",
        compressible: true,
        extensions: ["bdo"]
      },
      "application/vnd.nato.openxmlformats-package.iepd+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.ncd.control": {
        source: "iana"
      },
      "application/vnd.ncd.reference": {
        source: "iana"
      },
      "application/vnd.nearst.inv+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nebumind.line": {
        source: "iana"
      },
      "application/vnd.nervana": {
        source: "iana"
      },
      "application/vnd.netfpx": {
        source: "iana"
      },
      "application/vnd.neurolanguage.nlu": {
        source: "iana",
        extensions: ["nlu"]
      },
      "application/vnd.nimn": {
        source: "iana"
      },
      "application/vnd.nintendo.nitro.rom": {
        source: "iana"
      },
      "application/vnd.nintendo.snes.rom": {
        source: "iana"
      },
      "application/vnd.nitf": {
        source: "iana",
        extensions: ["ntf", "nitf"]
      },
      "application/vnd.noblenet-directory": {
        source: "iana",
        extensions: ["nnd"]
      },
      "application/vnd.noblenet-sealer": {
        source: "iana",
        extensions: ["nns"]
      },
      "application/vnd.noblenet-web": {
        source: "iana",
        extensions: ["nnw"]
      },
      "application/vnd.nokia.catalogs": {
        source: "iana"
      },
      "application/vnd.nokia.conml+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.conml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.iptv.config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.isds-radio-presets": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.landmarkcollection+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.n-gage.ac+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ac"]
      },
      "application/vnd.nokia.n-gage.data": {
        source: "iana",
        extensions: ["ngdat"]
      },
      "application/vnd.nokia.n-gage.symbian.install": {
        source: "apache",
        extensions: ["n-gage"]
      },
      "application/vnd.nokia.ncd": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.radio-preset": {
        source: "iana",
        extensions: ["rpst"]
      },
      "application/vnd.nokia.radio-presets": {
        source: "iana",
        extensions: ["rpss"]
      },
      "application/vnd.novadigm.edm": {
        source: "iana",
        extensions: ["edm"]
      },
      "application/vnd.novadigm.edx": {
        source: "iana",
        extensions: ["edx"]
      },
      "application/vnd.novadigm.ext": {
        source: "iana",
        extensions: ["ext"]
      },
      "application/vnd.ntt-local.content-share": {
        source: "iana"
      },
      "application/vnd.ntt-local.file-transfer": {
        source: "iana"
      },
      "application/vnd.ntt-local.ogw_remote-access": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_remote": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_tcp_stream": {
        source: "iana"
      },
      "application/vnd.oai.workflows": {
        source: "iana"
      },
      "application/vnd.oai.workflows+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oai.workflows+yaml": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.base": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.chart": {
        source: "iana",
        extensions: ["odc"]
      },
      "application/vnd.oasis.opendocument.chart-template": {
        source: "iana",
        extensions: ["otc"]
      },
      "application/vnd.oasis.opendocument.database": {
        source: "apache",
        extensions: ["odb"]
      },
      "application/vnd.oasis.opendocument.formula": {
        source: "iana",
        extensions: ["odf"]
      },
      "application/vnd.oasis.opendocument.formula-template": {
        source: "iana",
        extensions: ["odft"]
      },
      "application/vnd.oasis.opendocument.graphics": {
        source: "iana",
        compressible: false,
        extensions: ["odg"]
      },
      "application/vnd.oasis.opendocument.graphics-template": {
        source: "iana",
        extensions: ["otg"]
      },
      "application/vnd.oasis.opendocument.image": {
        source: "iana",
        extensions: ["odi"]
      },
      "application/vnd.oasis.opendocument.image-template": {
        source: "iana",
        extensions: ["oti"]
      },
      "application/vnd.oasis.opendocument.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["odp"]
      },
      "application/vnd.oasis.opendocument.presentation-template": {
        source: "iana",
        extensions: ["otp"]
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        source: "iana",
        compressible: false,
        extensions: ["ods"]
      },
      "application/vnd.oasis.opendocument.spreadsheet-template": {
        source: "iana",
        extensions: ["ots"]
      },
      "application/vnd.oasis.opendocument.text": {
        source: "iana",
        compressible: false,
        extensions: ["odt"]
      },
      "application/vnd.oasis.opendocument.text-master": {
        source: "iana",
        extensions: ["odm"]
      },
      "application/vnd.oasis.opendocument.text-master-template": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.text-template": {
        source: "iana",
        extensions: ["ott"]
      },
      "application/vnd.oasis.opendocument.text-web": {
        source: "iana",
        extensions: ["oth"]
      },
      "application/vnd.obn": {
        source: "iana"
      },
      "application/vnd.ocf+cbor": {
        source: "iana"
      },
      "application/vnd.oci.image.manifest.v1+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oftn.l10n+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessdownload+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessstreaming+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.cspg-hexbinary": {
        source: "iana"
      },
      "application/vnd.oipf.dae.svg+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.dae.xhtml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.mippvcontrolmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.pae.gem": {
        source: "iana"
      },
      "application/vnd.oipf.spdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.spdlist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.ueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.userprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.olpc-sugar": {
        source: "iana",
        extensions: ["xo"]
      },
      "application/vnd.oma-scws-config": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-request": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-response": {
        source: "iana"
      },
      "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.drm-trigger+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.oma.bcast.imd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.ltkm": {
        source: "iana"
      },
      "application/vnd.oma.bcast.notification+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.provisioningtrigger": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgboot": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgdd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sgdu": {
        source: "iana"
      },
      "application/vnd.oma.bcast.simple-symbol-container": {
        source: "iana"
      },
      "application/vnd.oma.bcast.smartcard-trigger+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.oma.bcast.sprov+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.stkm": {
        source: "iana"
      },
      "application/vnd.oma.cab-address-book+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-feature-handler+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-pcc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-subs-invite+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-user-prefs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.dcd": {
        source: "iana"
      },
      "application/vnd.oma.dcdc": {
        source: "iana"
      },
      "application/vnd.oma.dd2+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dd2"]
      },
      "application/vnd.oma.drm.risd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.group-usage-list+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+cbor": {
        source: "iana"
      },
      "application/vnd.oma.lwm2m+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+tlv": {
        source: "iana"
      },
      "application/vnd.oma.pal+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.detailed-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.final-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.groups+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.invocation-descriptor+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.optimized-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.push": {
        source: "iana"
      },
      "application/vnd.oma.scidm.messages+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.xcap-directory+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.omads-email+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-file+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-folder+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omaloc-supl-init": {
        source: "iana"
      },
      "application/vnd.onepager": {
        source: "iana"
      },
      "application/vnd.onepagertamp": {
        source: "iana"
      },
      "application/vnd.onepagertamx": {
        source: "iana"
      },
      "application/vnd.onepagertat": {
        source: "iana"
      },
      "application/vnd.onepagertatp": {
        source: "iana"
      },
      "application/vnd.onepagertatx": {
        source: "iana"
      },
      "application/vnd.onvif.metadata": {
        source: "iana"
      },
      "application/vnd.openblox.game+xml": {
        source: "iana",
        compressible: true,
        extensions: ["obgx"]
      },
      "application/vnd.openblox.game-binary": {
        source: "iana"
      },
      "application/vnd.openeye.oeb": {
        source: "iana"
      },
      "application/vnd.openofficeorg.extension": {
        source: "apache",
        extensions: ["oxt"]
      },
      "application/vnd.openstreetmap.data+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osm"]
      },
      "application/vnd.opentimestamps.ots": {
        source: "iana"
      },
      "application/vnd.openvpi.dspx+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawing+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["pptx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        source: "iana",
        extensions: ["sldx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        source: "iana",
        extensions: ["ppsx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template": {
        source: "iana",
        extensions: ["potx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        source: "iana",
        compressible: false,
        extensions: ["xlsx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        source: "iana",
        extensions: ["xltx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.theme+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.vmldrawing": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        source: "iana",
        compressible: false,
        extensions: ["docx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        source: "iana",
        extensions: ["dotx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.core-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.relationships+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oracle.resource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.orange.indata": {
        source: "iana"
      },
      "application/vnd.osa.netdeploy": {
        source: "iana"
      },
      "application/vnd.osgeo.mapguide.package": {
        source: "iana",
        extensions: ["mgp"]
      },
      "application/vnd.osgi.bundle": {
        source: "iana"
      },
      "application/vnd.osgi.dp": {
        source: "iana",
        extensions: ["dp"]
      },
      "application/vnd.osgi.subsystem": {
        source: "iana",
        extensions: ["esa"]
      },
      "application/vnd.otps.ct-kip+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oxli.countgraph": {
        source: "iana"
      },
      "application/vnd.pagerduty+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.palm": {
        source: "iana",
        extensions: ["pdb", "pqa", "oprc"]
      },
      "application/vnd.panoply": {
        source: "iana"
      },
      "application/vnd.paos.xml": {
        source: "iana"
      },
      "application/vnd.patentdive": {
        source: "iana"
      },
      "application/vnd.patientecommsdoc": {
        source: "iana"
      },
      "application/vnd.pawaafile": {
        source: "iana",
        extensions: ["paw"]
      },
      "application/vnd.pcos": {
        source: "iana"
      },
      "application/vnd.pg.format": {
        source: "iana",
        extensions: ["str"]
      },
      "application/vnd.pg.osasli": {
        source: "iana",
        extensions: ["ei6"]
      },
      "application/vnd.piaccess.application-licence": {
        source: "iana"
      },
      "application/vnd.picsel": {
        source: "iana",
        extensions: ["efif"]
      },
      "application/vnd.pmi.widget": {
        source: "iana",
        extensions: ["wg"]
      },
      "application/vnd.poc.group-advertisement+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.pocketlearn": {
        source: "iana",
        extensions: ["plf"]
      },
      "application/vnd.powerbuilder6": {
        source: "iana",
        extensions: ["pbd"]
      },
      "application/vnd.powerbuilder6-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder7": {
        source: "iana"
      },
      "application/vnd.powerbuilder7-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder75": {
        source: "iana"
      },
      "application/vnd.powerbuilder75-s": {
        source: "iana"
      },
      "application/vnd.preminet": {
        source: "iana"
      },
      "application/vnd.previewsystems.box": {
        source: "iana",
        extensions: ["box"]
      },
      "application/vnd.procrate.brushset": {
        extensions: ["brushset"]
      },
      "application/vnd.procreate.brush": {
        extensions: ["brush"]
      },
      "application/vnd.procreate.dream": {
        extensions: ["drm"]
      },
      "application/vnd.proteus.magazine": {
        source: "iana",
        extensions: ["mgz"]
      },
      "application/vnd.psfs": {
        source: "iana"
      },
      "application/vnd.pt.mundusmundi": {
        source: "iana"
      },
      "application/vnd.publishare-delta-tree": {
        source: "iana",
        extensions: ["qps"]
      },
      "application/vnd.pvi.ptid1": {
        source: "iana",
        extensions: ["ptid"]
      },
      "application/vnd.pwg-multiplexed": {
        source: "iana"
      },
      "application/vnd.pwg-xhtml-print+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xhtm"]
      },
      "application/vnd.qualcomm.brew-app-res": {
        source: "iana"
      },
      "application/vnd.quarantainenet": {
        source: "iana"
      },
      "application/vnd.quark.quarkxpress": {
        source: "iana",
        extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
      },
      "application/vnd.quobject-quoxdocument": {
        source: "iana"
      },
      "application/vnd.radisys.moml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-stream+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-base+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-detect+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-group+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-speech+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-transform+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rainstor.data": {
        source: "iana"
      },
      "application/vnd.rapid": {
        source: "iana"
      },
      "application/vnd.rar": {
        source: "iana",
        extensions: ["rar"]
      },
      "application/vnd.realvnc.bed": {
        source: "iana",
        extensions: ["bed"]
      },
      "application/vnd.recordare.musicxml": {
        source: "iana",
        extensions: ["mxl"]
      },
      "application/vnd.recordare.musicxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musicxml"]
      },
      "application/vnd.relpipe": {
        source: "iana"
      },
      "application/vnd.renlearn.rlprint": {
        source: "iana"
      },
      "application/vnd.resilient.logic": {
        source: "iana"
      },
      "application/vnd.restful+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rig.cryptonote": {
        source: "iana",
        extensions: ["cryptonote"]
      },
      "application/vnd.rim.cod": {
        source: "apache",
        extensions: ["cod"]
      },
      "application/vnd.rn-realmedia": {
        source: "apache",
        extensions: ["rm"]
      },
      "application/vnd.rn-realmedia-vbr": {
        source: "apache",
        extensions: ["rmvb"]
      },
      "application/vnd.route66.link66+xml": {
        source: "iana",
        compressible: true,
        extensions: ["link66"]
      },
      "application/vnd.rs-274x": {
        source: "iana"
      },
      "application/vnd.ruckus.download": {
        source: "iana"
      },
      "application/vnd.s3sms": {
        source: "iana"
      },
      "application/vnd.sailingtracker.track": {
        source: "iana",
        extensions: ["st"]
      },
      "application/vnd.sar": {
        source: "iana"
      },
      "application/vnd.sbm.cid": {
        source: "iana"
      },
      "application/vnd.sbm.mid2": {
        source: "iana"
      },
      "application/vnd.scribus": {
        source: "iana"
      },
      "application/vnd.sealed.3df": {
        source: "iana"
      },
      "application/vnd.sealed.csf": {
        source: "iana"
      },
      "application/vnd.sealed.doc": {
        source: "iana"
      },
      "application/vnd.sealed.eml": {
        source: "iana"
      },
      "application/vnd.sealed.mht": {
        source: "iana"
      },
      "application/vnd.sealed.net": {
        source: "iana"
      },
      "application/vnd.sealed.ppt": {
        source: "iana"
      },
      "application/vnd.sealed.tiff": {
        source: "iana"
      },
      "application/vnd.sealed.xls": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.html": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.pdf": {
        source: "iana"
      },
      "application/vnd.seemail": {
        source: "iana",
        extensions: ["see"]
      },
      "application/vnd.seis+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.sema": {
        source: "iana",
        extensions: ["sema"]
      },
      "application/vnd.semd": {
        source: "iana",
        extensions: ["semd"]
      },
      "application/vnd.semf": {
        source: "iana",
        extensions: ["semf"]
      },
      "application/vnd.shade-save-file": {
        source: "iana"
      },
      "application/vnd.shana.informed.formdata": {
        source: "iana",
        extensions: ["ifm"]
      },
      "application/vnd.shana.informed.formtemplate": {
        source: "iana",
        extensions: ["itp"]
      },
      "application/vnd.shana.informed.interchange": {
        source: "iana",
        extensions: ["iif"]
      },
      "application/vnd.shana.informed.package": {
        source: "iana",
        extensions: ["ipk"]
      },
      "application/vnd.shootproof+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shopkick+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shp": {
        source: "iana"
      },
      "application/vnd.shx": {
        source: "iana"
      },
      "application/vnd.sigrok.session": {
        source: "iana"
      },
      "application/vnd.simtech-mindmapper": {
        source: "iana",
        extensions: ["twd", "twds"]
      },
      "application/vnd.siren+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.sketchometry": {
        source: "iana"
      },
      "application/vnd.smaf": {
        source: "iana",
        extensions: ["mmf"]
      },
      "application/vnd.smart.notebook": {
        source: "iana"
      },
      "application/vnd.smart.teacher": {
        source: "iana",
        extensions: ["teacher"]
      },
      "application/vnd.smintio.portals.archive": {
        source: "iana"
      },
      "application/vnd.snesdev-page-table": {
        source: "iana"
      },
      "application/vnd.software602.filler.form+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fo"]
      },
      "application/vnd.software602.filler.form-xml-zip": {
        source: "iana"
      },
      "application/vnd.solent.sdkm+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sdkm", "sdkd"]
      },
      "application/vnd.spotfire.dxp": {
        source: "iana",
        extensions: ["dxp"]
      },
      "application/vnd.spotfire.sfs": {
        source: "iana",
        extensions: ["sfs"]
      },
      "application/vnd.sqlite3": {
        source: "iana"
      },
      "application/vnd.sss-cod": {
        source: "iana"
      },
      "application/vnd.sss-dtf": {
        source: "iana"
      },
      "application/vnd.sss-ntf": {
        source: "iana"
      },
      "application/vnd.stardivision.calc": {
        source: "apache",
        extensions: ["sdc"]
      },
      "application/vnd.stardivision.draw": {
        source: "apache",
        extensions: ["sda"]
      },
      "application/vnd.stardivision.impress": {
        source: "apache",
        extensions: ["sdd"]
      },
      "application/vnd.stardivision.math": {
        source: "apache",
        extensions: ["smf"]
      },
      "application/vnd.stardivision.writer": {
        source: "apache",
        extensions: ["sdw", "vor"]
      },
      "application/vnd.stardivision.writer-global": {
        source: "apache",
        extensions: ["sgl"]
      },
      "application/vnd.stepmania.package": {
        source: "iana",
        extensions: ["smzip"]
      },
      "application/vnd.stepmania.stepchart": {
        source: "iana",
        extensions: ["sm"]
      },
      "application/vnd.street-stream": {
        source: "iana"
      },
      "application/vnd.sun.wadl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wadl"]
      },
      "application/vnd.sun.xml.calc": {
        source: "apache",
        extensions: ["sxc"]
      },
      "application/vnd.sun.xml.calc.template": {
        source: "apache",
        extensions: ["stc"]
      },
      "application/vnd.sun.xml.draw": {
        source: "apache",
        extensions: ["sxd"]
      },
      "application/vnd.sun.xml.draw.template": {
        source: "apache",
        extensions: ["std"]
      },
      "application/vnd.sun.xml.impress": {
        source: "apache",
        extensions: ["sxi"]
      },
      "application/vnd.sun.xml.impress.template": {
        source: "apache",
        extensions: ["sti"]
      },
      "application/vnd.sun.xml.math": {
        source: "apache",
        extensions: ["sxm"]
      },
      "application/vnd.sun.xml.writer": {
        source: "apache",
        extensions: ["sxw"]
      },
      "application/vnd.sun.xml.writer.global": {
        source: "apache",
        extensions: ["sxg"]
      },
      "application/vnd.sun.xml.writer.template": {
        source: "apache",
        extensions: ["stw"]
      },
      "application/vnd.sus-calendar": {
        source: "iana",
        extensions: ["sus", "susp"]
      },
      "application/vnd.svd": {
        source: "iana",
        extensions: ["svd"]
      },
      "application/vnd.swiftview-ics": {
        source: "iana"
      },
      "application/vnd.sybyl.mol2": {
        source: "iana"
      },
      "application/vnd.sycle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.syft+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.symbian.install": {
        source: "apache",
        extensions: ["sis", "sisx"]
      },
      "application/vnd.syncml+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xsm"]
      },
      "application/vnd.syncml.dm+wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["bdm"]
      },
      "application/vnd.syncml.dm+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xdm"]
      },
      "application/vnd.syncml.dm.notification": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["ddf"]
      },
      "application/vnd.syncml.dmtnds+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmtnds+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.syncml.ds.notification": {
        source: "iana"
      },
      "application/vnd.tableschema+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tao.intent-module-archive": {
        source: "iana",
        extensions: ["tao"]
      },
      "application/vnd.tcpdump.pcap": {
        source: "iana",
        extensions: ["pcap", "cap", "dmp"]
      },
      "application/vnd.think-cell.ppttc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tmd.mediaflex.api+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tml": {
        source: "iana"
      },
      "application/vnd.tmobile-livetv": {
        source: "iana",
        extensions: ["tmo"]
      },
      "application/vnd.tri.onesource": {
        source: "iana"
      },
      "application/vnd.trid.tpt": {
        source: "iana",
        extensions: ["tpt"]
      },
      "application/vnd.triscape.mxs": {
        source: "iana",
        extensions: ["mxs"]
      },
      "application/vnd.trueapp": {
        source: "iana",
        extensions: ["tra"]
      },
      "application/vnd.truedoc": {
        source: "iana"
      },
      "application/vnd.ubisoft.webplayer": {
        source: "iana"
      },
      "application/vnd.ufdl": {
        source: "iana",
        extensions: ["ufd", "ufdl"]
      },
      "application/vnd.uic.osdm+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.uiq.theme": {
        source: "iana",
        extensions: ["utz"]
      },
      "application/vnd.umajin": {
        source: "iana",
        extensions: ["umj"]
      },
      "application/vnd.unity": {
        source: "iana",
        extensions: ["unityweb"]
      },
      "application/vnd.uoml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uoml", "uo"]
      },
      "application/vnd.uplanet.alert": {
        source: "iana"
      },
      "application/vnd.uplanet.alert-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.channel": {
        source: "iana"
      },
      "application/vnd.uplanet.channel-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.list": {
        source: "iana"
      },
      "application/vnd.uplanet.list-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.signal": {
        source: "iana"
      },
      "application/vnd.uri-map": {
        source: "iana"
      },
      "application/vnd.valve.source.material": {
        source: "iana"
      },
      "application/vnd.vcx": {
        source: "iana",
        extensions: ["vcx"]
      },
      "application/vnd.vd-study": {
        source: "iana"
      },
      "application/vnd.vectorworks": {
        source: "iana"
      },
      "application/vnd.vel+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.veraison.tsm-report+cbor": {
        source: "iana"
      },
      "application/vnd.veraison.tsm-report+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.verimatrix.vcas": {
        source: "iana"
      },
      "application/vnd.veritone.aion+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.veryant.thin": {
        source: "iana"
      },
      "application/vnd.ves.encrypted": {
        source: "iana"
      },
      "application/vnd.vidsoft.vidconference": {
        source: "iana"
      },
      "application/vnd.visio": {
        source: "iana",
        extensions: ["vsd", "vst", "vss", "vsw", "vsdx", "vtx"]
      },
      "application/vnd.visionary": {
        source: "iana",
        extensions: ["vis"]
      },
      "application/vnd.vividence.scriptfile": {
        source: "iana"
      },
      "application/vnd.vocalshaper.vsp4": {
        source: "iana"
      },
      "application/vnd.vsf": {
        source: "iana",
        extensions: ["vsf"]
      },
      "application/vnd.wap.sic": {
        source: "iana"
      },
      "application/vnd.wap.slc": {
        source: "iana"
      },
      "application/vnd.wap.wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["wbxml"]
      },
      "application/vnd.wap.wmlc": {
        source: "iana",
        extensions: ["wmlc"]
      },
      "application/vnd.wap.wmlscriptc": {
        source: "iana",
        extensions: ["wmlsc"]
      },
      "application/vnd.wasmflow.wafl": {
        source: "iana"
      },
      "application/vnd.webturbo": {
        source: "iana",
        extensions: ["wtb"]
      },
      "application/vnd.wfa.dpp": {
        source: "iana"
      },
      "application/vnd.wfa.p2p": {
        source: "iana"
      },
      "application/vnd.wfa.wsc": {
        source: "iana"
      },
      "application/vnd.windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.wmc": {
        source: "iana"
      },
      "application/vnd.wmf.bootstrap": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica.package": {
        source: "iana"
      },
      "application/vnd.wolfram.player": {
        source: "iana",
        extensions: ["nbp"]
      },
      "application/vnd.wordlift": {
        source: "iana"
      },
      "application/vnd.wordperfect": {
        source: "iana",
        extensions: ["wpd"]
      },
      "application/vnd.wqd": {
        source: "iana",
        extensions: ["wqd"]
      },
      "application/vnd.wrq-hp3000-labelled": {
        source: "iana"
      },
      "application/vnd.wt.stf": {
        source: "iana",
        extensions: ["stf"]
      },
      "application/vnd.wv.csp+wbxml": {
        source: "iana"
      },
      "application/vnd.wv.csp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.wv.ssp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xacml+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xara": {
        source: "iana",
        extensions: ["xar"]
      },
      "application/vnd.xarin.cpj": {
        source: "iana"
      },
      "application/vnd.xecrets-encrypted": {
        source: "iana"
      },
      "application/vnd.xfdl": {
        source: "iana",
        extensions: ["xfdl"]
      },
      "application/vnd.xfdl.webform": {
        source: "iana"
      },
      "application/vnd.xmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xmpie.cpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.dpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.plan": {
        source: "iana"
      },
      "application/vnd.xmpie.ppkg": {
        source: "iana"
      },
      "application/vnd.xmpie.xlim": {
        source: "iana"
      },
      "application/vnd.yamaha.hv-dic": {
        source: "iana",
        extensions: ["hvd"]
      },
      "application/vnd.yamaha.hv-script": {
        source: "iana",
        extensions: ["hvs"]
      },
      "application/vnd.yamaha.hv-voice": {
        source: "iana",
        extensions: ["hvp"]
      },
      "application/vnd.yamaha.openscoreformat": {
        source: "iana",
        extensions: ["osf"]
      },
      "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osfpvg"]
      },
      "application/vnd.yamaha.remote-setup": {
        source: "iana"
      },
      "application/vnd.yamaha.smaf-audio": {
        source: "iana",
        extensions: ["saf"]
      },
      "application/vnd.yamaha.smaf-phrase": {
        source: "iana",
        extensions: ["spf"]
      },
      "application/vnd.yamaha.through-ngn": {
        source: "iana"
      },
      "application/vnd.yamaha.tunnel-udpencap": {
        source: "iana"
      },
      "application/vnd.yaoweme": {
        source: "iana"
      },
      "application/vnd.yellowriver-custom-menu": {
        source: "iana",
        extensions: ["cmp"]
      },
      "application/vnd.zul": {
        source: "iana",
        extensions: ["zir", "zirz"]
      },
      "application/vnd.zzazz.deck+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zaz"]
      },
      "application/voicexml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["vxml"]
      },
      "application/voucher-cms+json": {
        source: "iana",
        compressible: true
      },
      "application/voucher-jws+json": {
        source: "iana",
        compressible: true
      },
      "application/vp": {
        source: "iana"
      },
      "application/vp+cose": {
        source: "iana"
      },
      "application/vp+jwt": {
        source: "iana"
      },
      "application/vq-rtcpxr": {
        source: "iana"
      },
      "application/wasm": {
        source: "iana",
        compressible: true,
        extensions: ["wasm"]
      },
      "application/watcherinfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wif"]
      },
      "application/webpush-options+json": {
        source: "iana",
        compressible: true
      },
      "application/whoispp-query": {
        source: "iana"
      },
      "application/whoispp-response": {
        source: "iana"
      },
      "application/widget": {
        source: "iana",
        extensions: ["wgt"]
      },
      "application/winhlp": {
        source: "apache",
        extensions: ["hlp"]
      },
      "application/wita": {
        source: "iana"
      },
      "application/wordperfect5.1": {
        source: "iana"
      },
      "application/wsdl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wsdl"]
      },
      "application/wspolicy+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wspolicy"]
      },
      "application/x-7z-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["7z"]
      },
      "application/x-abiword": {
        source: "apache",
        extensions: ["abw"]
      },
      "application/x-ace-compressed": {
        source: "apache",
        extensions: ["ace"]
      },
      "application/x-amf": {
        source: "apache"
      },
      "application/x-apple-diskimage": {
        source: "apache",
        extensions: ["dmg"]
      },
      "application/x-arj": {
        compressible: false,
        extensions: ["arj"]
      },
      "application/x-authorware-bin": {
        source: "apache",
        extensions: ["aab", "x32", "u32", "vox"]
      },
      "application/x-authorware-map": {
        source: "apache",
        extensions: ["aam"]
      },
      "application/x-authorware-seg": {
        source: "apache",
        extensions: ["aas"]
      },
      "application/x-bcpio": {
        source: "apache",
        extensions: ["bcpio"]
      },
      "application/x-bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/x-bittorrent": {
        source: "apache",
        extensions: ["torrent"]
      },
      "application/x-blender": {
        extensions: ["blend"]
      },
      "application/x-blorb": {
        source: "apache",
        extensions: ["blb", "blorb"]
      },
      "application/x-bzip": {
        source: "apache",
        compressible: false,
        extensions: ["bz"]
      },
      "application/x-bzip2": {
        source: "apache",
        compressible: false,
        extensions: ["bz2", "boz"]
      },
      "application/x-cbr": {
        source: "apache",
        extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
      },
      "application/x-cdlink": {
        source: "apache",
        extensions: ["vcd"]
      },
      "application/x-cfs-compressed": {
        source: "apache",
        extensions: ["cfs"]
      },
      "application/x-chat": {
        source: "apache",
        extensions: ["chat"]
      },
      "application/x-chess-pgn": {
        source: "apache",
        extensions: ["pgn"]
      },
      "application/x-chrome-extension": {
        extensions: ["crx"]
      },
      "application/x-cocoa": {
        source: "nginx",
        extensions: ["cco"]
      },
      "application/x-compress": {
        source: "apache"
      },
      "application/x-compressed": {
        extensions: ["rar"]
      },
      "application/x-conference": {
        source: "apache",
        extensions: ["nsc"]
      },
      "application/x-cpio": {
        source: "apache",
        extensions: ["cpio"]
      },
      "application/x-csh": {
        source: "apache",
        extensions: ["csh"]
      },
      "application/x-deb": {
        compressible: false
      },
      "application/x-debian-package": {
        source: "apache",
        extensions: ["deb", "udeb"]
      },
      "application/x-dgc-compressed": {
        source: "apache",
        extensions: ["dgc"]
      },
      "application/x-director": {
        source: "apache",
        extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
      },
      "application/x-doom": {
        source: "apache",
        extensions: ["wad"]
      },
      "application/x-dtbncx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ncx"]
      },
      "application/x-dtbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dtb"]
      },
      "application/x-dtbresource+xml": {
        source: "apache",
        compressible: true,
        extensions: ["res"]
      },
      "application/x-dvi": {
        source: "apache",
        compressible: false,
        extensions: ["dvi"]
      },
      "application/x-envoy": {
        source: "apache",
        extensions: ["evy"]
      },
      "application/x-eva": {
        source: "apache",
        extensions: ["eva"]
      },
      "application/x-font-bdf": {
        source: "apache",
        extensions: ["bdf"]
      },
      "application/x-font-dos": {
        source: "apache"
      },
      "application/x-font-framemaker": {
        source: "apache"
      },
      "application/x-font-ghostscript": {
        source: "apache",
        extensions: ["gsf"]
      },
      "application/x-font-libgrx": {
        source: "apache"
      },
      "application/x-font-linux-psf": {
        source: "apache",
        extensions: ["psf"]
      },
      "application/x-font-pcf": {
        source: "apache",
        extensions: ["pcf"]
      },
      "application/x-font-snf": {
        source: "apache",
        extensions: ["snf"]
      },
      "application/x-font-speedo": {
        source: "apache"
      },
      "application/x-font-sunos-news": {
        source: "apache"
      },
      "application/x-font-type1": {
        source: "apache",
        extensions: ["pfa", "pfb", "pfm", "afm"]
      },
      "application/x-font-vfont": {
        source: "apache"
      },
      "application/x-freearc": {
        source: "apache",
        extensions: ["arc"]
      },
      "application/x-futuresplash": {
        source: "apache",
        extensions: ["spl"]
      },
      "application/x-gca-compressed": {
        source: "apache",
        extensions: ["gca"]
      },
      "application/x-glulx": {
        source: "apache",
        extensions: ["ulx"]
      },
      "application/x-gnumeric": {
        source: "apache",
        extensions: ["gnumeric"]
      },
      "application/x-gramps-xml": {
        source: "apache",
        extensions: ["gramps"]
      },
      "application/x-gtar": {
        source: "apache",
        extensions: ["gtar"]
      },
      "application/x-gzip": {
        source: "apache"
      },
      "application/x-hdf": {
        source: "apache",
        extensions: ["hdf"]
      },
      "application/x-httpd-php": {
        compressible: true,
        extensions: ["php"]
      },
      "application/x-install-instructions": {
        source: "apache",
        extensions: ["install"]
      },
      "application/x-ipynb+json": {
        compressible: true,
        extensions: ["ipynb"]
      },
      "application/x-iso9660-image": {
        source: "apache",
        extensions: ["iso"]
      },
      "application/x-iwork-keynote-sffkey": {
        extensions: ["key"]
      },
      "application/x-iwork-numbers-sffnumbers": {
        extensions: ["numbers"]
      },
      "application/x-iwork-pages-sffpages": {
        extensions: ["pages"]
      },
      "application/x-java-archive-diff": {
        source: "nginx",
        extensions: ["jardiff"]
      },
      "application/x-java-jnlp-file": {
        source: "apache",
        compressible: false,
        extensions: ["jnlp"]
      },
      "application/x-javascript": {
        compressible: true
      },
      "application/x-keepass2": {
        extensions: ["kdbx"]
      },
      "application/x-latex": {
        source: "apache",
        compressible: false,
        extensions: ["latex"]
      },
      "application/x-lua-bytecode": {
        extensions: ["luac"]
      },
      "application/x-lzh-compressed": {
        source: "apache",
        extensions: ["lzh", "lha"]
      },
      "application/x-makeself": {
        source: "nginx",
        extensions: ["run"]
      },
      "application/x-mie": {
        source: "apache",
        extensions: ["mie"]
      },
      "application/x-mobipocket-ebook": {
        source: "apache",
        extensions: ["prc", "mobi"]
      },
      "application/x-mpegurl": {
        compressible: false
      },
      "application/x-ms-application": {
        source: "apache",
        extensions: ["application"]
      },
      "application/x-ms-shortcut": {
        source: "apache",
        extensions: ["lnk"]
      },
      "application/x-ms-wmd": {
        source: "apache",
        extensions: ["wmd"]
      },
      "application/x-ms-wmz": {
        source: "apache",
        extensions: ["wmz"]
      },
      "application/x-ms-xbap": {
        source: "apache",
        extensions: ["xbap"]
      },
      "application/x-msaccess": {
        source: "apache",
        extensions: ["mdb"]
      },
      "application/x-msbinder": {
        source: "apache",
        extensions: ["obd"]
      },
      "application/x-mscardfile": {
        source: "apache",
        extensions: ["crd"]
      },
      "application/x-msclip": {
        source: "apache",
        extensions: ["clp"]
      },
      "application/x-msdos-program": {
        extensions: ["exe"]
      },
      "application/x-msdownload": {
        source: "apache",
        extensions: ["exe", "dll", "com", "bat", "msi"]
      },
      "application/x-msmediaview": {
        source: "apache",
        extensions: ["mvb", "m13", "m14"]
      },
      "application/x-msmetafile": {
        source: "apache",
        extensions: ["wmf", "wmz", "emf", "emz"]
      },
      "application/x-msmoney": {
        source: "apache",
        extensions: ["mny"]
      },
      "application/x-mspublisher": {
        source: "apache",
        extensions: ["pub"]
      },
      "application/x-msschedule": {
        source: "apache",
        extensions: ["scd"]
      },
      "application/x-msterminal": {
        source: "apache",
        extensions: ["trm"]
      },
      "application/x-mswrite": {
        source: "apache",
        extensions: ["wri"]
      },
      "application/x-netcdf": {
        source: "apache",
        extensions: ["nc", "cdf"]
      },
      "application/x-ns-proxy-autoconfig": {
        compressible: true,
        extensions: ["pac"]
      },
      "application/x-nzb": {
        source: "apache",
        extensions: ["nzb"]
      },
      "application/x-perl": {
        source: "nginx",
        extensions: ["pl", "pm"]
      },
      "application/x-pilot": {
        source: "nginx",
        extensions: ["prc", "pdb"]
      },
      "application/x-pkcs12": {
        source: "apache",
        compressible: false,
        extensions: ["p12", "pfx"]
      },
      "application/x-pkcs7-certificates": {
        source: "apache",
        extensions: ["p7b", "spc"]
      },
      "application/x-pkcs7-certreqresp": {
        source: "apache",
        extensions: ["p7r"]
      },
      "application/x-pki-message": {
        source: "iana"
      },
      "application/x-rar-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["rar"]
      },
      "application/x-redhat-package-manager": {
        source: "nginx",
        extensions: ["rpm"]
      },
      "application/x-research-info-systems": {
        source: "apache",
        extensions: ["ris"]
      },
      "application/x-sea": {
        source: "nginx",
        extensions: ["sea"]
      },
      "application/x-sh": {
        source: "apache",
        compressible: true,
        extensions: ["sh"]
      },
      "application/x-shar": {
        source: "apache",
        extensions: ["shar"]
      },
      "application/x-shockwave-flash": {
        source: "apache",
        compressible: false,
        extensions: ["swf"]
      },
      "application/x-silverlight-app": {
        source: "apache",
        extensions: ["xap"]
      },
      "application/x-sql": {
        source: "apache",
        extensions: ["sql"]
      },
      "application/x-stuffit": {
        source: "apache",
        compressible: false,
        extensions: ["sit"]
      },
      "application/x-stuffitx": {
        source: "apache",
        extensions: ["sitx"]
      },
      "application/x-subrip": {
        source: "apache",
        extensions: ["srt"]
      },
      "application/x-sv4cpio": {
        source: "apache",
        extensions: ["sv4cpio"]
      },
      "application/x-sv4crc": {
        source: "apache",
        extensions: ["sv4crc"]
      },
      "application/x-t3vm-image": {
        source: "apache",
        extensions: ["t3"]
      },
      "application/x-tads": {
        source: "apache",
        extensions: ["gam"]
      },
      "application/x-tar": {
        source: "apache",
        compressible: true,
        extensions: ["tar"]
      },
      "application/x-tcl": {
        source: "apache",
        extensions: ["tcl", "tk"]
      },
      "application/x-tex": {
        source: "apache",
        extensions: ["tex"]
      },
      "application/x-tex-tfm": {
        source: "apache",
        extensions: ["tfm"]
      },
      "application/x-texinfo": {
        source: "apache",
        extensions: ["texinfo", "texi"]
      },
      "application/x-tgif": {
        source: "apache",
        extensions: ["obj"]
      },
      "application/x-ustar": {
        source: "apache",
        extensions: ["ustar"]
      },
      "application/x-virtualbox-hdd": {
        compressible: true,
        extensions: ["hdd"]
      },
      "application/x-virtualbox-ova": {
        compressible: true,
        extensions: ["ova"]
      },
      "application/x-virtualbox-ovf": {
        compressible: true,
        extensions: ["ovf"]
      },
      "application/x-virtualbox-vbox": {
        compressible: true,
        extensions: ["vbox"]
      },
      "application/x-virtualbox-vbox-extpack": {
        compressible: false,
        extensions: ["vbox-extpack"]
      },
      "application/x-virtualbox-vdi": {
        compressible: true,
        extensions: ["vdi"]
      },
      "application/x-virtualbox-vhd": {
        compressible: true,
        extensions: ["vhd"]
      },
      "application/x-virtualbox-vmdk": {
        compressible: true,
        extensions: ["vmdk"]
      },
      "application/x-wais-source": {
        source: "apache",
        extensions: ["src"]
      },
      "application/x-web-app-manifest+json": {
        compressible: true,
        extensions: ["webapp"]
      },
      "application/x-www-form-urlencoded": {
        source: "iana",
        compressible: true
      },
      "application/x-x509-ca-cert": {
        source: "iana",
        extensions: ["der", "crt", "pem"]
      },
      "application/x-x509-ca-ra-cert": {
        source: "iana"
      },
      "application/x-x509-next-ca-cert": {
        source: "iana"
      },
      "application/x-xfig": {
        source: "apache",
        extensions: ["fig"]
      },
      "application/x-xliff+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/x-xpinstall": {
        source: "apache",
        compressible: false,
        extensions: ["xpi"]
      },
      "application/x-xz": {
        source: "apache",
        extensions: ["xz"]
      },
      "application/x-zip-compressed": {
        extensions: ["zip"]
      },
      "application/x-zmachine": {
        source: "apache",
        extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
      },
      "application/x400-bp": {
        source: "iana"
      },
      "application/xacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/xaml+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xaml"]
      },
      "application/xcap-att+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xav"]
      },
      "application/xcap-caps+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xca"]
      },
      "application/xcap-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdf"]
      },
      "application/xcap-el+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xel"]
      },
      "application/xcap-error+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcap-ns+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xns"]
      },
      "application/xcon-conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcon-conference-info-diff+xml": {
        source: "iana",
        compressible: true
      },
      "application/xenc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xenc"]
      },
      "application/xfdf": {
        source: "iana",
        extensions: ["xfdf"]
      },
      "application/xhtml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xhtml", "xht"]
      },
      "application/xhtml-voice+xml": {
        source: "apache",
        compressible: true
      },
      "application/xliff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml", "xsl", "xsd", "rng"]
      },
      "application/xml-dtd": {
        source: "iana",
        compressible: true,
        extensions: ["dtd"]
      },
      "application/xml-external-parsed-entity": {
        source: "iana"
      },
      "application/xml-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/xmpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/xop+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xop"]
      },
      "application/xproc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xpl"]
      },
      "application/xslt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xsl", "xslt"]
      },
      "application/xspf+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xspf"]
      },
      "application/xv+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mxml", "xhvml", "xvml", "xvm"]
      },
      "application/yaml": {
        source: "iana"
      },
      "application/yang": {
        source: "iana",
        extensions: ["yang"]
      },
      "application/yang-data+cbor": {
        source: "iana"
      },
      "application/yang-data+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-data+xml": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/yang-sid+json": {
        source: "iana",
        compressible: true
      },
      "application/yin+xml": {
        source: "iana",
        compressible: true,
        extensions: ["yin"]
      },
      "application/zip": {
        source: "iana",
        compressible: false,
        extensions: ["zip"]
      },
      "application/zip+dotlottie": {
        extensions: ["lottie"]
      },
      "application/zlib": {
        source: "iana"
      },
      "application/zstd": {
        source: "iana"
      },
      "audio/1d-interleaved-parityfec": {
        source: "iana"
      },
      "audio/32kadpcm": {
        source: "iana"
      },
      "audio/3gpp": {
        source: "iana",
        compressible: false,
        extensions: ["3gpp"]
      },
      "audio/3gpp2": {
        source: "iana"
      },
      "audio/aac": {
        source: "iana",
        extensions: ["adts", "aac"]
      },
      "audio/ac3": {
        source: "iana"
      },
      "audio/adpcm": {
        source: "apache",
        extensions: ["adp"]
      },
      "audio/amr": {
        source: "iana",
        extensions: ["amr"]
      },
      "audio/amr-wb": {
        source: "iana"
      },
      "audio/amr-wb+": {
        source: "iana"
      },
      "audio/aptx": {
        source: "iana"
      },
      "audio/asc": {
        source: "iana"
      },
      "audio/atrac-advanced-lossless": {
        source: "iana"
      },
      "audio/atrac-x": {
        source: "iana"
      },
      "audio/atrac3": {
        source: "iana"
      },
      "audio/basic": {
        source: "iana",
        compressible: false,
        extensions: ["au", "snd"]
      },
      "audio/bv16": {
        source: "iana"
      },
      "audio/bv32": {
        source: "iana"
      },
      "audio/clearmode": {
        source: "iana"
      },
      "audio/cn": {
        source: "iana"
      },
      "audio/dat12": {
        source: "iana"
      },
      "audio/dls": {
        source: "iana"
      },
      "audio/dsr-es201108": {
        source: "iana"
      },
      "audio/dsr-es202050": {
        source: "iana"
      },
      "audio/dsr-es202211": {
        source: "iana"
      },
      "audio/dsr-es202212": {
        source: "iana"
      },
      "audio/dv": {
        source: "iana"
      },
      "audio/dvi4": {
        source: "iana"
      },
      "audio/eac3": {
        source: "iana"
      },
      "audio/encaprtp": {
        source: "iana"
      },
      "audio/evrc": {
        source: "iana"
      },
      "audio/evrc-qcp": {
        source: "iana"
      },
      "audio/evrc0": {
        source: "iana"
      },
      "audio/evrc1": {
        source: "iana"
      },
      "audio/evrcb": {
        source: "iana"
      },
      "audio/evrcb0": {
        source: "iana"
      },
      "audio/evrcb1": {
        source: "iana"
      },
      "audio/evrcnw": {
        source: "iana"
      },
      "audio/evrcnw0": {
        source: "iana"
      },
      "audio/evrcnw1": {
        source: "iana"
      },
      "audio/evrcwb": {
        source: "iana"
      },
      "audio/evrcwb0": {
        source: "iana"
      },
      "audio/evrcwb1": {
        source: "iana"
      },
      "audio/evs": {
        source: "iana"
      },
      "audio/flac": {
        source: "iana"
      },
      "audio/flexfec": {
        source: "iana"
      },
      "audio/fwdred": {
        source: "iana"
      },
      "audio/g711-0": {
        source: "iana"
      },
      "audio/g719": {
        source: "iana"
      },
      "audio/g722": {
        source: "iana"
      },
      "audio/g7221": {
        source: "iana"
      },
      "audio/g723": {
        source: "iana"
      },
      "audio/g726-16": {
        source: "iana"
      },
      "audio/g726-24": {
        source: "iana"
      },
      "audio/g726-32": {
        source: "iana"
      },
      "audio/g726-40": {
        source: "iana"
      },
      "audio/g728": {
        source: "iana"
      },
      "audio/g729": {
        source: "iana"
      },
      "audio/g7291": {
        source: "iana"
      },
      "audio/g729d": {
        source: "iana"
      },
      "audio/g729e": {
        source: "iana"
      },
      "audio/gsm": {
        source: "iana"
      },
      "audio/gsm-efr": {
        source: "iana"
      },
      "audio/gsm-hr-08": {
        source: "iana"
      },
      "audio/ilbc": {
        source: "iana"
      },
      "audio/ip-mr_v2.5": {
        source: "iana"
      },
      "audio/isac": {
        source: "apache"
      },
      "audio/l16": {
        source: "iana"
      },
      "audio/l20": {
        source: "iana"
      },
      "audio/l24": {
        source: "iana",
        compressible: false
      },
      "audio/l8": {
        source: "iana"
      },
      "audio/lpc": {
        source: "iana"
      },
      "audio/matroska": {
        source: "iana"
      },
      "audio/melp": {
        source: "iana"
      },
      "audio/melp1200": {
        source: "iana"
      },
      "audio/melp2400": {
        source: "iana"
      },
      "audio/melp600": {
        source: "iana"
      },
      "audio/mhas": {
        source: "iana"
      },
      "audio/midi": {
        source: "apache",
        extensions: ["mid", "midi", "kar", "rmi"]
      },
      "audio/midi-clip": {
        source: "iana"
      },
      "audio/mobile-xmf": {
        source: "iana",
        extensions: ["mxmf"]
      },
      "audio/mp3": {
        compressible: false,
        extensions: ["mp3"]
      },
      "audio/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["m4a", "mp4a", "m4b"]
      },
      "audio/mp4a-latm": {
        source: "iana"
      },
      "audio/mpa": {
        source: "iana"
      },
      "audio/mpa-robust": {
        source: "iana"
      },
      "audio/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
      },
      "audio/mpeg4-generic": {
        source: "iana"
      },
      "audio/musepack": {
        source: "apache"
      },
      "audio/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["oga", "ogg", "spx", "opus"]
      },
      "audio/opus": {
        source: "iana"
      },
      "audio/parityfec": {
        source: "iana"
      },
      "audio/pcma": {
        source: "iana"
      },
      "audio/pcma-wb": {
        source: "iana"
      },
      "audio/pcmu": {
        source: "iana"
      },
      "audio/pcmu-wb": {
        source: "iana"
      },
      "audio/prs.sid": {
        source: "iana"
      },
      "audio/qcelp": {
        source: "iana"
      },
      "audio/raptorfec": {
        source: "iana"
      },
      "audio/red": {
        source: "iana"
      },
      "audio/rtp-enc-aescm128": {
        source: "iana"
      },
      "audio/rtp-midi": {
        source: "iana"
      },
      "audio/rtploopback": {
        source: "iana"
      },
      "audio/rtx": {
        source: "iana"
      },
      "audio/s3m": {
        source: "apache",
        extensions: ["s3m"]
      },
      "audio/scip": {
        source: "iana"
      },
      "audio/silk": {
        source: "apache",
        extensions: ["sil"]
      },
      "audio/smv": {
        source: "iana"
      },
      "audio/smv-qcp": {
        source: "iana"
      },
      "audio/smv0": {
        source: "iana"
      },
      "audio/sofa": {
        source: "iana"
      },
      "audio/sp-midi": {
        source: "iana"
      },
      "audio/speex": {
        source: "iana"
      },
      "audio/t140c": {
        source: "iana"
      },
      "audio/t38": {
        source: "iana"
      },
      "audio/telephone-event": {
        source: "iana"
      },
      "audio/tetra_acelp": {
        source: "iana"
      },
      "audio/tetra_acelp_bb": {
        source: "iana"
      },
      "audio/tone": {
        source: "iana"
      },
      "audio/tsvcis": {
        source: "iana"
      },
      "audio/uemclip": {
        source: "iana"
      },
      "audio/ulpfec": {
        source: "iana"
      },
      "audio/usac": {
        source: "iana"
      },
      "audio/vdvi": {
        source: "iana"
      },
      "audio/vmr-wb": {
        source: "iana"
      },
      "audio/vnd.3gpp.iufp": {
        source: "iana"
      },
      "audio/vnd.4sb": {
        source: "iana"
      },
      "audio/vnd.audiokoz": {
        source: "iana"
      },
      "audio/vnd.celp": {
        source: "iana"
      },
      "audio/vnd.cisco.nse": {
        source: "iana"
      },
      "audio/vnd.cmles.radio-events": {
        source: "iana"
      },
      "audio/vnd.cns.anp1": {
        source: "iana"
      },
      "audio/vnd.cns.inf1": {
        source: "iana"
      },
      "audio/vnd.dece.audio": {
        source: "iana",
        extensions: ["uva", "uvva"]
      },
      "audio/vnd.digital-winds": {
        source: "iana",
        extensions: ["eol"]
      },
      "audio/vnd.dlna.adts": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.1": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.2": {
        source: "iana"
      },
      "audio/vnd.dolby.mlp": {
        source: "iana"
      },
      "audio/vnd.dolby.mps": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2x": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2z": {
        source: "iana"
      },
      "audio/vnd.dolby.pulse.1": {
        source: "iana"
      },
      "audio/vnd.dra": {
        source: "iana",
        extensions: ["dra"]
      },
      "audio/vnd.dts": {
        source: "iana",
        extensions: ["dts"]
      },
      "audio/vnd.dts.hd": {
        source: "iana",
        extensions: ["dtshd"]
      },
      "audio/vnd.dts.uhd": {
        source: "iana"
      },
      "audio/vnd.dvb.file": {
        source: "iana"
      },
      "audio/vnd.everad.plj": {
        source: "iana"
      },
      "audio/vnd.hns.audio": {
        source: "iana"
      },
      "audio/vnd.lucent.voice": {
        source: "iana",
        extensions: ["lvp"]
      },
      "audio/vnd.ms-playready.media.pya": {
        source: "iana",
        extensions: ["pya"]
      },
      "audio/vnd.nokia.mobile-xmf": {
        source: "iana"
      },
      "audio/vnd.nortel.vbk": {
        source: "iana"
      },
      "audio/vnd.nuera.ecelp4800": {
        source: "iana",
        extensions: ["ecelp4800"]
      },
      "audio/vnd.nuera.ecelp7470": {
        source: "iana",
        extensions: ["ecelp7470"]
      },
      "audio/vnd.nuera.ecelp9600": {
        source: "iana",
        extensions: ["ecelp9600"]
      },
      "audio/vnd.octel.sbc": {
        source: "iana"
      },
      "audio/vnd.presonus.multitrack": {
        source: "iana"
      },
      "audio/vnd.qcelp": {
        source: "apache"
      },
      "audio/vnd.rhetorex.32kadpcm": {
        source: "iana"
      },
      "audio/vnd.rip": {
        source: "iana",
        extensions: ["rip"]
      },
      "audio/vnd.rn-realaudio": {
        compressible: false
      },
      "audio/vnd.sealedmedia.softseal.mpeg": {
        source: "iana"
      },
      "audio/vnd.vmx.cvsd": {
        source: "iana"
      },
      "audio/vnd.wave": {
        compressible: false
      },
      "audio/vorbis": {
        source: "iana",
        compressible: false
      },
      "audio/vorbis-config": {
        source: "iana"
      },
      "audio/wav": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/wave": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/webm": {
        source: "apache",
        compressible: false,
        extensions: ["weba"]
      },
      "audio/x-aac": {
        source: "apache",
        compressible: false,
        extensions: ["aac"]
      },
      "audio/x-aiff": {
        source: "apache",
        extensions: ["aif", "aiff", "aifc"]
      },
      "audio/x-caf": {
        source: "apache",
        compressible: false,
        extensions: ["caf"]
      },
      "audio/x-flac": {
        source: "apache",
        extensions: ["flac"]
      },
      "audio/x-m4a": {
        source: "nginx",
        extensions: ["m4a"]
      },
      "audio/x-matroska": {
        source: "apache",
        extensions: ["mka"]
      },
      "audio/x-mpegurl": {
        source: "apache",
        extensions: ["m3u"]
      },
      "audio/x-ms-wax": {
        source: "apache",
        extensions: ["wax"]
      },
      "audio/x-ms-wma": {
        source: "apache",
        extensions: ["wma"]
      },
      "audio/x-pn-realaudio": {
        source: "apache",
        extensions: ["ram", "ra"]
      },
      "audio/x-pn-realaudio-plugin": {
        source: "apache",
        extensions: ["rmp"]
      },
      "audio/x-realaudio": {
        source: "nginx",
        extensions: ["ra"]
      },
      "audio/x-tta": {
        source: "apache"
      },
      "audio/x-wav": {
        source: "apache",
        extensions: ["wav"]
      },
      "audio/xm": {
        source: "apache",
        extensions: ["xm"]
      },
      "chemical/x-cdx": {
        source: "apache",
        extensions: ["cdx"]
      },
      "chemical/x-cif": {
        source: "apache",
        extensions: ["cif"]
      },
      "chemical/x-cmdf": {
        source: "apache",
        extensions: ["cmdf"]
      },
      "chemical/x-cml": {
        source: "apache",
        extensions: ["cml"]
      },
      "chemical/x-csml": {
        source: "apache",
        extensions: ["csml"]
      },
      "chemical/x-pdb": {
        source: "apache"
      },
      "chemical/x-xyz": {
        source: "apache",
        extensions: ["xyz"]
      },
      "font/collection": {
        source: "iana",
        extensions: ["ttc"]
      },
      "font/otf": {
        source: "iana",
        compressible: true,
        extensions: ["otf"]
      },
      "font/sfnt": {
        source: "iana"
      },
      "font/ttf": {
        source: "iana",
        compressible: true,
        extensions: ["ttf"]
      },
      "font/woff": {
        source: "iana",
        extensions: ["woff"]
      },
      "font/woff2": {
        source: "iana",
        extensions: ["woff2"]
      },
      "image/aces": {
        source: "iana",
        extensions: ["exr"]
      },
      "image/apng": {
        source: "iana",
        compressible: false,
        extensions: ["apng"]
      },
      "image/avci": {
        source: "iana",
        extensions: ["avci"]
      },
      "image/avcs": {
        source: "iana",
        extensions: ["avcs"]
      },
      "image/avif": {
        source: "iana",
        compressible: false,
        extensions: ["avif"]
      },
      "image/bmp": {
        source: "iana",
        compressible: true,
        extensions: ["bmp", "dib"]
      },
      "image/cgm": {
        source: "iana",
        extensions: ["cgm"]
      },
      "image/dicom-rle": {
        source: "iana",
        extensions: ["drle"]
      },
      "image/dpx": {
        source: "iana",
        extensions: ["dpx"]
      },
      "image/emf": {
        source: "iana",
        extensions: ["emf"]
      },
      "image/fits": {
        source: "iana",
        extensions: ["fits"]
      },
      "image/g3fax": {
        source: "iana",
        extensions: ["g3"]
      },
      "image/gif": {
        source: "iana",
        compressible: false,
        extensions: ["gif"]
      },
      "image/heic": {
        source: "iana",
        extensions: ["heic"]
      },
      "image/heic-sequence": {
        source: "iana",
        extensions: ["heics"]
      },
      "image/heif": {
        source: "iana",
        extensions: ["heif"]
      },
      "image/heif-sequence": {
        source: "iana",
        extensions: ["heifs"]
      },
      "image/hej2k": {
        source: "iana",
        extensions: ["hej2"]
      },
      "image/ief": {
        source: "iana",
        extensions: ["ief"]
      },
      "image/j2c": {
        source: "iana"
      },
      "image/jaii": {
        source: "iana",
        extensions: ["jaii"]
      },
      "image/jais": {
        source: "iana",
        extensions: ["jais"]
      },
      "image/jls": {
        source: "iana",
        extensions: ["jls"]
      },
      "image/jp2": {
        source: "iana",
        compressible: false,
        extensions: ["jp2", "jpg2"]
      },
      "image/jpeg": {
        source: "iana",
        compressible: false,
        extensions: ["jpg", "jpeg", "jpe"]
      },
      "image/jph": {
        source: "iana",
        extensions: ["jph"]
      },
      "image/jphc": {
        source: "iana",
        extensions: ["jhc"]
      },
      "image/jpm": {
        source: "iana",
        compressible: false,
        extensions: ["jpm", "jpgm"]
      },
      "image/jpx": {
        source: "iana",
        compressible: false,
        extensions: ["jpx", "jpf"]
      },
      "image/jxl": {
        source: "iana",
        extensions: ["jxl"]
      },
      "image/jxr": {
        source: "iana",
        extensions: ["jxr"]
      },
      "image/jxra": {
        source: "iana",
        extensions: ["jxra"]
      },
      "image/jxrs": {
        source: "iana",
        extensions: ["jxrs"]
      },
      "image/jxs": {
        source: "iana",
        extensions: ["jxs"]
      },
      "image/jxsc": {
        source: "iana",
        extensions: ["jxsc"]
      },
      "image/jxsi": {
        source: "iana",
        extensions: ["jxsi"]
      },
      "image/jxss": {
        source: "iana",
        extensions: ["jxss"]
      },
      "image/ktx": {
        source: "iana",
        extensions: ["ktx"]
      },
      "image/ktx2": {
        source: "iana",
        extensions: ["ktx2"]
      },
      "image/naplps": {
        source: "iana"
      },
      "image/pjpeg": {
        compressible: false,
        extensions: ["jfif"]
      },
      "image/png": {
        source: "iana",
        compressible: false,
        extensions: ["png"]
      },
      "image/prs.btif": {
        source: "iana",
        extensions: ["btif", "btf"]
      },
      "image/prs.pti": {
        source: "iana",
        extensions: ["pti"]
      },
      "image/pwg-raster": {
        source: "iana"
      },
      "image/sgi": {
        source: "apache",
        extensions: ["sgi"]
      },
      "image/svg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["svg", "svgz"]
      },
      "image/t38": {
        source: "iana",
        extensions: ["t38"]
      },
      "image/tiff": {
        source: "iana",
        compressible: false,
        extensions: ["tif", "tiff"]
      },
      "image/tiff-fx": {
        source: "iana",
        extensions: ["tfx"]
      },
      "image/vnd.adobe.photoshop": {
        source: "iana",
        compressible: true,
        extensions: ["psd"]
      },
      "image/vnd.airzip.accelerator.azv": {
        source: "iana",
        extensions: ["azv"]
      },
      "image/vnd.clip": {
        source: "iana"
      },
      "image/vnd.cns.inf2": {
        source: "iana"
      },
      "image/vnd.dece.graphic": {
        source: "iana",
        extensions: ["uvi", "uvvi", "uvg", "uvvg"]
      },
      "image/vnd.djvu": {
        source: "iana",
        extensions: ["djvu", "djv"]
      },
      "image/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "image/vnd.dwg": {
        source: "iana",
        extensions: ["dwg"]
      },
      "image/vnd.dxf": {
        source: "iana",
        extensions: ["dxf"]
      },
      "image/vnd.fastbidsheet": {
        source: "iana",
        extensions: ["fbs"]
      },
      "image/vnd.fpx": {
        source: "iana",
        extensions: ["fpx"]
      },
      "image/vnd.fst": {
        source: "iana",
        extensions: ["fst"]
      },
      "image/vnd.fujixerox.edmics-mmr": {
        source: "iana",
        extensions: ["mmr"]
      },
      "image/vnd.fujixerox.edmics-rlc": {
        source: "iana",
        extensions: ["rlc"]
      },
      "image/vnd.globalgraphics.pgb": {
        source: "iana"
      },
      "image/vnd.microsoft.icon": {
        source: "iana",
        compressible: true,
        extensions: ["ico"]
      },
      "image/vnd.mix": {
        source: "iana"
      },
      "image/vnd.mozilla.apng": {
        source: "iana"
      },
      "image/vnd.ms-dds": {
        compressible: true,
        extensions: ["dds"]
      },
      "image/vnd.ms-modi": {
        source: "iana",
        extensions: ["mdi"]
      },
      "image/vnd.ms-photo": {
        source: "apache",
        extensions: ["wdp"]
      },
      "image/vnd.net-fpx": {
        source: "iana",
        extensions: ["npx"]
      },
      "image/vnd.pco.b16": {
        source: "iana",
        extensions: ["b16"]
      },
      "image/vnd.radiance": {
        source: "iana"
      },
      "image/vnd.sealed.png": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.gif": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.jpg": {
        source: "iana"
      },
      "image/vnd.svf": {
        source: "iana"
      },
      "image/vnd.tencent.tap": {
        source: "iana",
        extensions: ["tap"]
      },
      "image/vnd.valve.source.texture": {
        source: "iana",
        extensions: ["vtf"]
      },
      "image/vnd.wap.wbmp": {
        source: "iana",
        extensions: ["wbmp"]
      },
      "image/vnd.xiff": {
        source: "iana",
        extensions: ["xif"]
      },
      "image/vnd.zbrush.pcx": {
        source: "iana",
        extensions: ["pcx"]
      },
      "image/webp": {
        source: "iana",
        extensions: ["webp"]
      },
      "image/wmf": {
        source: "iana",
        extensions: ["wmf"]
      },
      "image/x-3ds": {
        source: "apache",
        extensions: ["3ds"]
      },
      "image/x-adobe-dng": {
        extensions: ["dng"]
      },
      "image/x-cmu-raster": {
        source: "apache",
        extensions: ["ras"]
      },
      "image/x-cmx": {
        source: "apache",
        extensions: ["cmx"]
      },
      "image/x-emf": {
        source: "iana"
      },
      "image/x-freehand": {
        source: "apache",
        extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
      },
      "image/x-icon": {
        source: "apache",
        compressible: true,
        extensions: ["ico"]
      },
      "image/x-jng": {
        source: "nginx",
        extensions: ["jng"]
      },
      "image/x-mrsid-image": {
        source: "apache",
        extensions: ["sid"]
      },
      "image/x-ms-bmp": {
        source: "nginx",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/x-pcx": {
        source: "apache",
        extensions: ["pcx"]
      },
      "image/x-pict": {
        source: "apache",
        extensions: ["pic", "pct"]
      },
      "image/x-portable-anymap": {
        source: "apache",
        extensions: ["pnm"]
      },
      "image/x-portable-bitmap": {
        source: "apache",
        extensions: ["pbm"]
      },
      "image/x-portable-graymap": {
        source: "apache",
        extensions: ["pgm"]
      },
      "image/x-portable-pixmap": {
        source: "apache",
        extensions: ["ppm"]
      },
      "image/x-rgb": {
        source: "apache",
        extensions: ["rgb"]
      },
      "image/x-tga": {
        source: "apache",
        extensions: ["tga"]
      },
      "image/x-wmf": {
        source: "iana"
      },
      "image/x-xbitmap": {
        source: "apache",
        extensions: ["xbm"]
      },
      "image/x-xcf": {
        compressible: false
      },
      "image/x-xpixmap": {
        source: "apache",
        extensions: ["xpm"]
      },
      "image/x-xwindowdump": {
        source: "apache",
        extensions: ["xwd"]
      },
      "message/bhttp": {
        source: "iana"
      },
      "message/cpim": {
        source: "iana"
      },
      "message/delivery-status": {
        source: "iana"
      },
      "message/disposition-notification": {
        source: "iana",
        extensions: [
          "disposition-notification"
        ]
      },
      "message/external-body": {
        source: "iana"
      },
      "message/feedback-report": {
        source: "iana"
      },
      "message/global": {
        source: "iana",
        extensions: ["u8msg"]
      },
      "message/global-delivery-status": {
        source: "iana",
        extensions: ["u8dsn"]
      },
      "message/global-disposition-notification": {
        source: "iana",
        extensions: ["u8mdn"]
      },
      "message/global-headers": {
        source: "iana",
        extensions: ["u8hdr"]
      },
      "message/http": {
        source: "iana",
        compressible: false
      },
      "message/imdn+xml": {
        source: "iana",
        compressible: true
      },
      "message/mls": {
        source: "iana"
      },
      "message/news": {
        source: "apache"
      },
      "message/ohttp-req": {
        source: "iana"
      },
      "message/ohttp-res": {
        source: "iana"
      },
      "message/partial": {
        source: "iana",
        compressible: false
      },
      "message/rfc822": {
        source: "iana",
        compressible: true,
        extensions: ["eml", "mime", "mht", "mhtml"]
      },
      "message/s-http": {
        source: "apache"
      },
      "message/sip": {
        source: "iana"
      },
      "message/sipfrag": {
        source: "iana"
      },
      "message/tracking-status": {
        source: "iana"
      },
      "message/vnd.si.simp": {
        source: "apache"
      },
      "message/vnd.wfa.wsc": {
        source: "iana",
        extensions: ["wsc"]
      },
      "model/3mf": {
        source: "iana",
        extensions: ["3mf"]
      },
      "model/e57": {
        source: "iana"
      },
      "model/gltf+json": {
        source: "iana",
        compressible: true,
        extensions: ["gltf"]
      },
      "model/gltf-binary": {
        source: "iana",
        compressible: true,
        extensions: ["glb"]
      },
      "model/iges": {
        source: "iana",
        compressible: false,
        extensions: ["igs", "iges"]
      },
      "model/jt": {
        source: "iana",
        extensions: ["jt"]
      },
      "model/mesh": {
        source: "iana",
        compressible: false,
        extensions: ["msh", "mesh", "silo"]
      },
      "model/mtl": {
        source: "iana",
        extensions: ["mtl"]
      },
      "model/obj": {
        source: "iana",
        extensions: ["obj"]
      },
      "model/prc": {
        source: "iana",
        extensions: ["prc"]
      },
      "model/step": {
        source: "iana",
        extensions: ["step", "stp", "stpnc", "p21", "210"]
      },
      "model/step+xml": {
        source: "iana",
        compressible: true,
        extensions: ["stpx"]
      },
      "model/step+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpz"]
      },
      "model/step-xml+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpxz"]
      },
      "model/stl": {
        source: "iana",
        extensions: ["stl"]
      },
      "model/u3d": {
        source: "iana",
        extensions: ["u3d"]
      },
      "model/vnd.bary": {
        source: "iana",
        extensions: ["bary"]
      },
      "model/vnd.cld": {
        source: "iana",
        extensions: ["cld"]
      },
      "model/vnd.collada+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dae"]
      },
      "model/vnd.dwf": {
        source: "iana",
        extensions: ["dwf"]
      },
      "model/vnd.flatland.3dml": {
        source: "iana"
      },
      "model/vnd.gdl": {
        source: "iana",
        extensions: ["gdl"]
      },
      "model/vnd.gs-gdl": {
        source: "apache"
      },
      "model/vnd.gs.gdl": {
        source: "iana"
      },
      "model/vnd.gtw": {
        source: "iana",
        extensions: ["gtw"]
      },
      "model/vnd.moml+xml": {
        source: "iana",
        compressible: true
      },
      "model/vnd.mts": {
        source: "iana",
        extensions: ["mts"]
      },
      "model/vnd.opengex": {
        source: "iana",
        extensions: ["ogex"]
      },
      "model/vnd.parasolid.transmit.binary": {
        source: "iana",
        extensions: ["x_b"]
      },
      "model/vnd.parasolid.transmit.text": {
        source: "iana",
        extensions: ["x_t"]
      },
      "model/vnd.pytha.pyox": {
        source: "iana",
        extensions: ["pyo", "pyox"]
      },
      "model/vnd.rosette.annotated-data-model": {
        source: "iana"
      },
      "model/vnd.sap.vds": {
        source: "iana",
        extensions: ["vds"]
      },
      "model/vnd.usda": {
        source: "iana",
        extensions: ["usda"]
      },
      "model/vnd.usdz+zip": {
        source: "iana",
        compressible: false,
        extensions: ["usdz"]
      },
      "model/vnd.valve.source.compiled-map": {
        source: "iana",
        extensions: ["bsp"]
      },
      "model/vnd.vtu": {
        source: "iana",
        extensions: ["vtu"]
      },
      "model/vrml": {
        source: "iana",
        compressible: false,
        extensions: ["wrl", "vrml"]
      },
      "model/x3d+binary": {
        source: "apache",
        compressible: false,
        extensions: ["x3db", "x3dbz"]
      },
      "model/x3d+fastinfoset": {
        source: "iana",
        extensions: ["x3db"]
      },
      "model/x3d+vrml": {
        source: "apache",
        compressible: false,
        extensions: ["x3dv", "x3dvz"]
      },
      "model/x3d+xml": {
        source: "iana",
        compressible: true,
        extensions: ["x3d", "x3dz"]
      },
      "model/x3d-vrml": {
        source: "iana",
        extensions: ["x3dv"]
      },
      "multipart/alternative": {
        source: "iana",
        compressible: false
      },
      "multipart/appledouble": {
        source: "iana"
      },
      "multipart/byteranges": {
        source: "iana"
      },
      "multipart/digest": {
        source: "iana"
      },
      "multipart/encrypted": {
        source: "iana",
        compressible: false
      },
      "multipart/form-data": {
        source: "iana",
        compressible: false
      },
      "multipart/header-set": {
        source: "iana"
      },
      "multipart/mixed": {
        source: "iana"
      },
      "multipart/multilingual": {
        source: "iana"
      },
      "multipart/parallel": {
        source: "iana"
      },
      "multipart/related": {
        source: "iana",
        compressible: false
      },
      "multipart/report": {
        source: "iana"
      },
      "multipart/signed": {
        source: "iana",
        compressible: false
      },
      "multipart/vnd.bint.med-plus": {
        source: "iana"
      },
      "multipart/voice-message": {
        source: "iana"
      },
      "multipart/x-mixed-replace": {
        source: "iana"
      },
      "text/1d-interleaved-parityfec": {
        source: "iana"
      },
      "text/cache-manifest": {
        source: "iana",
        compressible: true,
        extensions: ["appcache", "manifest"]
      },
      "text/calendar": {
        source: "iana",
        extensions: ["ics", "ifb"]
      },
      "text/calender": {
        compressible: true
      },
      "text/cmd": {
        compressible: true
      },
      "text/coffeescript": {
        extensions: ["coffee", "litcoffee"]
      },
      "text/cql": {
        source: "iana"
      },
      "text/cql-expression": {
        source: "iana"
      },
      "text/cql-identifier": {
        source: "iana"
      },
      "text/css": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["css"]
      },
      "text/csv": {
        source: "iana",
        compressible: true,
        extensions: ["csv"]
      },
      "text/csv-schema": {
        source: "iana"
      },
      "text/directory": {
        source: "iana"
      },
      "text/dns": {
        source: "iana"
      },
      "text/ecmascript": {
        source: "apache"
      },
      "text/encaprtp": {
        source: "iana"
      },
      "text/enriched": {
        source: "iana"
      },
      "text/fhirpath": {
        source: "iana"
      },
      "text/flexfec": {
        source: "iana"
      },
      "text/fwdred": {
        source: "iana"
      },
      "text/gff3": {
        source: "iana"
      },
      "text/grammar-ref-list": {
        source: "iana"
      },
      "text/hl7v2": {
        source: "iana"
      },
      "text/html": {
        source: "iana",
        compressible: true,
        extensions: ["html", "htm", "shtml"]
      },
      "text/jade": {
        extensions: ["jade"]
      },
      "text/javascript": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["js", "mjs"]
      },
      "text/jcr-cnd": {
        source: "iana"
      },
      "text/jsx": {
        compressible: true,
        extensions: ["jsx"]
      },
      "text/less": {
        compressible: true,
        extensions: ["less"]
      },
      "text/markdown": {
        source: "iana",
        compressible: true,
        extensions: ["md", "markdown"]
      },
      "text/mathml": {
        source: "nginx",
        extensions: ["mml"]
      },
      "text/mdx": {
        compressible: true,
        extensions: ["mdx"]
      },
      "text/mizar": {
        source: "iana"
      },
      "text/n3": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["n3"]
      },
      "text/parameters": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/parityfec": {
        source: "iana"
      },
      "text/plain": {
        source: "iana",
        compressible: true,
        extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
      },
      "text/provenance-notation": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/prs.fallenstein.rst": {
        source: "iana"
      },
      "text/prs.lines.tag": {
        source: "iana",
        extensions: ["dsc"]
      },
      "text/prs.prop.logic": {
        source: "iana"
      },
      "text/prs.texi": {
        source: "iana"
      },
      "text/raptorfec": {
        source: "iana"
      },
      "text/red": {
        source: "iana"
      },
      "text/rfc822-headers": {
        source: "iana"
      },
      "text/richtext": {
        source: "iana",
        compressible: true,
        extensions: ["rtx"]
      },
      "text/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "text/rtp-enc-aescm128": {
        source: "iana"
      },
      "text/rtploopback": {
        source: "iana"
      },
      "text/rtx": {
        source: "iana"
      },
      "text/sgml": {
        source: "iana",
        extensions: ["sgml", "sgm"]
      },
      "text/shaclc": {
        source: "iana"
      },
      "text/shex": {
        source: "iana",
        extensions: ["shex"]
      },
      "text/slim": {
        extensions: ["slim", "slm"]
      },
      "text/spdx": {
        source: "iana",
        extensions: ["spdx"]
      },
      "text/strings": {
        source: "iana"
      },
      "text/stylus": {
        extensions: ["stylus", "styl"]
      },
      "text/t140": {
        source: "iana"
      },
      "text/tab-separated-values": {
        source: "iana",
        compressible: true,
        extensions: ["tsv"]
      },
      "text/troff": {
        source: "iana",
        extensions: ["t", "tr", "roff", "man", "me", "ms"]
      },
      "text/turtle": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["ttl"]
      },
      "text/ulpfec": {
        source: "iana"
      },
      "text/uri-list": {
        source: "iana",
        compressible: true,
        extensions: ["uri", "uris", "urls"]
      },
      "text/vcard": {
        source: "iana",
        compressible: true,
        extensions: ["vcard"]
      },
      "text/vnd.a": {
        source: "iana"
      },
      "text/vnd.abc": {
        source: "iana"
      },
      "text/vnd.ascii-art": {
        source: "iana"
      },
      "text/vnd.curl": {
        source: "iana",
        extensions: ["curl"]
      },
      "text/vnd.curl.dcurl": {
        source: "apache",
        extensions: ["dcurl"]
      },
      "text/vnd.curl.mcurl": {
        source: "apache",
        extensions: ["mcurl"]
      },
      "text/vnd.curl.scurl": {
        source: "apache",
        extensions: ["scurl"]
      },
      "text/vnd.debian.copyright": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.dmclientscript": {
        source: "iana"
      },
      "text/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "text/vnd.esmertec.theme-descriptor": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.exchangeable": {
        source: "iana"
      },
      "text/vnd.familysearch.gedcom": {
        source: "iana",
        extensions: ["ged"]
      },
      "text/vnd.ficlab.flt": {
        source: "iana"
      },
      "text/vnd.fly": {
        source: "iana",
        extensions: ["fly"]
      },
      "text/vnd.fmi.flexstor": {
        source: "iana",
        extensions: ["flx"]
      },
      "text/vnd.gml": {
        source: "iana"
      },
      "text/vnd.graphviz": {
        source: "iana",
        extensions: ["gv"]
      },
      "text/vnd.hans": {
        source: "iana"
      },
      "text/vnd.hgl": {
        source: "iana"
      },
      "text/vnd.in3d.3dml": {
        source: "iana",
        extensions: ["3dml"]
      },
      "text/vnd.in3d.spot": {
        source: "iana",
        extensions: ["spot"]
      },
      "text/vnd.iptc.newsml": {
        source: "iana"
      },
      "text/vnd.iptc.nitf": {
        source: "iana"
      },
      "text/vnd.latex-z": {
        source: "iana"
      },
      "text/vnd.motorola.reflex": {
        source: "iana"
      },
      "text/vnd.ms-mediapackage": {
        source: "iana"
      },
      "text/vnd.net2phone.commcenter.command": {
        source: "iana"
      },
      "text/vnd.radisys.msml-basic-layout": {
        source: "iana"
      },
      "text/vnd.senx.warpscript": {
        source: "iana"
      },
      "text/vnd.si.uricatalogue": {
        source: "apache"
      },
      "text/vnd.sosi": {
        source: "iana"
      },
      "text/vnd.sun.j2me.app-descriptor": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["jad"]
      },
      "text/vnd.trolltech.linguist": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.vcf": {
        source: "iana"
      },
      "text/vnd.wap.si": {
        source: "iana"
      },
      "text/vnd.wap.sl": {
        source: "iana"
      },
      "text/vnd.wap.wml": {
        source: "iana",
        extensions: ["wml"]
      },
      "text/vnd.wap.wmlscript": {
        source: "iana",
        extensions: ["wmls"]
      },
      "text/vnd.zoo.kcl": {
        source: "iana"
      },
      "text/vtt": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["vtt"]
      },
      "text/wgsl": {
        source: "iana",
        extensions: ["wgsl"]
      },
      "text/x-asm": {
        source: "apache",
        extensions: ["s", "asm"]
      },
      "text/x-c": {
        source: "apache",
        extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
      },
      "text/x-component": {
        source: "nginx",
        extensions: ["htc"]
      },
      "text/x-fortran": {
        source: "apache",
        extensions: ["f", "for", "f77", "f90"]
      },
      "text/x-gwt-rpc": {
        compressible: true
      },
      "text/x-handlebars-template": {
        extensions: ["hbs"]
      },
      "text/x-java-source": {
        source: "apache",
        extensions: ["java"]
      },
      "text/x-jquery-tmpl": {
        compressible: true
      },
      "text/x-lua": {
        extensions: ["lua"]
      },
      "text/x-markdown": {
        compressible: true,
        extensions: ["mkd"]
      },
      "text/x-nfo": {
        source: "apache",
        extensions: ["nfo"]
      },
      "text/x-opml": {
        source: "apache",
        extensions: ["opml"]
      },
      "text/x-org": {
        compressible: true,
        extensions: ["org"]
      },
      "text/x-pascal": {
        source: "apache",
        extensions: ["p", "pas"]
      },
      "text/x-processing": {
        compressible: true,
        extensions: ["pde"]
      },
      "text/x-sass": {
        extensions: ["sass"]
      },
      "text/x-scss": {
        extensions: ["scss"]
      },
      "text/x-setext": {
        source: "apache",
        extensions: ["etx"]
      },
      "text/x-sfv": {
        source: "apache",
        extensions: ["sfv"]
      },
      "text/x-suse-ymp": {
        compressible: true,
        extensions: ["ymp"]
      },
      "text/x-uuencode": {
        source: "apache",
        extensions: ["uu"]
      },
      "text/x-vcalendar": {
        source: "apache",
        extensions: ["vcs"]
      },
      "text/x-vcard": {
        source: "apache",
        extensions: ["vcf"]
      },
      "text/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml"]
      },
      "text/xml-external-parsed-entity": {
        source: "iana"
      },
      "text/yaml": {
        compressible: true,
        extensions: ["yaml", "yml"]
      },
      "video/1d-interleaved-parityfec": {
        source: "iana"
      },
      "video/3gpp": {
        source: "iana",
        extensions: ["3gp", "3gpp"]
      },
      "video/3gpp-tt": {
        source: "iana"
      },
      "video/3gpp2": {
        source: "iana",
        extensions: ["3g2"]
      },
      "video/av1": {
        source: "iana"
      },
      "video/bmpeg": {
        source: "iana"
      },
      "video/bt656": {
        source: "iana"
      },
      "video/celb": {
        source: "iana"
      },
      "video/dv": {
        source: "iana"
      },
      "video/encaprtp": {
        source: "iana"
      },
      "video/evc": {
        source: "iana"
      },
      "video/ffv1": {
        source: "iana"
      },
      "video/flexfec": {
        source: "iana"
      },
      "video/h261": {
        source: "iana",
        extensions: ["h261"]
      },
      "video/h263": {
        source: "iana",
        extensions: ["h263"]
      },
      "video/h263-1998": {
        source: "iana"
      },
      "video/h263-2000": {
        source: "iana"
      },
      "video/h264": {
        source: "iana",
        extensions: ["h264"]
      },
      "video/h264-rcdo": {
        source: "iana"
      },
      "video/h264-svc": {
        source: "iana"
      },
      "video/h265": {
        source: "iana"
      },
      "video/h266": {
        source: "iana"
      },
      "video/iso.segment": {
        source: "iana",
        extensions: ["m4s"]
      },
      "video/jpeg": {
        source: "iana",
        extensions: ["jpgv"]
      },
      "video/jpeg2000": {
        source: "iana"
      },
      "video/jpm": {
        source: "apache",
        extensions: ["jpm", "jpgm"]
      },
      "video/jxsv": {
        source: "iana"
      },
      "video/lottie+json": {
        source: "iana",
        compressible: true
      },
      "video/matroska": {
        source: "iana"
      },
      "video/matroska-3d": {
        source: "iana"
      },
      "video/mj2": {
        source: "iana",
        extensions: ["mj2", "mjp2"]
      },
      "video/mp1s": {
        source: "iana"
      },
      "video/mp2p": {
        source: "iana"
      },
      "video/mp2t": {
        source: "iana",
        extensions: ["ts", "m2t", "m2ts", "mts"]
      },
      "video/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["mp4", "mp4v", "mpg4"]
      },
      "video/mp4v-es": {
        source: "iana"
      },
      "video/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
      },
      "video/mpeg4-generic": {
        source: "iana"
      },
      "video/mpv": {
        source: "iana"
      },
      "video/nv": {
        source: "iana"
      },
      "video/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogv"]
      },
      "video/parityfec": {
        source: "iana"
      },
      "video/pointer": {
        source: "iana"
      },
      "video/quicktime": {
        source: "iana",
        compressible: false,
        extensions: ["qt", "mov"]
      },
      "video/raptorfec": {
        source: "iana"
      },
      "video/raw": {
        source: "iana"
      },
      "video/rtp-enc-aescm128": {
        source: "iana"
      },
      "video/rtploopback": {
        source: "iana"
      },
      "video/rtx": {
        source: "iana"
      },
      "video/scip": {
        source: "iana"
      },
      "video/smpte291": {
        source: "iana"
      },
      "video/smpte292m": {
        source: "iana"
      },
      "video/ulpfec": {
        source: "iana"
      },
      "video/vc1": {
        source: "iana"
      },
      "video/vc2": {
        source: "iana"
      },
      "video/vnd.cctv": {
        source: "iana"
      },
      "video/vnd.dece.hd": {
        source: "iana",
        extensions: ["uvh", "uvvh"]
      },
      "video/vnd.dece.mobile": {
        source: "iana",
        extensions: ["uvm", "uvvm"]
      },
      "video/vnd.dece.mp4": {
        source: "iana"
      },
      "video/vnd.dece.pd": {
        source: "iana",
        extensions: ["uvp", "uvvp"]
      },
      "video/vnd.dece.sd": {
        source: "iana",
        extensions: ["uvs", "uvvs"]
      },
      "video/vnd.dece.video": {
        source: "iana",
        extensions: ["uvv", "uvvv"]
      },
      "video/vnd.directv.mpeg": {
        source: "iana"
      },
      "video/vnd.directv.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dlna.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dvb.file": {
        source: "iana",
        extensions: ["dvb"]
      },
      "video/vnd.fvt": {
        source: "iana",
        extensions: ["fvt"]
      },
      "video/vnd.hns.video": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsavc": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsmpeg2": {
        source: "iana"
      },
      "video/vnd.motorola.video": {
        source: "iana"
      },
      "video/vnd.motorola.videop": {
        source: "iana"
      },
      "video/vnd.mpegurl": {
        source: "iana",
        extensions: ["mxu", "m4u"]
      },
      "video/vnd.ms-playready.media.pyv": {
        source: "iana",
        extensions: ["pyv"]
      },
      "video/vnd.nokia.interleaved-multimedia": {
        source: "iana"
      },
      "video/vnd.nokia.mp4vr": {
        source: "iana"
      },
      "video/vnd.nokia.videovoip": {
        source: "iana"
      },
      "video/vnd.objectvideo": {
        source: "iana"
      },
      "video/vnd.planar": {
        source: "iana"
      },
      "video/vnd.radgamettools.bink": {
        source: "iana"
      },
      "video/vnd.radgamettools.smacker": {
        source: "apache"
      },
      "video/vnd.sealed.mpeg1": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg4": {
        source: "iana"
      },
      "video/vnd.sealed.swf": {
        source: "iana"
      },
      "video/vnd.sealedmedia.softseal.mov": {
        source: "iana"
      },
      "video/vnd.uvvu.mp4": {
        source: "iana",
        extensions: ["uvu", "uvvu"]
      },
      "video/vnd.vivo": {
        source: "iana",
        extensions: ["viv"]
      },
      "video/vnd.youtube.yt": {
        source: "iana"
      },
      "video/vp8": {
        source: "iana"
      },
      "video/vp9": {
        source: "iana"
      },
      "video/webm": {
        source: "apache",
        compressible: false,
        extensions: ["webm"]
      },
      "video/x-f4v": {
        source: "apache",
        extensions: ["f4v"]
      },
      "video/x-fli": {
        source: "apache",
        extensions: ["fli"]
      },
      "video/x-flv": {
        source: "apache",
        compressible: false,
        extensions: ["flv"]
      },
      "video/x-m4v": {
        source: "apache",
        extensions: ["m4v"]
      },
      "video/x-matroska": {
        source: "apache",
        compressible: false,
        extensions: ["mkv", "mk3d", "mks"]
      },
      "video/x-mng": {
        source: "apache",
        extensions: ["mng"]
      },
      "video/x-ms-asf": {
        source: "apache",
        extensions: ["asf", "asx"]
      },
      "video/x-ms-vob": {
        source: "apache",
        extensions: ["vob"]
      },
      "video/x-ms-wm": {
        source: "apache",
        extensions: ["wm"]
      },
      "video/x-ms-wmv": {
        source: "apache",
        compressible: false,
        extensions: ["wmv"]
      },
      "video/x-ms-wmx": {
        source: "apache",
        extensions: ["wmx"]
      },
      "video/x-ms-wvx": {
        source: "apache",
        extensions: ["wvx"]
      },
      "video/x-msvideo": {
        source: "apache",
        extensions: ["avi"]
      },
      "video/x-sgi-movie": {
        source: "apache",
        extensions: ["movie"]
      },
      "video/x-smv": {
        source: "apache",
        extensions: ["smv"]
      },
      "x-conference/x-cooltalk": {
        source: "apache",
        extensions: ["ice"]
      },
      "x-shader/x-fragment": {
        compressible: true
      },
      "x-shader/x-vertex": {
        compressible: true
      }
    };
  }
});

// ../../node_modules/mime-db/index.js
var require_mime_db = __commonJS({
  "../../node_modules/mime-db/index.js"(exports$1, module) {
    module.exports = require_db();
  }
});

// ../../node_modules/mime-types/mimeScore.js
var require_mimeScore = __commonJS({
  "../../node_modules/mime-types/mimeScore.js"(exports$1, module) {
    var FACET_SCORES = {
      "prs.": 100,
      "x-": 200,
      "x.": 300,
      "vnd.": 400,
      default: 900
    };
    var SOURCE_SCORES = {
      nginx: 10,
      apache: 20,
      iana: 40,
      default: 30
      // definitions added by `jshttp/mime-db` project?
    };
    var TYPE_SCORES = {
      // prefer application/xml over text/xml
      // prefer application/rtf over text/rtf
      application: 1,
      // prefer font/woff over application/font-woff
      font: 2,
      // prefer video/mp4 over audio/mp4 over application/mp4
      // See https://www.rfc-editor.org/rfc/rfc4337.html#section-2
      audio: 2,
      video: 3,
      default: 0
    };
    module.exports = function mimeScore(mimeType, source = "default") {
      if (mimeType === "application/octet-stream") {
        return 0;
      }
      const [type, subtype] = mimeType.split("/");
      const facet = subtype.replace(/(\.|x-).*/, "$1");
      const facetScore = FACET_SCORES[facet] || FACET_SCORES.default;
      const sourceScore = SOURCE_SCORES[source] || SOURCE_SCORES.default;
      const typeScore = TYPE_SCORES[type] || TYPE_SCORES.default;
      const lengthScore = 1 - mimeType.length / 100;
      return facetScore + sourceScore + typeScore + lengthScore;
    };
  }
});

// ../../node_modules/mime-types/index.js
var require_mime_types = __commonJS({
  "../../node_modules/mime-types/index.js"(exports$1) {
    var db = require_mime_db();
    var extname = __require("path").extname;
    var mimeScore = require_mimeScore();
    var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    var TEXT_TYPE_REGEXP = /^text\//i;
    exports$1.charset = charset;
    exports$1.charsets = { lookup: charset };
    exports$1.contentType = contentType;
    exports$1.extension = extension;
    exports$1.extensions = /* @__PURE__ */ Object.create(null);
    exports$1.lookup = lookup;
    exports$1.types = /* @__PURE__ */ Object.create(null);
    exports$1._extensionConflicts = [];
    populateMaps(exports$1.extensions, exports$1.types);
    function charset(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var mime = match && db[match[1].toLowerCase()];
      if (mime && mime.charset) {
        return mime.charset;
      }
      if (match && TEXT_TYPE_REGEXP.test(match[1])) {
        return "UTF-8";
      }
      return false;
    }
    function contentType(str) {
      if (!str || typeof str !== "string") {
        return false;
      }
      var mime = str.indexOf("/") === -1 ? exports$1.lookup(str) : str;
      if (!mime) {
        return false;
      }
      if (mime.indexOf("charset") === -1) {
        var charset2 = exports$1.charset(mime);
        if (charset2) mime += "; charset=" + charset2.toLowerCase();
      }
      return mime;
    }
    function extension(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var exts = match && exports$1.extensions[match[1].toLowerCase()];
      if (!exts || !exts.length) {
        return false;
      }
      return exts[0];
    }
    function lookup(path) {
      if (!path || typeof path !== "string") {
        return false;
      }
      var extension2 = extname("x." + path).toLowerCase().slice(1);
      if (!extension2) {
        return false;
      }
      return exports$1.types[extension2] || false;
    }
    function populateMaps(extensions, types) {
      Object.keys(db).forEach(function forEachMimeType(type) {
        var mime = db[type];
        var exts = mime.extensions;
        if (!exts || !exts.length) {
          return;
        }
        extensions[type] = exts;
        for (var i = 0; i < exts.length; i++) {
          var extension2 = exts[i];
          types[extension2] = _preferredType(extension2, types[extension2], type);
          const legacyType = _preferredTypeLegacy(
            extension2,
            types[extension2],
            type
          );
          if (legacyType !== types[extension2]) {
            exports$1._extensionConflicts.push([extension2, legacyType, types[extension2]]);
          }
        }
      });
    }
    function _preferredType(ext, type0, type1) {
      var score0 = type0 ? mimeScore(type0, db[type0].source) : 0;
      var score1 = type1 ? mimeScore(type1, db[type1].source) : 0;
      return score0 > score1 ? type0 : type1;
    }
    function _preferredTypeLegacy(ext, type0, type1) {
      var SOURCE_RANK = ["nginx", "apache", void 0, "iana"];
      var score0 = type0 ? SOURCE_RANK.indexOf(db[type0].source) : 0;
      var score1 = type1 ? SOURCE_RANK.indexOf(db[type1].source) : 0;
      if (exports$1.types[extension] !== "application/octet-stream" && (score0 > score1 || score0 === score1 && exports$1.types[extension]?.slice(0, 12) === "application/")) {
        return type0;
      }
      return score0 > score1 ? type0 : type1;
    }
  }
});

// ../core/src/constants.ts
var DEFAULT_BROWSER = "chrome_145";
var DEFAULT_OS = "windows";
var DEFAULT_MAX_CHARS = 5e4;
var DEFAULT_TIMEOUT_MS = 15e3;
var DEFAULT_BATCH_CONCURRENCY = 8;
var DEFAULT_INCLUDE_REPLIES = "extractors";
var DEFAULT_ACCEPT_HEADER = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
var DEFAULT_RAW_ACCEPT_HEADER = "text/html,application/xhtml+xml,application/json,application/xml;q=0.9,text/markdown;q=0.8,text/plain;q=0.8,*/*;q=0.7";
var DEFAULT_JSON_ACCEPT_HEADER = "application/json,text/json,application/ld+json;q=0.9,text/plain;q=0.8,*/*;q=0.7";
var DEFAULT_ACCEPT_LANGUAGE_HEADER = "en-US,en;q=0.9";

// ../core/src/extract.ts
var import_deburr = __toESM(require_deburr());
var import_mime_types = __toESM(require_mime_types());
var runtimeDependencies = {
  fetch: fetch,
  defuddle: Defuddle,
  getProfiles
};
function parseLinkedomHTML(html, url) {
  const { document } = parseHTML(html);
  const doc = document;
  const defaultView = doc.defaultView;
  if (!doc.styleSheets) {
    doc.styleSheets = [];
  }
  if (defaultView && !defaultView.getComputedStyle) {
    defaultView.getComputedStyle = (() => ({
      display: ""
    }));
  }
  if (url) {
    doc.URL = url;
  }
  return document;
}

// ../core/src/format.ts
function isFileFetchResult(result) {
  return result.kind === "file";
}
function buildHeader(parts) {
  return parts.filter(([, value]) => value !== void 0 && value !== "").map(([label, value]) => `> ${label}: ${value}`).join("\n");
}
function formatByteCount(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}
function formatDurationMs(durationMs) {
  if (durationMs < 1e3) {
    return `${durationMs}ms`;
  }
  const seconds = durationMs / 1e3;
  if (seconds < 60) {
    return `${durationMs}ms (${seconds.toFixed(seconds >= 10 ? 0 : 1)}s)`;
  }
  const minutes = seconds / 60;
  return `${durationMs}ms (${minutes.toFixed(minutes >= 10 ? 0 : 1)}m)`;
}
function describeErrorPhase(phase) {
  switch (phase) {
    case "validation":
      return "validating the request";
    case "connecting":
      return "connecting";
    case "waiting":
      return "waiting for the server response";
    case "loading":
      return "downloading the response body";
    case "processing":
      return "processing the response";
    default:
      return "unknown";
  }
}
function roundSuggestedTimeoutMs(value) {
  if (value <= 1e4) return Math.ceil(value / 1e3) * 1e3;
  if (value <= 6e4) return Math.ceil(value / 5e3) * 5e3;
  if (value <= 3e5) return Math.ceil(value / 1e4) * 1e4;
  return Math.ceil(value / 3e4) * 3e4;
}
function suggestRetryTimeoutMs(error) {
  if (!error.timeoutMs || error.timeoutMs <= 0) {
    return void 0;
  }
  if (error.phase === "loading" && error.contentLength && error.downloadedBytes && error.downloadedBytes > 0) {
    const projectedMs = error.timeoutMs * error.contentLength / error.downloadedBytes;
    return roundSuggestedTimeoutMs(projectedMs * 1.5);
  }
  if (error.phase === "processing") {
    return roundSuggestedTimeoutMs(error.timeoutMs * 2);
  }
  if (error.phase === "connecting" || error.phase === "waiting") {
    return roundSuggestedTimeoutMs(Math.max(error.timeoutMs * 2, 3e4));
  }
  return roundSuggestedTimeoutMs(error.timeoutMs * 2);
}
function buildUserFacingFetchErrorSummary(error) {
  if (error.code === "http_error" && error.statusCode) {
    return `Server responded with ${error.statusCode}${error.statusText ? ` ${error.statusText}` : ""}`;
  }
  switch (error.code) {
    case "invalid_url":
      return "That URL is invalid.";
    case "unsupported_protocol":
      return "Only http and https URLs are supported.";
    case "timeout":
      switch (error.phase) {
        case "connecting":
          return "Timed out while connecting to the server.";
        case "waiting":
          return "The server took too long to start responding.";
        case "loading":
          return error.mimeType && !error.mimeType.startsWith("text/") ? "Timed out while downloading the file." : "Timed out while downloading the response.";
        case "processing":
          return "Timed out while processing the response.";
        default:
          return "The request timed out.";
      }
    case "unexpected_response":
      return "The response format was unexpected.";
    case "download_error":
      return "The file could not be saved locally.";
    case "no_content":
      return "No readable content could be extracted from the page.";
    case "processing_error":
      return "The response could not be processed.";
    case "network_error": {
      if (/dns error/i.test(error.error)) {
        return "DNS error \u2014 could not resolve the hostname.";
      }
      if (/connection failed|connection refused|unreachable/i.test(error.error)) {
        return "Connection failed \u2014 the server is unreachable.";
      }
      if (/tls|ssl/i.test(error.error)) {
        return "TLS/SSL error \u2014 certificate may be invalid.";
      }
      return "The request failed before a usable response was returned.";
    }
    default:
      return error.error;
  }
}
function buildFetchErrorResponseText(error) {
  const lines = [`Error: ${error.error}`];
  if (error.code === "timeout" || error.code === "http_error" || error.code === "download_error") {
    const metadata = buildHeader([
      ["URL", error.url],
      ["Final URL", error.finalUrl],
      ["Phase", error.phase ? describeErrorPhase(error.phase) : void 0],
      [
        "Timeout",
        error.timeoutMs ? formatDurationMs(error.timeoutMs) : void 0
      ],
      [
        "HTTP status",
        error.statusCode ? `${error.statusCode}${error.statusText ? ` ${error.statusText}` : ""}` : void 0
      ],
      ["Mime type", error.mimeType],
      [
        "Content-Length",
        error.contentLength !== void 0 ? `${error.contentLength} bytes (${formatByteCount(error.contentLength)})` : void 0
      ],
      [
        "Downloaded before failure",
        error.downloadedBytes !== void 0 ? `${error.downloadedBytes} bytes (${formatByteCount(error.downloadedBytes)})` : void 0
      ],
      [
        "Suggested timeoutMs",
        error.code === "timeout" ? suggestRetryTimeoutMs(error) : void 0
      ]
    ]);
    if (metadata) {
      lines.push("", metadata);
    }
  }
  if (error.code === "timeout") {
    lines.push(
      "",
      "The timeoutMs parameter is configurable. Retry this call with a higher timeoutMs value."
    );
  } else if (error.code === "http_error") {
    if (error.statusCode === 429) {
      lines.push(
        "",
        "The server rate-limited this request. Retrying later or using a different proxy may help."
      );
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      lines.push(
        "",
        "The server rejected this request. Authentication, a different browser profile, or a different proxy may be required."
      );
    } else if ((error.statusCode ?? 0) >= 500) {
      lines.push(
        "",
        "The server failed while processing the request. Retrying later may help."
      );
    }
  } else if (error.code === "download_error") {
    lines.push(
      "",
      "The download failed before completion. Retrying may help, especially if the connection was interrupted."
    );
  } else if (error.retryable) {
    lines.push("", "Retrying this request may help.");
  }
  return lines.join("\n");
}
function markdownToText(markdown) {
  return markdown.replace(/^#{1,6}\s+/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/^>\s+/gm, "").replace(/^[-*+]\s+/gm, "\u2022 ").replace(/`([^`]+)`/g, "$1");
}
function truncateContent(content, maxChars) {
  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars)}

[... truncated]`;
}
function buildCompactMetadataHeader(result) {
  if (isFileFetchResult(result)) {
    return buildHeader([
      ["URL", result.finalUrl],
      ["File size", result.fileSize],
      ["Mime type", result.mimeType],
      ["File path", result.filePath]
    ]);
  }
  return buildHeader([
    ["URL", result.finalUrl],
    ["Title", result.title],
    ["Author", result.author],
    ["Published", result.published],
    ["Content-Type", result.contentType]
  ]);
}
function buildMetadataHeader(result) {
  if (isFileFetchResult(result)) {
    return buildHeader([
      ["URL", result.finalUrl],
      ["File size", result.fileSize],
      ["Mime type", result.mimeType],
      ["File path", result.filePath],
      ["Browser", `${result.browser}/${result.os}`]
    ]);
  }
  return buildHeader([
    ["URL", result.finalUrl],
    ["Title", result.title],
    ["Author", result.author],
    ["Published", result.published],
    ["Content-Type", result.contentType],
    ["Site", result.site],
    ["Language", result.language],
    ["Words", result.wordCount],
    ["Browser", `${result.browser}/${result.os}`]
  ]);
}
function buildFetchResponseText(result, options = {}) {
  const header = options.verbose ? buildMetadataHeader(result) : buildCompactMetadataHeader(result);
  if (isFileFetchResult(result)) {
    return header;
  }
  return header ? `${header}

${result.content}` : result.content;
}
function buildBatchItemHeading(item, total) {
  const ordinal = item.index + 1;
  const url = item.result?.finalUrl ?? item.request.url;
  return `## [${ordinal}/${total}] ${url}`;
}
function buildBatchItemText(item, total, options = {}) {
  const heading = buildBatchItemHeading(item, total);
  if (item.status === "error") {
    const errorText = item.error ?? "Unknown error";
    if (errorText.includes("\n")) {
      return `${heading}
${errorText}`;
    }
    const errorHeader = buildHeader([
      ["URL", item.request.url],
      ["Status", "error"],
      ["Error", errorText.replace(/^Error:\s+/, "")]
    ]);
    return `${heading}
${errorHeader}`;
  }
  return `${heading}
${buildFetchResponseText(item.result, options)}`;
}
function buildBatchFetchResponseText(result, options = {}) {
  const summary = buildHeader([
    ["Requests", result.total],
    ["Succeeded", result.succeeded],
    ["Failed", result.failed],
    ["Concurrency", result.batchConcurrency]
  ]);
  const items = result.items.map(
    (item) => buildBatchItemText(item, result.total, options)
  );
  return [summary, ...items].filter(Boolean).join("\n\n");
}
function estimateWordCount(content) {
  const words = content.trim().match(/\S+/g);
  return words?.length ?? 0;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function parseAndFormatJson(raw) {
  try {
    return {
      formatted: JSON.stringify(JSON.parse(raw), null, 2)
    };
  } catch {
    return { error: "Invalid JSON response" };
  }
}
function renderJsonContent(formattedJson, format) {
  switch (format) {
    case "json":
    case "text":
      return formattedJson;
    case "html":
      return `<pre><code class="language-json">${escapeHtml(formattedJson)}</code></pre>`;
    default:
      return `\`\`\`json
${formattedJson}
\`\`\``;
  }
}
function stripExtractorComments(content, format) {
  if (format === "html") {
    return content.replace(/\s*<hr>\s*<div class="[^"]* comments">[\s\S]*$/i, "").trimEnd();
  }
  return content.replace(/\n---\n+## Comments\n[\s\S]*$/i, "").trimEnd();
}

// ../core/src/extract.ts
var HTML_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
  "text/plain",
  "text/markdown"
];
var MAX_CLIENT_SIDE_REDIRECTS = 5;
var MAX_ALTERNATE_LINK_FALLBACKS = 3;
var MIN_EXTRACTED_WORDS_BEFORE_ALTERNATE_FALLBACK = 30;
function normalizeContentType(contentType) {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}
function isAttachmentDisposition(contentDisposition) {
  return /^attachment(?:\s*;|\s*$)/i.test(contentDisposition.trim());
}
function isTextualContentType(contentType) {
  const normalized = normalizeContentType(contentType);
  return normalized.startsWith("text/") || normalized === "application/json" || normalized === "text/json" || normalized.endsWith("+json") || normalized === "application/xml" || normalized === "text/xml" || normalized.endsWith("+xml") || normalized === "application/javascript" || normalized === "application/x-javascript" || normalized === "application/ecmascript" || normalized === "image/svg+xml";
}
function sanitizeBaseName(value) {
  const sanitized = (0, import_deburr.default)(value).replace(/[\\/]+/g, "-").replace(/[^A-Za-z0-9._ -]+/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^\.+/, "").replace(/[. -]+$/g, "");
  return sanitized;
}
function sanitizeExtension(value) {
  const raw = (0, import_deburr.default)(value).replace(/^[.\s]+/, "").replace(/[\\/]+/g, "").replace(/[^A-Za-z0-9_-]+/g, "").toLowerCase();
  return raw ? `.${raw}` : "";
}
function decodeContentDispositionFilename(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function extractContentDispositionFilename(contentDisposition) {
  const filenameStarMatch = contentDisposition.match(/filename\*=([^;]+)/i);
  const filenameMatch = contentDisposition.match(
    /filename=(?:"([^"]+)"|([^;]+))/i
  );
  const rawFilename = filenameStarMatch?.[1] ? (() => {
    const value = filenameStarMatch[1].trim();
    const encoded = value.includes("''") ? value.split("''").slice(1).join("''") : value;
    return decodeContentDispositionFilename(encoded.replace(/^"|"$/g, ""));
  })() : (filenameMatch?.[1] ?? filenameMatch?.[2] ?? "").trim();
  if (!rawFilename) {
    return {};
  }
  const sanitizedFilename = rawFilename.replace(/^"|"$/g, "").replace(/[\\/]+/g, "-");
  const parsed = parse(sanitizedFilename);
  return {
    baseName: sanitizeBaseName(parsed.name || sanitizedFilename),
    extension: sanitizeExtension(parsed.ext)
  };
}
function deriveUrlPathName(url) {
  try {
    const parsedUrl = new URL(url);
    const lastSegment = parsedUrl.pathname.split("/").filter(Boolean).at(-1);
    if (!lastSegment) {
      return {};
    }
    const decodedSegment = decodeContentDispositionFilename(lastSegment);
    const parsedSegment = parse(decodedSegment);
    return {
      baseName: sanitizeBaseName(parsedSegment.name || decodedSegment),
      extension: sanitizeExtension(parsedSegment.ext)
    };
  } catch {
    return {};
  }
}
function resolveExtensionFromMimeType(contentType) {
  const extension = (0, import_mime_types.extension)(normalizeContentType(contentType));
  return sanitizeExtension(typeof extension === "string" ? extension : "") || ".dat";
}
function resolveDownloadTarget(finalUrl, contentDisposition, contentType) {
  const fromDisposition = extractContentDispositionFilename(contentDisposition);
  const fromUrl = deriveUrlPathName(finalUrl);
  const baseName = fromDisposition.baseName || fromUrl.baseName || sanitizeBaseName(randomUUID());
  const extension = fromDisposition.extension || resolveExtensionFromMimeType(contentType);
  return {
    fileName: `${baseName}${extension}`,
    extension: extension || ".dat"
  };
}
async function cleanupPartialFile(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }
}
async function streamResponseToFile(response, filePath) {
  await mkdir(parse(filePath).dir, { recursive: true });
  let fileSize = 0;
  if (response.body) {
    const output = createWriteStream(filePath, { flags: "wx", mode: 384 });
    const reader = response.body.getReader();
    let opened = false;
    try {
      await new Promise((resolve, reject) => {
        output.once("open", () => {
          opened = true;
          resolve();
        });
        output.once("error", reject);
      });
      const finished = new Promise((resolve, reject) => {
        output.once("finish", () => resolve());
        output.once("error", reject);
      });
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          fileSize += value.byteLength;
          if (!output.write(Buffer.from(value))) {
            await once(output, "drain");
          }
        }
      }
      output.end();
      await finished;
      await chmod(filePath, 384);
      return fileSize;
    } catch (error) {
      output.destroy();
      try {
        await reader.cancel(
          error instanceof Error ? error.message : String(error)
        );
      } catch {
      }
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        throw error;
      }
      if (opened) {
        await cleanupPartialFile(filePath);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
  if (response.readable) {
    const source = response.readable();
    source.on("data", (chunk) => {
      fileSize += typeof chunk === "string" ? Buffer.byteLength(chunk) : chunk.byteLength;
    });
    try {
      await pipeline(
        source,
        createWriteStream(filePath, { flags: "wx", mode: 384 })
      );
      await chmod(filePath, 384);
      return fileSize;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        throw error;
      }
      await cleanupPartialFile(filePath);
      throw error;
    }
  }
  const body = response.arrayBuffer ? new Uint8Array(await response.arrayBuffer()) : new TextEncoder().encode(await response.text());
  fileSize = body.byteLength;
  try {
    await writeFile(filePath, body, { mode: 384, flag: "wx" });
    await chmod(filePath, 384);
    return fileSize;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      throw error;
    }
    await cleanupPartialFile(filePath);
    throw error;
  }
}
function isPlainTextContentType(contentType) {
  const normalized = normalizeContentType(contentType);
  return normalized === "text/plain" || normalized === "text/markdown";
}
function renderPlainTextContent(body, format) {
  if (format === "html") {
    return `<pre>${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
  }
  return body;
}
function buildPlainTextResult(opts, finalUrl, rawBody, format, maxChars, browser, os) {
  const normalizedBody = rawBody.replace(/\r\n/g, "\n").trim();
  return {
    kind: "content",
    url: opts.url,
    finalUrl,
    title: "",
    author: "",
    published: "",
    site: new URL(finalUrl).hostname,
    language: "",
    wordCount: estimateWordCount(normalizedBody),
    content: truncateContent(
      renderPlainTextContent(normalizedBody, format),
      maxChars
    ),
    browser,
    os
  };
}
function isTwitterJsDisabledPage(document, url) {
  if (!/^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\//i.test(url))
    return false;
  const text = document.body?.textContent ?? document.documentElement?.textContent ?? "";
  return text.includes("JavaScript is disabled") && text.includes("supported browser");
}
function extractDomTextFallback(document) {
  const bodyText = document.body?.textContent ?? document.documentElement?.textContent ?? "";
  return bodyText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").split("\n").map((line) => line.trim()).join("\n").replace(/[ \t]{2,}/g, " ").trim();
}
function escapeMarkdownText(value) {
  return value.replace(/([\\`*_{}[\]()+#.!|>-])/g, "\\$1");
}
function normalizeInlineWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
function renderInlineMarkdown(node) {
  if (node.nodeType === 3) {
    return normalizeInlineWhitespace(node.textContent ?? "");
  }
  if (node.nodeType !== 1) {
    return "";
  }
  const element = node;
  const tag = element.tagName.toLowerCase();
  if (["script", "style", "meta", "link"].includes(tag)) {
    return "";
  }
  if (tag === "br") {
    return "  \n";
  }
  if (tag === "code") {
    const content = normalizeInlineWhitespace(element.textContent ?? "");
    return content ? `\`${content}\`` : "";
  }
  if (tag === "img") {
    const alt = element.getAttribute("alt") ?? "";
    const src = element.getAttribute("src") ?? "";
    return src ? `![${escapeMarkdownText(alt)}](${src})` : "";
  }
  const childContent = Array.from(element.childNodes).map(renderInlineMarkdown).join(" ").replace(/\s+/g, " ").trim();
  if (tag === "a") {
    const href = element.getAttribute("href") ?? "";
    if (!href) return childContent;
    return `[${childContent || href}](${href})`;
  }
  if (["strong", "b"].includes(tag)) {
    return childContent ? `**${childContent}**` : "";
  }
  if (["em", "i"].includes(tag)) {
    return childContent ? `*${childContent}*` : "";
  }
  return childContent;
}
function renderBlockMarkdown(node, depth = 0) {
  if (node.nodeType === 3) {
    const text = normalizeInlineWhitespace(node.textContent ?? "");
    return text ? `${text}

` : "";
  }
  if (node.nodeType !== 1) {
    return "";
  }
  const element = node;
  const tag = element.tagName.toLowerCase();
  if (["script", "style", "meta", "link"].includes(tag)) {
    return "";
  }
  if (/^h[1-6]$/.test(tag)) {
    const level = Number.parseInt(tag.slice(1), 10);
    const content = Array.from(element.childNodes).map(renderInlineMarkdown).join(" ").replace(/\s+/g, " ").trim();
    return content ? `${"#".repeat(level)} ${content}

` : "";
  }
  if (tag === "p") {
    const content = Array.from(element.childNodes).map(renderInlineMarkdown).join(" ").replace(/\s+/g, " ").trim();
    return content ? `${content}

` : "";
  }
  if (tag === "pre") {
    const content = (element.textContent ?? "").trim();
    return content ? `\`\`\`
${content}
\`\`\`

` : "";
  }
  if (tag === "blockquote") {
    const content = Array.from(element.childNodes).map((child) => renderBlockMarkdown(child, depth)).join("").trim();
    if (!content) return "";
    return `${content.split("\n").map((line) => line ? `> ${line}` : ">").join("\n")}

`;
  }
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "li").map((child, index) => {
      const prefix = tag === "ol" ? `${index + 1}. ` : "- ";
      const content = Array.from(child.childNodes).map((grandchild) => {
        const childTag = grandchild.nodeType === 1 ? grandchild.tagName.toLowerCase() : "";
        return childTag === "ul" || childTag === "ol" ? `
${renderBlockMarkdown(grandchild, depth + 1)}` : renderInlineMarkdown(grandchild);
      }).join(" ").replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").replace(/\s+/g, " ").trim();
      if (!content) return "";
      const indented = content.split("\n").map(
        (line, lineIndex) => lineIndex === 0 ? `${"  ".repeat(depth)}${prefix}${line}` : `${"  ".repeat(depth + 1)}${line}`
      ).join("\n");
      return indented;
    }).filter(Boolean).join("\n");
    return items ? `${items}

` : "";
  }
  if (tag === "hr") {
    return "---\n\n";
  }
  const blockContent = Array.from(element.childNodes).map((child) => renderBlockMarkdown(child, depth)).join("");
  if (blockContent.trim()) {
    return blockContent;
  }
  const inlineContent = Array.from(element.childNodes).map(renderInlineMarkdown).join(" ").replace(/\s+/g, " ").trim();
  return inlineContent ? `${inlineContent}

` : "";
}
function extractDomMarkdownFallback(document) {
  const root = document.body ?? document.documentElement;
  if (!root) return "";
  return Array.from(root.childNodes).map((node) => renderBlockMarkdown(node)).join("").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function emitProgress(hooks, update) {
  hooks.onProgressChange?.(update);
}
function emitStatus(hooks, status) {
  hooks.onStatusChange?.(status);
}
function formatByteCount2(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}
function parseContentLengthHeader(value) {
  if (!value) return void 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : void 0;
}
function isTimeoutError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /timed out|timeout|deadline exceeded|abort(?:ed)?/i.test(message);
}
function isDnsError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /dns error|failed to lookup address|nodename nor servname provided|name resolution failed/i.test(
    message
  );
}
function isConnectError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /client error \(connect\)|connection refused|tcp connect error|connection reset|network unreachable|no route to host/i.test(
    message
  );
}
function isTlsError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /ssl.*error|tls.*error|bad certificate|certificate.*invalid|unknown.*issuer/i.test(
    message
  );
}
function extractHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
function buildTimeoutError(context) {
  const targetUrl = context.finalUrl ?? context.url;
  const timeoutLabel = `${context.timeoutMs}ms`;
  if (context.phase === "connecting") {
    return {
      error: `Timeout of ${timeoutLabel} exceeded while connecting to ${targetUrl}.`,
      code: "timeout",
      phase: "connecting",
      retryable: true,
      timeoutMs: context.timeoutMs,
      url: context.url,
      finalUrl: context.finalUrl
    };
  }
  if (context.phase === "waiting") {
    return {
      error: `Timeout of ${timeoutLabel} exceeded while waiting for ${targetUrl} to start responding.`,
      code: "timeout",
      phase: "waiting",
      retryable: true,
      timeoutMs: context.timeoutMs,
      url: context.url,
      finalUrl: context.finalUrl
    };
  }
  if (context.phase === "loading") {
    const sizeHint = context.contentLength ? ` a ${formatByteCount2(context.contentLength)} ${context.mimeType && !isTextualContentType(context.mimeType) ? "file" : "response"}` : " the response body";
    return {
      error: `Timeout of ${timeoutLabel} exceeded while downloading${sizeHint} from ${targetUrl}.`,
      code: "timeout",
      phase: "loading",
      retryable: true,
      timeoutMs: context.timeoutMs,
      url: context.url,
      finalUrl: context.finalUrl,
      statusCode: context.statusCode,
      statusText: context.statusText,
      mimeType: context.mimeType,
      contentLength: context.contentLength,
      downloadedBytes: context.downloadedBytes
    };
  }
  if (context.phase === "processing") {
    return {
      error: `Timeout of ${timeoutLabel} exceeded while processing the response from ${targetUrl}.`,
      code: "timeout",
      phase: "processing",
      retryable: true,
      timeoutMs: context.timeoutMs,
      url: context.url,
      finalUrl: context.finalUrl,
      statusCode: context.statusCode,
      statusText: context.statusText,
      mimeType: context.mimeType,
      contentLength: context.contentLength,
      downloadedBytes: context.downloadedBytes
    };
  }
  return {
    error: `Timeout of ${timeoutLabel} exceeded while fetching ${targetUrl}.`,
    code: "timeout",
    phase: context.phase,
    retryable: true,
    timeoutMs: context.timeoutMs,
    url: context.url,
    finalUrl: context.finalUrl,
    statusCode: context.statusCode,
    statusText: context.statusText,
    mimeType: context.mimeType,
    contentLength: context.contentLength,
    downloadedBytes: context.downloadedBytes
  };
}
function buildThrownFetchError(error, context) {
  if (isTimeoutError(error)) {
    return buildTimeoutError(context);
  }
  const hostname = extractHostname(context.url);
  if (isDnsError(error)) {
    return {
      error: `DNS error: failed to lookup address for ${hostname}. Check the URL and try again.`,
      code: "network_error",
      phase: "connecting",
      retryable: false,
      url: context.url,
      finalUrl: context.finalUrl
    };
  }
  if (isConnectError(error)) {
    return {
      error: `Connection failed to ${hostname}. The server may be unreachable or blocking requests.`,
      code: "network_error",
      phase: "connecting",
      retryable: true,
      url: context.url,
      finalUrl: context.finalUrl
    };
  }
  if (isTlsError(error)) {
    return {
      error: `TLS/SSL error connecting to ${hostname}. The server's certificate may be invalid.`,
      code: "network_error",
      phase: "connecting",
      retryable: false,
      url: context.url,
      finalUrl: context.finalUrl
    };
  }
  const isConnectLevel = isDnsError(error) || isConnectError(error) || isTlsError(error);
  const effectivePhase = isConnectLevel ? "connecting" : context.phase;
  const message = error instanceof Error ? error.message : String(error);
  const targetUrl = context.finalUrl ?? context.url;
  const phaseDescription = effectivePhase === "loading" ? "downloading the response" : effectivePhase === "waiting" ? "waiting for the server response" : effectivePhase === "connecting" ? "connecting" : "fetching";
  return {
    error: effectivePhase === "processing" ? `Failed while processing the response from ${targetUrl}: ${message}` : `Request failed while ${phaseDescription} for ${targetUrl}: ${message}`,
    code: effectivePhase === "processing" ? "processing_error" : effectivePhase === "loading" && context.mimeType ? "download_error" : "network_error",
    phase: effectivePhase,
    retryable: effectivePhase !== "processing",
    timeoutMs: context.timeoutMs,
    url: context.url,
    finalUrl: context.finalUrl,
    statusCode: context.statusCode,
    statusText: context.statusText,
    mimeType: context.mimeType,
    contentLength: context.contentLength,
    downloadedBytes: context.downloadedBytes
  };
}
function mapRequestEventToProgress(event) {
  switch (event.type) {
    case "request_start":
      return { status: "connecting", progress: 0, phase: event.type };
    case "request_sent":
      return { status: "waiting", progress: 0.11, phase: event.type };
    case "response_headers":
      return { status: "loading", progress: 0.51, phase: event.type };
    case "body_progress": {
      const contentLength = event.contentLength;
      const downloadedBytes = event.downloadedBytes ?? 0;
      const bodyFraction = contentLength && contentLength > 0 ? Math.max(0, Math.min(1, downloadedBytes / contentLength)) : Math.max(0, Math.min(1, downloadedBytes / 65536));
      return {
        status: "loading",
        progress: contentLength && contentLength > 0 ? 0.51 + bodyFraction * 0.44 : 0.51,
        phase: event.type
      };
    }
    case "body_complete":
      return { status: "loading", progress: 0.95, phase: event.type };
    case "done":
      return { status: "done", progress: 1, phase: event.type };
    case "error":
      return { status: "error", progress: 1, phase: event.type };
    default:
      return null;
  }
}
function resolveAcceptHeader(format) {
  if (format === "json") return DEFAULT_JSON_ACCEPT_HEADER;
  if (format === "raw") return DEFAULT_RAW_ACCEPT_HEADER;
  return DEFAULT_ACCEPT_HEADER;
}
function isJsonContentType(contentType) {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return normalized === "application/json" || normalized === "text/json" || normalized.endsWith("+json");
}
function isLikelyJsonBody(body) {
  const trimmed = body.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}
function isJsonResponse(contentType, body) {
  return isJsonContentType(contentType) || isLikelyJsonBody(body);
}
function decodeHtmlAttribute(value) {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}
function extractQualifiedAlternateLinks(document, baseUrl, format) {
  const acceptedTypes = {
    markdown: ["text/markdown", "text/x-markdown"],
    text: ["text/plain", "text/markdown", "text/x-markdown"],
    html: ["text/html", "application/xhtml+xml"],
    json: ["application/json", "text/json"],
    raw: []
  };
  const accepted = acceptedTypes[format];
  const head = document.head;
  if (!head) return [];
  const links = Array.from(head.querySelectorAll("link"));
  const candidates = [];
  for (const link of links) {
    const rel = (link.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
    if (!rel.includes("alternate")) continue;
    const type = normalizeContentType(link.getAttribute("type") ?? "");
    const isAccepted = accepted.some((value) => type === value) || format === "json" && type.endsWith("+json");
    if (!isAccepted) continue;
    const href = link.getAttribute("href");
    if (!href) continue;
    try {
      const target = new URL(href, baseUrl).toString();
      if (target !== baseUrl && !candidates.includes(target)) {
        candidates.push(target);
      }
    } catch {
    }
  }
  return candidates;
}
function extractClientSideRedirect(body, baseUrl) {
  const snippet = body.slice(0, 4096);
  const metaRefreshMatch = snippet.match(
    /<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?([^"'>]*)["']?[^>]*>/i
  );
  const refreshContent = metaRefreshMatch?.[1];
  if (!refreshContent) {
    return null;
  }
  const [delayPart = "", ...rest] = decodeHtmlAttribute(refreshContent).split(";");
  const delaySeconds = Number.parseFloat(delayPart.trim());
  const urlMatch = rest.join(";").match(/\burl\s*=\s*(.+)$/i);
  const rawTarget = urlMatch?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  if (!rawTarget || !Number.isFinite(delaySeconds) || delaySeconds < 0 || delaySeconds >= 30) {
    return null;
  }
  try {
    const targetUrl = new URL(rawTarget, baseUrl).toString();
    return targetUrl === baseUrl ? null : targetUrl;
  } catch {
    return null;
  }
}
function buildJsonResult(opts, finalUrl, rawBody, format, maxChars, browser, os) {
  const parsedJson = parseAndFormatJson(rawBody);
  if ("error" in parsedJson) {
    return parsedJson;
  }
  const content = truncateContent(
    renderJsonContent(parsedJson.formatted, format),
    maxChars
  );
  return {
    kind: "content",
    url: opts.url,
    finalUrl,
    title: "",
    author: "",
    published: "",
    site: new URL(finalUrl).hostname,
    language: "",
    wordCount: estimateWordCount(parsedJson.formatted),
    content,
    browser,
    os
  };
}
async function buildFileResult(opts, response, finalUrl, contentType, contentDisposition, browser, os) {
  const tempDir = opts.tempDir || join(tmpdir(), "smart-fetch");
  await mkdir(tempDir, { recursive: true });
  const { fileName, extension } = resolveDownloadTarget(
    finalUrl,
    contentDisposition,
    contentType
  );
  let filePath = join(tempDir, fileName);
  let attempt = 1;
  while (attempt <= 100) {
    try {
      const fileSize = await streamResponseToFile(response, filePath);
      return {
        kind: "file",
        url: opts.url,
        finalUrl,
        title: "",
        author: "",
        published: "",
        site: new URL(finalUrl).hostname,
        language: "",
        wordCount: 0,
        content: "",
        browser,
        os,
        filePath,
        fileSize,
        mimeType: normalizeContentType(contentType) || void 0
      };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        const nextBaseName = sanitizeBaseName(parse(fileName).name) || randomUUID();
        filePath = join(tempDir, `${nextBaseName}-${attempt}${extension}`);
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
  return {
    error: `Unable to create a unique temp file for ${finalUrl}`,
    code: "download_error",
    phase: "loading",
    retryable: true,
    timeoutMs: opts.timeoutMs,
    url: opts.url,
    finalUrl,
    mimeType: normalizeContentType(contentType) || void 0
  };
}
function shouldStripReplies(site) {
  return site === "Hacker News" || site.startsWith("r/") || site.startsWith("GitHub - ");
}
function createDefuddleFetch(dependencies = runtimeDependencies) {
  async function fetchWithClientRedirects(opts, hooks, clientSideRedirectCount, alternateLinkFallbackCount) {
    const browser = opts.browser ?? DEFAULT_BROWSER;
    const os = opts.os ?? DEFAULT_OS;
    const format = opts.format ?? "markdown";
    const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;
    const removeImages = opts.removeImages ?? false;
    const includeReplies = opts.includeReplies ?? DEFAULT_INCLUDE_REPLIES;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let parsed;
    try {
      parsed = new URL(opts.url);
    } catch {
      return {
        error: `Invalid URL: ${opts.url}`,
        code: "invalid_url",
        phase: "validation",
        retryable: false,
        url: opts.url
      };
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        error: `Only http/https URLs supported, got ${parsed.protocol}`,
        code: "unsupported_protocol",
        phase: "validation",
        retryable: false,
        url: opts.url
      };
    }
    const fetchOptions = {
      browser,
      os,
      headers: {
        Accept: resolveAcceptHeader(format),
        "Accept-Language": DEFAULT_ACCEPT_LANGUAGE_HEADER,
        ...opts.headers
      },
      redirect: "follow",
      timeout: timeoutMs
    };
    if (opts.proxy) {
      fetchOptions.proxy = opts.proxy;
    }
    const errorContext = {
      url: opts.url,
      phase: "connecting",
      timeoutMs
    };
    try {
      emitProgress(hooks, {
        status: "connecting",
        progress: 0,
        phase: "fetch_start"
      });
      fetchOptions.onRequestEvent = (event) => {
        if (event.url) {
          errorContext.finalUrl = event.url;
        }
        if (event.status) {
          errorContext.statusCode = event.status;
        }
        if (event.contentLength !== void 0 && event.contentLength !== null) {
          errorContext.contentLength = event.contentLength;
        }
        if (event.downloadedBytes !== void 0) {
          errorContext.downloadedBytes = event.downloadedBytes;
        }
        if (event.type === "request_start") {
          errorContext.phase = "connecting";
        } else if (event.type === "request_sent") {
          errorContext.phase = "waiting";
        } else if (event.type === "response_headers" || event.type === "body_progress" || event.type === "body_complete") {
          errorContext.phase = "loading";
        }
        const mapped = mapRequestEventToProgress(event);
        if (mapped) {
          emitProgress(hooks, mapped);
        }
      };
      fetchOptions.captureDiagnostics = true;
      const response = await dependencies.fetch(opts.url, fetchOptions);
      errorContext.finalUrl = response.url ?? opts.url;
      errorContext.statusCode = response.status;
      errorContext.statusText = response.statusText;
      errorContext.mimeType = normalizeContentType(response.headers.get("content-type") ?? "") || void 0;
      errorContext.contentLength = errorContext.contentLength ?? parseContentLengthHeader(response.headers.get("content-length"));
      if (!response.ok) {
        return {
          error: `Server returned HTTP ${response.status} ${response.statusText} for ${opts.url}.`,
          code: "http_error",
          phase: errorContext.phase,
          retryable: response.status >= 500 || response.status === 429,
          url: opts.url,
          finalUrl: errorContext.finalUrl,
          statusCode: response.status,
          statusText: response.statusText,
          timeoutMs,
          mimeType: errorContext.mimeType,
          contentLength: errorContext.contentLength
        };
      }
      const finalUrl = response.url ?? opts.url;
      const contentType = response.headers.get("content-type") ?? "";
      const contentDisposition = response.headers.get("content-disposition") ?? "";
      const shouldDownloadToFile = isAttachmentDisposition(contentDisposition) || !isTextualContentType(contentType);
      if (shouldDownloadToFile) {
        errorContext.phase = "loading";
        const fileResult = await buildFileResult(
          opts,
          response,
          finalUrl,
          contentType,
          contentDisposition,
          browser,
          os
        );
        if (!isError(fileResult)) {
          emitStatus(hooks, "done");
          emitProgress(hooks, {
            status: "done",
            progress: 1,
            phase: "file_done"
          });
        }
        return fileResult;
      }
      errorContext.phase = "loading";
      const rawBody = await response.text();
      const clientSideRedirect = extractClientSideRedirect(rawBody, finalUrl);
      if (clientSideRedirect) {
        if (clientSideRedirectCount >= MAX_CLIENT_SIDE_REDIRECTS) {
          return {
            error: `Client-side redirect limit (${MAX_CLIENT_SIDE_REDIRECTS}) exceeded while fetching ${opts.url}.`,
            code: "too_many_redirects",
            phase: "loading",
            retryable: false,
            timeoutMs,
            url: opts.url,
            finalUrl,
            mimeType: normalizeContentType(contentType) || void 0,
            contentLength: errorContext.contentLength
          };
        }
        return fetchWithClientRedirects(
          { ...opts, url: clientSideRedirect },
          hooks,
          clientSideRedirectCount + 1,
          alternateLinkFallbackCount
        );
      }
      const jsonResponse = isJsonResponse(contentType, rawBody);
      if (format === "raw") {
        const isXUrl2 = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(
          opts.url
        );
        if (isXUrl2) {
          let extractedContent2;
          const suppressedErrors2 = [];
          const origConsoleError = console.error;
          console.error = (...args) => {
            suppressedErrors2.push(args);
          };
          try {
            const extractionDocument2 = parseLinkedomHTML(rawBody, finalUrl);
            const extracted2 = await dependencies.defuddle(
              extractionDocument2,
              finalUrl,
              {
                markdown: true,
                removeImages,
                includeReplies
              }
            );
            extractedContent2 = extracted2.content;
          } finally {
            console.error = origConsoleError;
          }
          const hasOembed404 = suppressedErrors2.some(
            (args) => args.some(
              (arg) => typeof arg === "string" && arg.includes("oEmbed request failed: 404")
            )
          );
          const hasJsDisabledShell = isTwitterJsDisabledPage(
            parseLinkedomHTML(rawBody, finalUrl),
            opts.url
          );
          if ((hasOembed404 || hasJsDisabledShell) && !extractedContent2) {
            return {
              error: `Server returned HTTP 404 Not Found for ${opts.url}.`,
              code: "http_error",
              phase: "loading",
              retryable: false,
              timeoutMs,
              url: opts.url,
              finalUrl,
              statusCode: 404,
              statusText: "Not Found",
              mimeType: normalizeContentType(contentType) || void 0,
              contentLength: errorContext.contentLength
            };
          }
        }
        const effectiveContent = opts.maxChars !== void 0 ? truncateContent(rawBody, maxChars) : rawBody;
        const result2 = {
          kind: "content",
          url: opts.url,
          finalUrl,
          title: "",
          author: "",
          published: "",
          site: new URL(finalUrl).hostname,
          language: "",
          wordCount: 0,
          content: effectiveContent,
          browser,
          os,
          contentType: normalizeContentType(contentType) || void 0
        };
        emitStatus(hooks, "done");
        emitProgress(hooks, {
          status: "done",
          progress: 1,
          phase: "raw_done"
        });
        return result2;
      }
      if (format === "json") {
        if (!jsonResponse) {
          if (HTML_CONTENT_TYPES.some((value) => contentType.includes(value))) {
            const alternateLinks2 = extractQualifiedAlternateLinks(
              parseLinkedomHTML(rawBody, finalUrl),
              finalUrl,
              format
            );
            if (alternateLinks2.length > 0 && alternateLinkFallbackCount < MAX_ALTERNATE_LINK_FALLBACKS) {
              return fetchWithClientRedirects(
                { ...opts, url: alternateLinks2[0] },
                hooks,
                clientSideRedirectCount,
                alternateLinkFallbackCount + 1
              );
            }
          }
          return {
            error: `Not a JSON response (content-type: ${contentType})`,
            code: "unexpected_response",
            phase: errorContext.phase,
            retryable: false,
            timeoutMs,
            url: opts.url,
            finalUrl,
            mimeType: normalizeContentType(contentType) || void 0,
            contentLength: errorContext.contentLength
          };
        }
        const result2 = buildJsonResult(
          opts,
          finalUrl,
          rawBody,
          format,
          maxChars,
          browser,
          os
        );
        if (!isError(result2)) {
          emitStatus(hooks, "done");
          emitProgress(hooks, {
            status: "done",
            progress: 1,
            phase: "json_done"
          });
        }
        return result2;
      }
      if (jsonResponse) {
        const result2 = buildJsonResult(
          opts,
          finalUrl,
          rawBody,
          format,
          maxChars,
          browser,
          os
        );
        if (!isError(result2)) {
          emitStatus(hooks, "done");
          emitProgress(hooks, {
            status: "done",
            progress: 1,
            phase: "json_done"
          });
        }
        return result2;
      }
      if (isPlainTextContentType(contentType)) {
        const result2 = buildPlainTextResult(
          opts,
          finalUrl,
          rawBody,
          format,
          maxChars,
          browser,
          os
        );
        emitStatus(hooks, "done");
        emitProgress(hooks, {
          status: "done",
          progress: 1,
          phase: "plain_text_done"
        });
        return result2;
      }
      if (!HTML_CONTENT_TYPES.some((value) => contentType.includes(value))) {
        return {
          error: `Not an HTML page (content-type: ${contentType})`,
          code: "unexpected_response",
          phase: errorContext.phase,
          retryable: false,
          timeoutMs,
          url: opts.url,
          finalUrl,
          mimeType: normalizeContentType(contentType) || void 0,
          contentLength: errorContext.contentLength
        };
      }
      errorContext.phase = "processing";
      emitStatus(hooks, "processing");
      emitProgress(hooks, {
        status: "processing",
        progress: 0.96,
        phase: "extracting"
      });
      const fallbackDocument = parseLinkedomHTML(rawBody, finalUrl);
      const extractionDocument = parseLinkedomHTML(rawBody, finalUrl);
      const alternateLinks = extractQualifiedAlternateLinks(
        fallbackDocument,
        finalUrl,
        format
      );
      const tryAlternateLinkFallback = async () => {
        if (alternateLinks.length === 0 || alternateLinkFallbackCount >= MAX_ALTERNATE_LINK_FALLBACKS) {
          return null;
        }
        return fetchWithClientRedirects(
          { ...opts, url: alternateLinks[0] },
          hooks,
          clientSideRedirectCount,
          alternateLinkFallbackCount + 1
        );
      };
      let extracted;
      const suppressedErrors = [];
      try {
        const origConsoleError = console.error;
        console.error = (...args) => {
          suppressedErrors.push(args);
        };
        try {
          extracted = await dependencies.defuddle(
            extractionDocument,
            finalUrl,
            {
              markdown: format !== "html",
              removeImages,
              includeReplies
            }
          );
        } finally {
          console.error = origConsoleError;
        }
      } catch (_error) {
        extracted = {
          content: void 0,
          wordCount: 0
        };
      }
      const isXUrl = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(
        opts.url
      );
      if (isXUrl) {
        const hasOembed404 = suppressedErrors.some(
          (args) => args.some(
            (arg) => typeof arg === "string" && arg.includes("oEmbed request failed: 404")
          )
        );
        const hasJsDisabledShell = isTwitterJsDisabledPage(
          fallbackDocument,
          opts.url
        );
        if ((hasOembed404 || hasJsDisabledShell) && !extracted.content) {
          return {
            error: `Server returned HTTP 404 Not Found for ${opts.url}.`,
            code: "http_error",
            phase: "loading",
            retryable: false,
            timeoutMs,
            url: opts.url,
            finalUrl,
            statusCode: 404,
            statusText: "Not Found",
            mimeType: normalizeContentType(contentType) || void 0,
            contentLength: errorContext.contentLength
          };
        }
      }
      let extractedContent = extracted.content;
      let wordCount = extracted.wordCount;
      if (!extractedContent || wordCount === 0) {
        const fallbackText = extractDomTextFallback(fallbackDocument);
        if (!fallbackText) {
          const alternateResult = await tryAlternateLinkFallback();
          if (alternateResult) return alternateResult;
          return {
            error: `No content extracted from ${opts.url}. May need JS rendering or is blocked.`,
            code: "no_content",
            phase: "processing",
            retryable: false,
            timeoutMs,
            url: opts.url,
            finalUrl,
            mimeType: normalizeContentType(contentType) || void 0,
            contentLength: errorContext.contentLength
          };
        }
        extractedContent = format === "html" ? rawBody : format === "markdown" ? extractDomMarkdownFallback(fallbackDocument) || fallbackText : fallbackText;
        wordCount = estimateWordCount(fallbackText);
      }
      const extractedTextWordCount = estimateWordCount(
        format === "text" ? extractedContent : markdownToText(extractedContent)
      );
      if (Math.min(wordCount, extractedTextWordCount) < MIN_EXTRACTED_WORDS_BEFORE_ALTERNATE_FALLBACK && alternateLinks.length > 0) {
        const alternateResult = await tryAlternateLinkFallback();
        if (alternateResult) return alternateResult;
      }
      if (includeReplies === false && shouldStripReplies(extracted.site ?? "")) {
        const strippedContent = stripExtractorComments(
          extractedContent,
          format
        );
        if (strippedContent !== extractedContent) {
          extractedContent = strippedContent;
          wordCount = estimateWordCount(
            format === "text" ? markdownToText(extractedContent) : extractedContent
          );
        }
      }
      const normalizedContent = format === "text" ? markdownToText(extractedContent) : extractedContent;
      const result = {
        kind: "content",
        url: opts.url,
        finalUrl,
        title: extracted.title ?? "",
        author: extracted.author ?? "",
        published: extracted.published ?? "",
        site: extracted.site ?? "",
        language: extracted.language ?? "",
        wordCount,
        content: truncateContent(normalizedContent, maxChars),
        browser,
        os
      };
      emitStatus(hooks, "done");
      emitProgress(hooks, { status: "done", progress: 1, phase: "done" });
      return result;
    } catch (error) {
      const fetchError = buildThrownFetchError(error, errorContext);
      emitStatus(hooks, "error");
      emitProgress(hooks, { status: "error", progress: 1, phase: "error" });
      return fetchError;
    }
  }
  return function defuddleFetch2(opts, hooks = {}) {
    return fetchWithClientRedirects(opts, hooks, 0, 0);
  };
}
var defuddleFetch = createDefuddleFetch();
function isError(result) {
  return "error" in result;
}
function resolveBatchConcurrency(value) {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_BATCH_CONCURRENCY;
  }
  return Math.max(1, Math.floor(value));
}
function resolveFetchToolDefaults(config = {}) {
  return {
    maxChars: config.maxChars ?? DEFAULT_MAX_CHARS,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    browser: config.browser ?? DEFAULT_BROWSER,
    os: config.os ?? DEFAULT_OS,
    removeImages: config.removeImages ?? false,
    includeReplies: config.includeReplies ?? DEFAULT_INCLUDE_REPLIES,
    batchConcurrency: resolveBatchConcurrency(config.batchConcurrency),
    tempDir: config.tempDir
  };
}
function createBaseFetchToolParameterProperties(defaults) {
  return {
    url: Type.String({ description: "URL to fetch (http/https only)" }),
    browser: Type.Optional(
      Type.String({
        description: `Browser profile for TLS fingerprinting. Default: "${defaults.browser}". Examples: chrome_145, firefox_147, safari_26, edge_145, opera_127`
      })
    ),
    os: Type.Optional(
      Type.String({
        description: `OS profile for fingerprinting. Default: "${defaults.os}". Options: windows, macos, linux, android, ios`
      })
    ),
    headers: Type.Optional(
      Type.Record(Type.String(), Type.String(), {
        description: "Custom HTTP headers to send. By default, Accept and Accept-Language are set automatically."
      })
    ),
    maxChars: Type.Optional(
      Type.Number({
        description: `Maximum characters to return. Default: ${defaults.maxChars}`
      })
    ),
    timeoutMs: Type.Optional(
      Type.Number({
        description: `Request timeout in milliseconds. Default: ${defaults.timeoutMs}`
      })
    ),
    format: Type.Optional(
      Type.Union(
        [
          Type.Literal("markdown"),
          Type.Literal("html"),
          Type.Literal("text"),
          Type.Literal("json"),
          Type.Literal("raw")
        ],
        {
          description: 'Output format. "markdown" (default), "html" (cleaned HTML), "text" (plain text, no formatting), "json" (pretty-printed JSON), or "raw" (full raw server response without extraction or truncation, for further parsing)'
        }
      )
    ),
    removeImages: Type.Optional(
      Type.Boolean({
        description: "Strip image references from output. Default: false"
      })
    ),
    includeReplies: Type.Optional(
      Type.Union([Type.Boolean(), Type.Literal("extractors")], {
        description: "Include replies/comments: 'extractors' for site-specific only (default), true for all, false for none"
      })
    ),
    proxy: Type.Optional(
      Type.String({
        description: "Proxy URL (http://user:pass@host:port or socks5://host:port)"
      })
    )
  };
}
function createBatchFetchToolParameterProperties(defaults) {
  return {
    requests: Type.Array(
      Type.Object(createBaseFetchToolParameterProperties(defaults), {
        additionalProperties: false
      }),
      {
        minItems: 1,
        description: "Array of fetch requests. Each item accepts the same parameters as the single-item fetch tool."
      }
    )
  };
}
function buildFetchOptionsFromParams(params, defaults) {
  return {
    url: params.url,
    browser: params.browser ?? defaults.browser,
    os: params.os ?? defaults.os,
    headers: params.headers,
    maxChars: params.maxChars ?? defaults.maxChars,
    format: params.format ?? "markdown",
    removeImages: params.removeImages ?? defaults.removeImages,
    includeReplies: params.includeReplies ?? defaults.includeReplies,
    proxy: params.proxy,
    timeoutMs: params.timeoutMs ?? defaults.timeoutMs,
    tempDir: defaults.tempDir
  };
}
async function executeFetchToolCall(params, defaults, hooks = {}) {
  return defuddleFetch(buildFetchOptionsFromParams(params, defaults), hooks);
}
var PROGRESS_BY_STATUS = {
  queued: 0,
  connecting: 0,
  waiting: 0.11,
  loading: 0.51,
  processing: 0.96,
  done: 1,
  error: 1
};
function createInitialProgressItems(requests) {
  return requests.map((request, index) => ({
    index,
    url: typeof request.url === "string" ? request.url : String(request.url ?? ""),
    status: "queued",
    progress: PROGRESS_BY_STATUS.queued,
    statusStartedAt: Date.now()
  }));
}
function buildProgressSnapshot(items, batchConcurrency) {
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  for (const item of items) {
    if (item.status === "done" || item.status === "error") {
      completed += 1;
    }
    if (item.status === "done") {
      succeeded += 1;
    }
    if (item.status === "error") {
      failed += 1;
    }
  }
  return {
    items: items.map((item) => ({ ...item })),
    total: items.length,
    completed,
    succeeded,
    failed,
    batchConcurrency
  };
}
async function executeBatchFetchToolCall(params, defaults, options = {}) {
  const requests = (params.requests ?? []).map((request) => request ?? {});
  const batchConcurrency = resolveBatchConcurrency(
    options.batchConcurrency ?? defaults.batchConcurrency
  );
  const progressItems = createInitialProgressItems(requests);
  const results = new Array(requests.length);
  const emitProgress2 = () => {
    options.onProgress?.(
      buildProgressSnapshot(progressItems, batchConcurrency)
    );
  };
  const updateProgress = (index, status, error, progress) => {
    const previous = progressItems[index];
    progressItems[index] = {
      ...previous,
      status,
      progress: progress === void 0 ? PROGRESS_BY_STATUS[status] : Math.max(0, Math.min(1, progress)),
      statusStartedAt: previous?.status === status ? previous.statusStartedAt : Date.now(),
      ...error ? { error } : {}
    };
    emitProgress2();
  };
  emitProgress2();
  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= requests.length) {
        return;
      }
      const request = requests[index] ?? {};
      const normalizedRequest = buildFetchOptionsFromParams(request, defaults);
      try {
        const executeItem = options.executeItem ?? executeFetchToolCall;
        const result = await executeItem(request, defaults, {
          onStatusChange(status) {
            if (status === "done") return;
            updateProgress(index, status);
          },
          onProgressChange(update) {
            if (update.status === "done") return;
            updateProgress(index, update.status, void 0, update.progress);
          }
        });
        if (isError(result)) {
          const errorText = buildFetchErrorResponseText(result);
          results[index] = {
            index,
            request: normalizedRequest,
            status: "error",
            progress: PROGRESS_BY_STATUS.error,
            error: errorText
          };
          updateProgress(
            index,
            "error",
            buildUserFacingFetchErrorSummary(result)
          );
          continue;
        }
        results[index] = {
          index,
          request: normalizedRequest,
          status: "done",
          progress: PROGRESS_BY_STATUS.done,
          result
        };
        updateProgress(index, "done");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results[index] = {
          index,
          request: normalizedRequest,
          status: "error",
          progress: PROGRESS_BY_STATUS.error,
          error: message
        };
        updateProgress(index, "error", message);
      }
    }
  };
  const workerCount = requests.length === 0 ? 0 : Math.min(batchConcurrency, requests.length);
  await Promise.all(Array.from({ length: workerCount }, async () => worker()));
  const finalSnapshot = buildProgressSnapshot(progressItems, batchConcurrency);
  return {
    items: results,
    total: finalSnapshot.total,
    succeeded: finalSnapshot.succeeded,
    failed: finalSnapshot.failed,
    batchConcurrency
  };
}
var VALID_OS_VALUES = /* @__PURE__ */ new Set([
  "windows",
  "macos",
  "linux",
  "android",
  "ios"
]);
function readBoolean(source, keys) {
  for (const key of keys) {
    if (typeof source[key] === "boolean") {
      return source[key];
    }
  }
  return void 0;
}
function readPositiveNumber(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return void 0;
}
function readNonEmptyString(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return void 0;
}
function readOs(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && VALID_OS_VALUES.has(value)) {
      return value;
    }
  }
  return void 0;
}
function readIncludeReplies(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean" || value === "extractors") {
      return value;
    }
  }
  return void 0;
}
function normalizePiSmartFetchSettings(input) {
  if (!input || typeof input !== "object") return {};
  const source = input;
  return {
    smartFetchVerboseByDefault: readBoolean(source, [
      "smartFetchVerboseByDefault",
      "webFetchVerboseByDefault"
    ]),
    smartFetchDefaultMaxChars: readPositiveNumber(source, [
      "smartFetchDefaultMaxChars",
      "webFetchDefaultMaxChars"
    ]),
    smartFetchDefaultTimeoutMs: readPositiveNumber(source, [
      "smartFetchDefaultTimeoutMs"
    ]),
    smartFetchDefaultBrowser: readNonEmptyString(source, [
      "smartFetchDefaultBrowser"
    ]),
    smartFetchDefaultOs: readOs(source, ["smartFetchDefaultOs"]),
    smartFetchDefaultRemoveImages: readBoolean(source, [
      "smartFetchDefaultRemoveImages"
    ]),
    smartFetchDefaultIncludeReplies: readIncludeReplies(source, [
      "smartFetchDefaultIncludeReplies"
    ]),
    smartFetchDefaultBatchConcurrency: readPositiveNumber(source, [
      "smartFetchDefaultBatchConcurrency",
      "webFetchDefaultBatchConcurrency"
    ]),
    smartFetchTempDir: readNonEmptyString(source, [
      "smartFetchTempDir",
      "webFetchTempDir"
    ])
  };
}
function resolvePiSmartFetchSettings(globalSettings, projectSettings) {
  const global2 = normalizePiSmartFetchSettings(globalSettings);
  const project = normalizePiSmartFetchSettings(projectSettings);
  return {
    verboseByDefault: project.smartFetchVerboseByDefault ?? global2.smartFetchVerboseByDefault ?? false,
    maxChars: project.smartFetchDefaultMaxChars ?? global2.smartFetchDefaultMaxChars,
    timeoutMs: project.smartFetchDefaultTimeoutMs ?? global2.smartFetchDefaultTimeoutMs,
    browser: project.smartFetchDefaultBrowser ?? global2.smartFetchDefaultBrowser,
    os: project.smartFetchDefaultOs ?? global2.smartFetchDefaultOs,
    removeImages: project.smartFetchDefaultRemoveImages ?? global2.smartFetchDefaultRemoveImages,
    includeReplies: project.smartFetchDefaultIncludeReplies ?? global2.smartFetchDefaultIncludeReplies,
    batchConcurrency: project.smartFetchDefaultBatchConcurrency ?? global2.smartFetchDefaultBatchConcurrency,
    tempDir: project.smartFetchTempDir ?? global2.smartFetchTempDir ?? join(tmpdir(), "smart-fetch-pi")
  };
}
async function readSettingsFile(path) {
  try {
    return JSON.parse(await readFile(path, "utf-8"));
  } catch {
    return {};
  }
}
async function loadPiSmartFetchSettings(cwd, agentDir = getAgentDir()) {
  const globalSettings = await readSettingsFile(
    join(agentDir, "settings.json")
  );
  const projectSettings = await readSettingsFile(
    join(cwd, ".pi", "settings.json")
  );
  return resolvePiSmartFetchSettings(globalSettings, projectSettings);
}

// src/index.ts
var toolDescription = [
  "Fetch a URL with browser-grade TLS fingerprinting and extract clean, readable content.",
  "Uses wreq-js for browser-like TLS/HTTP2 impersonation and Defuddle for article extraction.",
  "Returns full metadata plus the extracted document to the agent while keeping the pi history preview brief.",
  "Does NOT execute JavaScript \u2014 use a browser automation tool for JS-heavy pages."
].join(" ");
var batchToolDescription = [
  "Fetch multiple URLs with browser-grade TLS fingerprinting and readable extraction.",
  "Each request accepts the same parameters as web_fetch and fans out with bounded concurrency.",
  "Returns full per-item metadata to the agent and streams compact per-item progress in the pi TUI.",
  "Does NOT execute JavaScript \u2014 use a browser automation tool for JS-heavy pages."
].join(" ");
var SPINNER_FRAMES = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
var SPINNER_INTERVAL_MS = 100;
function truncateMiddle(value, width) {
  if (width <= 0) return "";
  if (value.length <= width) return value.padEnd(width, " ");
  if (width === 1) return "\u2026";
  const left = Math.ceil((width - 1) / 2);
  const right = Math.floor((width - 1) / 2);
  return `${value.slice(0, left)}\u2026${value.slice(value.length - right)}`;
}
function getOptimisticProgress(item, now) {
  const base = item.progress;
  const startedAt = item.statusStartedAt ?? now;
  const elapsedWholeSeconds = Math.max(0, Math.floor((now - startedAt) / 1e3));
  switch (item.status) {
    case "connecting":
      return Math.min(0.1, Math.max(base, elapsedWholeSeconds * 0.01));
    case "waiting":
      return Math.min(0.5, Math.max(base, 0.11 + elapsedWholeSeconds * 0.01));
    case "processing":
      return Math.min(0.99, Math.max(base, 0.96 + elapsedWholeSeconds * 0.01));
    default:
      return base;
  }
}
function renderProgressBar(item, width, theme, now) {
  const innerWidth = Math.max(10, width - 2);
  const progress = getOptimisticProgress(item, now);
  const filled = Math.max(
    0,
    Math.min(innerWidth, Math.round(progress * innerWidth))
  );
  const barBgColor = item.status === "error" ? "toolErrorBg" : item.status === "done" ? "toolSuccessBg" : item.status === "queued" ? "toolPendingBg" : "selectedBg";
  const centeredLabel = (() => {
    const raw = item.status;
    if (raw.length >= innerWidth) {
      return raw.slice(0, innerWidth);
    }
    const totalPadding = innerWidth - raw.length;
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    return `${" ".repeat(leftPadding)}${raw}${" ".repeat(rightPadding)}`;
  })();
  const filledLabel = centeredLabel.slice(0, filled);
  const emptyLabel = centeredLabel.slice(filled);
  return [
    theme.fg("muted", "["),
    theme.bg(barBgColor, theme.fg("text", filledLabel)),
    theme.bg("toolPendingBg", theme.fg("muted", emptyLabel)),
    theme.fg("muted", "]")
  ].join("");
}
function renderStatusGlyph(item, spinnerIndex, theme) {
  switch (item.status) {
    case "done":
      return theme.fg("success", "\u2713");
    case "error":
      return theme.fg("error", "\u2717");
    case "queued":
      return theme.fg(
        "muted",
        SPINNER_FRAMES[spinnerIndex % SPINNER_FRAMES.length] ?? "\u280B"
      );
    default:
      return theme.fg(
        "accent",
        SPINNER_FRAMES[spinnerIndex % SPINNER_FRAMES.length] ?? "\u280B"
      );
  }
}
function renderBatchProgressText(snapshot, width, expanded, theme, spinnerTick = 0) {
  const summary = [
    theme.fg("toolTitle", theme.bold("batch_web_fetch ")),
    theme.fg(
      "muted",
      `${snapshot.completed}/${snapshot.total} done \xB7 ok ${snapshot.succeeded} \xB7 err ${snapshot.failed} \xB7 concurrency ${snapshot.batchConcurrency}`
    )
  ].join("");
  const availableRowWidth = Math.max(24, width);
  const progressWidth = Math.max(
    12,
    Math.min(18, Math.floor(availableRowWidth * 0.2))
  );
  const glyphWidth = 2;
  const urlWidth = Math.max(
    12,
    availableRowWidth - glyphWidth - progressWidth - 2
  );
  const now = Date.now();
  const rows = snapshot.items.map((item, index) => {
    const glyph = renderStatusGlyph(item, spinnerTick + index, theme);
    const url = theme.fg("accent", truncateMiddle(item.url, urlWidth));
    const bar = renderProgressBar(item, progressWidth, theme, now);
    const baseRow = `${glyph} ${url} ${bar}`;
    if (!expanded || !item.error) {
      return baseRow;
    }
    return `${baseRow}
  ${theme.fg("error", `error: ${item.error}`)}`;
  });
  return [summary, ...rows].join("\n");
}
function renderUserMetadataLine(label, value, theme) {
  return theme.fg("syntaxKeyword", `${label}: `) + theme.fg("syntaxString", String(value));
}
function buildWebFetchMetadataLines(details, theme) {
  const fetchResult = details.fetchResult;
  if (!fetchResult) {
    return [];
  }
  const metadata = [
    ["Title", fetchResult.title],
    ["Published", fetchResult.published]
  ];
  return metadata.flatMap(([label, value]) => {
    if (value === void 0 || value === "") {
      return [];
    }
    return [renderUserMetadataLine(label, value, theme)];
  });
}
function shouldRenderHighlightedContent(format) {
  return format === "markdown" || format === "json" || format === "html";
}
function buildHighlightedMarkdownContent(content, format) {
  if (format === "json") {
    return `\`\`\`json
${content}
\`\`\``;
  }
  if (format === "html") {
    return `\`\`\`html
${content}
\`\`\``;
  }
  return content;
}
function buildWebFetchCollapsedPreview(details) {
  const contentLines = (details.fetchResult?.content ?? "").split("\n").filter(
    (line, index, lines) => line.length > 0 || index === 0 || index < lines.length - 1
  );
  const maxPreviewLines = 7;
  const previewLines = contentLines.slice(0, maxPreviewLines);
  return {
    previewContent: previewLines.join("\n"),
    remainingLines: Math.max(0, contentLines.length - previewLines.length)
  };
}
function createWebFetchResultComponent(details, expanded, theme) {
  const fetchResult = details.fetchResult;
  if (!fetchResult) {
    return new Text(theme.fg("muted", "No fetch result available."), 0, 0);
  }
  const metadataLines = buildWebFetchMetadataLines(details, theme);
  const container = new Container();
  if (metadataLines.length > 0) {
    container.addChild(new Text(metadataLines.join("\n"), 0, 0));
  }
  if (isFileFetchResult(fetchResult)) {
    const fileLines = [
      theme.fg("muted", `File size: ${fetchResult.fileSize}`),
      ...fetchResult.mimeType ? [theme.fg("muted", `Mime type: ${fetchResult.mimeType}`)] : [],
      theme.fg("muted", `File path: ${fetchResult.filePath}`)
    ];
    if (metadataLines.length > 0 && fileLines.length > 0) {
      container.addChild(new Spacer(1));
    }
    container.addChild(new Text(fileLines.join("\n"), 0, 0));
    return container;
  }
  const { previewContent, remainingLines } = buildWebFetchCollapsedPreview(details);
  const content = expanded ? fetchResult.content : previewContent;
  const format = details.format ?? "markdown";
  if (metadataLines.length > 0 && content) {
    container.addChild(new Spacer(1));
  }
  if (content) {
    if (shouldRenderHighlightedContent(format)) {
      container.addChild(
        new Markdown(
          buildHighlightedMarkdownContent(content, format),
          0,
          0,
          getMarkdownTheme()
        )
      );
    } else {
      container.addChild(new Text(content, 0, 0));
    }
  }
  if (!expanded && remainingLines > 0) {
    const expandKey = keyText("app.tools.expand") || "Ctrl+O";
    if (content) {
      container.addChild(new Spacer(1));
    }
    container.addChild(
      new Text(
        theme.fg("muted", `... (${remainingLines} more lines, `) + theme.fg("dim", expandKey) + theme.fg("muted", " to expand)"),
        0,
        0
      )
    );
  }
  return container;
}
function renderSingleFetchProgressText(details, width, theme) {
  const status = details.status ?? "connecting";
  const url = details.url ?? details.fetchResult?.finalUrl ?? details.fetchResult?.url ?? "";
  const item = {
    status,
    progress: details.progress ?? 0,
    statusStartedAt: Date.now()
  };
  const availableRowWidth = Math.max(24, width);
  const progressWidth = Math.max(
    12,
    Math.min(18, Math.floor(availableRowWidth * 0.2))
  );
  const glyphWidth = 2;
  const urlWidth = Math.max(
    12,
    availableRowWidth - glyphWidth - progressWidth - 2
  );
  const glyph = renderStatusGlyph(item, details.spinnerTick ?? 0, theme);
  const renderedUrl = theme.fg("accent", truncateMiddle(url, urlWidth));
  const bar = renderProgressBar(item, progressWidth, theme, Date.now());
  return `${glyph} ${renderedUrl} ${bar}`;
}
function createResponsiveSingleFetchProgressComponent(details, theme) {
  const text = new Text("", 0, 0);
  return {
    render(width) {
      text.setText(renderSingleFetchProgressText(details, width, theme));
      return text.render(width);
    },
    invalidate() {
      text.invalidate();
    }
  };
}
function createResponsiveBatchComponent(details, expanded, theme) {
  const text = new Text("", 0, 0);
  return {
    render(width) {
      const snapshot = details.batchProgress;
      if (!snapshot) {
        text.setText(theme.fg("muted", "No batch progress available."));
        return text.render(width);
      }
      const spinnerTick = details.spinnerTick ?? 0;
      text.setText(
        renderBatchProgressText(snapshot, width, expanded, theme, spinnerTick)
      );
      return text.render(width);
    },
    invalidate() {
      text.invalidate();
    }
  };
}
function piSmartFetchExtension(pi) {
  const defaults = resolveFetchToolDefaults();
  pi.registerTool({
    name: "web_fetch",
    label: "web_fetch",
    description: toolDescription,
    promptSnippet: "web_fetch(url, browser?, os?, headers?, maxChars?, timeoutMs?, format?, removeImages?, includeReplies?, proxy?, verbose?): fetch browser-fingerprinted readable web content with full agent metadata and a compact pi preview",
    parameters: Type.Object({
      ...createBaseFetchToolParameterProperties(defaults),
      verbose: Type.Optional(
        Type.Boolean({
          description: "Compatibility flag. pi currently returns the full metadata header to the agent regardless, while keeping the history preview compact. Default: false, or smartFetchVerboseByDefault from pi settings."
        })
      )
    }),
    async execute(_toolCallId, params, _signal, onUpdate, ctx) {
      const settings = await loadPiSmartFetchSettings(ctx.cwd, getAgentDir());
      const runtimeDefaults = resolveFetchToolDefaults(settings);
      const verbose = params.verbose ?? settings.verboseByDefault;
      let spinnerTick = 0;
      let spinnerTimer = null;
      let latestDetails = {
        verbose,
        format: params.format ?? "markdown",
        started: true,
        status: "connecting",
        progress: 0,
        phase: "fetch_start",
        url: typeof params.url === "string" ? params.url : void 0,
        spinnerTick
      };
      const emitProgress2 = (details) => {
        latestDetails = details;
        onUpdate?.({
          content: [
            {
              type: "text",
              text: `Fetching ${details.url ?? params.url ?? "URL"}...`
            }
          ],
          details
        });
      };
      try {
        spinnerTimer = setInterval(() => {
          if (latestDetails.status === "done") {
            return;
          }
          spinnerTick += 1;
          emitProgress2({
            ...latestDetails,
            spinnerTick
          });
        }, SPINNER_INTERVAL_MS);
        const result = await executeFetchToolCall(params, runtimeDefaults, {
          onStatusChange(status) {
            emitProgress2({
              ...latestDetails,
              status,
              progress: latestDetails.progress ?? (status === "processing" ? 0.96 : status === "loading" ? 0.51 : status === "waiting" ? 0.11 : 0),
              spinnerTick
            });
          },
          onProgressChange(update) {
            emitProgress2({
              ...latestDetails,
              status: update.status,
              progress: update.progress,
              phase: update.phase,
              spinnerTick
            });
          }
        });
        if (isError(result)) {
          const errorText = buildFetchErrorResponseText(result);
          return {
            content: [{ type: "text", text: errorText }],
            details: {
              error: true,
              errorText,
              userErrorSummary: buildUserFacingFetchErrorSummary(result),
              verbose,
              status: latestDetails.status,
              phase: latestDetails.phase,
              url: latestDetails.url,
              spinnerTick
            }
          };
        }
        return {
          content: [
            {
              type: "text",
              text: buildFetchResponseText(result, { verbose: true })
            }
          ],
          details: {
            verbose,
            format: latestDetails.format,
            maxChars: runtimeDefaults.maxChars,
            fetchResult: result,
            started: true,
            status: "done",
            progress: 1,
            phase: "done",
            url: result.finalUrl || result.url,
            spinnerTick
          }
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorText = `Error: Unexpected web_fetch failure for ${typeof params.url === "string" ? params.url : "URL"}.

${message}`;
        return {
          content: [{ type: "text", text: errorText }],
          details: {
            error: true,
            errorText,
            userErrorSummary: "The request failed before a usable response was returned.",
            verbose,
            status: latestDetails.status,
            phase: latestDetails.phase,
            url: latestDetails.url,
            spinnerTick
          }
        };
      } finally {
        if (spinnerTimer) {
          clearInterval(spinnerTimer);
        }
      }
    },
    renderCall(args, theme) {
      const url = typeof args.url === "string" ? args.url : "...";
      return new Text(
        `${theme.fg("toolTitle", "web_fetch")} ${theme.fg("accent", url)}`,
        0,
        0
      );
    },
    renderResult(result, { expanded, isPartial }, theme) {
      if (isPartial) {
        const details2 = result.details ?? {};
        return createResponsiveSingleFetchProgressComponent(details2, theme);
      }
      const details = result.details ?? {};
      const textContent = result.content.find((item) => item.type === "text");
      const outputText = textContent?.type === "text" ? textContent.text : "";
      if (details.error) {
        return new Text(
          theme.fg(
            "error",
            details.userErrorSummary || outputText || details.errorText || "Error"
          ),
          0,
          0
        );
      }
      return createWebFetchResultComponent(details, expanded, theme);
    }
  });
  pi.registerTool({
    name: "batch_web_fetch",
    label: "batch_web_fetch",
    description: batchToolDescription,
    promptSnippet: "batch_web_fetch(requests, verbose?): fetch multiple URLs concurrently with full agent metadata and per-item progress in the pi TUI",
    parameters: Type.Object({
      ...createBatchFetchToolParameterProperties(defaults),
      verbose: Type.Optional(
        Type.Boolean({
          description: "Compatibility flag. pi currently returns the full metadata header for successful results regardless, while keeping the history preview compact. Default: false, or smartFetchVerboseByDefault from pi settings."
        })
      )
    }),
    async execute(_toolCallId, params, _signal, onUpdate, ctx) {
      const settings = await loadPiSmartFetchSettings(ctx.cwd, getAgentDir());
      const runtimeDefaults = resolveFetchToolDefaults(settings);
      const verbose = params.verbose ?? settings.verboseByDefault;
      let latestSnapshot;
      let spinnerTick = 0;
      let spinnerTimer = null;
      const emitProgress2 = (snapshot) => {
        onUpdate?.({
          content: [
            {
              type: "text",
              text: `Started batch fetch for ${snapshot.total} URLs (${snapshot.completed}/${snapshot.total} complete).`
            }
          ],
          details: {
            verbose,
            started: true,
            batchProgress: snapshot,
            spinnerTick
          }
        });
      };
      try {
        spinnerTimer = setInterval(() => {
          if (!latestSnapshot || latestSnapshot.completed >= latestSnapshot.total) {
            return;
          }
          spinnerTick += 1;
          emitProgress2(latestSnapshot);
        }, SPINNER_INTERVAL_MS);
        const batchResult = await executeBatchFetchToolCall(
          params,
          runtimeDefaults,
          {
            batchConcurrency: runtimeDefaults.batchConcurrency,
            onProgress(snapshot) {
              latestSnapshot = snapshot;
              emitProgress2(snapshot);
            }
          }
        );
        const finalProgress = {
          items: batchResult.items.map((item) => ({
            index: item.index,
            url: item.request.url,
            status: item.status,
            progress: item.progress,
            ...item.error ? { error: item.error } : {}
          })),
          total: batchResult.total,
          completed: batchResult.total,
          succeeded: batchResult.succeeded,
          failed: batchResult.failed,
          batchConcurrency: batchResult.batchConcurrency
        };
        return {
          content: [
            {
              type: "text",
              text: buildBatchFetchResponseText(batchResult, {
                verbose: true
              })
            }
          ],
          details: {
            verbose,
            started: true,
            batchProgress: finalProgress,
            batchResult,
            spinnerTick
          }
        };
      } finally {
        if (spinnerTimer) {
          clearInterval(spinnerTimer);
        }
      }
    },
    renderCall(args, theme) {
      const batchArgs = args;
      const requestCount = Array.isArray(batchArgs.requests) ? batchArgs.requests.length : 0;
      let text = theme.fg("toolTitle", theme.bold("batch_web_fetch "));
      text += theme.fg("muted", `${requestCount} urls`);
      return new Text(text, 0, 0);
    },
    renderResult(result, { expanded }, theme) {
      return createResponsiveBatchComponent(
        result.details ?? {},
        expanded,
        theme
      );
    }
  });
}
/*! Bundled license information:

mime-db/index.js:
  (*!
   * mime-db
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2022 Douglas Christopher Wilson
   * MIT Licensed
   *)

mime-types/index.js:
  (*!
   * mime-types
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/

export { piSmartFetchExtension as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map