/**
  * @name jHelpers.mjs
  * @description A collection of useful functions (mostly pure functions).
  * @version 0.15
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/


/**
 * Outputs text to HTML element, optional HTML <strong> and <br/>, manipulates given 'element' node directly.
 * @param element {HTMLElement} HTML element to manipulate
 * @param text {string} Text to output
 * @param bold {boolean} Format with <strong>
 * @param linebreak {boolean} Add a <br /> at the end
 */
export function outText(element, text, bold=false, linebreak=false) {
  const message = document.createTextNode(text); // because .innerHTML is insecure
  let fragment = document.createDocumentFragment();
  let strong,
      br;

  if (bold) {
    strong = document.createElement("strong");
    strong.appendChild(message);
    fragment.appendChild(strong);
  } else {
    fragment.appendChild(message);
  }

  if (linebreak) {
    br = document.createElement("br");
    fragment.appendChild(br);
  }

  element.appendChild(fragment);
}


/**
 * Outputs plain text to HTML element, optional bold formatting, adds a linebreak
 * @param element {HTMLElement} HTML element to manipulate
 * @param text {string} Text to output
 * @param bold {boolean} Format with <strong>
 */
export function outTextBr(element, text, bold=false) {
  outText(element, text, bold, true);
}


/**
 * Loops to remove every lastChild (because setting an empty innerHTML is bad), manipulates given 'element' node directly.
 * @param element {HTMLElement} HTML element to work on
 */
export function removeChildrenOf(element) {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
}


/**
 * Removes HTML tags from given string. Only basic functionality.
 * @param str {string}
 * @returns {string} A copy of changed input.
 */
export function removeHtmlTags(str) {
  return str.replace(/<(?:\/|\s)?(?:h.|p|ul|ol|li|strong|em|div|span|table|th|tr|td|br\/).*?>/gmi, " ");;
}


/**
 * Returns a sanitized copy of obj, string numbers become pure numbers and string values "null" become null.
 * Example: {m: "3.14", n: "7", x: "null"} --> {m: 3.14, n: 7, x: null}
 * @param obj {object} Object to sanitized
 * @returns {object} A copy of changed input.
 */
export function sanitizeObject(obj) {
  let objCopy = {...obj}; // shallow copy (and excluding prototype)
  // all deep levels will be by reference, but this function doesn't use them
  const strToNum = val => !isNaN(val) ? +val : val; // +s converts string to number

  for (let key in objCopy) {
    if (typeof objCopy[key] === "string") {
      objCopy[key] = (objCopy[key] === "null") ? null : strToNum(objCopy[key]);
    }
  }

  return objCopy;
}


/**
 * Only keeps object's specified keys given in 'keysArr'.
 * Example: filterObject([ {a: "a0", b: 5}, {a: "a1", b: 7, c: 1} ], ["a", "c"]) will return [{a: "a0"}, {a: "a1", c: 1}]
 * @param obj {any} Object to filter. Most useful when given 'obj' is [] of objects.
 * @param keysArr {array} Array of strings.
 * @returns {any} A copy of changed input.
 */
export function filterObject(obj, keysArr) {
  let json = JSON.stringify(obj, keysArr);
  return JSON.parse(json);
}


/**
 * Sorts 'arrayOfObjects' by 'key' name. Basically just a pure function using Array.prototype.sort(), so the values can be numbers or strings.
 * @param arrayOfObjects {array} Array of objects.
 * @param key {string} Name of key.
 * @param ascending {boolean}
 * @returns {array} A copy of changed input array.
 */
export function sortArrayOfObjects(arrayOfObjects, key, ascending=true) {
  let arrCopy = [...arrayOfObjects];

  const compareFunc = function (a, b) {
    if (a[key] < b[key]) {
      return ascending ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return ascending ? 1 : -1;
    }
    return 0; // both are equal, leave their order
  }

  arrCopy.sort(compareFunc); // .sort() works on its object directly
  return arrCopy;
}


/**
 * Check if given 'obj' is of specific type.
 * @param obj {any} any object / primitive / array / function and so on...
 * @param typeName {string} lowercase string, one of: number, integer, float, string, array, object, set, symbol, boolean, function, null, undefined
 * @returns {boolean} true or false
 */
export function typeCheck(obj, typeName) {
  if (obj === null || obj === undefined) return typeName === String(obj);
  if (typeName === "integer") return Number.isInteger(obj);
  if (typeName === "float") {
    return (obj.constructor.name === "Number" && !Number.isInteger(obj));
  }
  return obj.constructor.name.toLowerCase() === typeName;
}


/**
 * 
 * @param colors {object} Key-value pairs of CSS variable and value
 */
export function setCSSrootColors(colors) {
  let rootElem = document.documentElement;
  for (let colorName in colors) {
    console.log(colorName, colors[colorName]);
    rootElem.style.setProperty(colorName, colors[colorName]);
  }
}
