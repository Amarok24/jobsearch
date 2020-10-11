/**
  * @description A collection of useful functions (mostly pure functions).
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/
/**
 *
 */

type Filterable = object | object[];


/**
 * Outputs text to HTML element, optional HTML <strong> and <br/>, manipulates given 'element' node directly.
 * @param bold Format with <strong>
 * @param linebreak Add a <br /> at the end
 */
export function outText(element: HTMLElement, text: string, bold=false, linebreak=false): void {
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
 * @param bold Format with <strong>
 */
export function outTextBr(element: HTMLElement, text="", bold=false): void {
  outText(element, text, bold, true);
}

/**
 *  Removes all Element children of given HTMLElement.
 *  Leaves non-Element Nodes as children (for example text comments).
 *  (simply setting innerHTML to empty string is bad practice)
 */
export function removeChildrenOf(element: HTMLElement): void {
  while (element.lastElementChild) {
    let last: Element = element.lastElementChild;
    element.removeChild(last);
  }
}

/**
 * Removes HTML tags from given string. Only basic functionality.
 * @returns A copy of changed input.
 */
export function removeHtmlTags(str: string): string {
  return str.replace(/<(?:\/|\s)?(?:h.|p|ul|ol|li|strong|em|div|span|table|th|tr|td|br\/).*?>/gmi, " ");;
}


interface GenericObject {
  [keyName: string]: any;
};

/**
 * Returns a sanitized copy of obj, string numbers become pure numbers and string values "null" become null.
 * Example: {m: "3.14", n: "7", x: "null"} --> {m: 3.14, n: 7, x: null}
 * @returns A copy of changed input object.
 */
export function sanitizeJSONobject(obj: GenericObject): GenericObject {
  let objCopy = {...obj}; // shallow copy (and excluding prototype)
  // all deep levels will be by reference, but this function doesn't use them
  let keyName: string;

  const tryStrToNum = function(s: string): string | number {
    let plusS = +s; // +s tries to convert string to number, returns NaN on fail
    return isNaN(plusS) ? s : plusS;
  };

  for (keyName in objCopy) {
    if (typeof objCopy[keyName] === "string") {
      objCopy[keyName] = (objCopy[keyName] === "null") ? null : tryStrToNum(objCopy[keyName]);
    }
  }

  return objCopy;
}

/**
 * Only keeps object's specified keys (and their values) given in 'keysArr'.
 * Example: filterObject([ {a: "a0", b: 5}, {a: "a1", b: 7, c: 1} ], ["a", "c"]) will return [{a: "a0"}, {a: "a1", c: 1}]
 * @returns A copy of changed input.
 */
export function filterObject(obj: Filterable, keysArr: string[]): Filterable {
  let json = JSON.stringify(obj, keysArr);
  return JSON.parse(json);
}

/**
 * Sorts 'arrayOfObjects' by 'key' name. Basically just a pure function using Array.prototype.sort(), so the values can be numbers or strings.
 * @returns A copy of changed input array.
 */
export function sortArrayOfObjects(arrayOfObjects: object[], key: string, ascending: boolean = true): object[] {
  let arrCopy = [...arrayOfObjects];

  const compareFunc = function (a: any, b: any) {
    if (a[key] < b[key]) {
      return ascending ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return ascending ? 1 : -1;
    }
    return 0; // both are equal, leave their order
  }

  arrCopy.sort(compareFunc); // .sort() works on given object directly
  return arrCopy;
}

/**
 * Check if given 'obj' is of specific type.
 * @param obj Any object / primitive / array / function and so on...
 * @param typeName (lowercase) one of: number, integer, float, string, array, object, set, symbol, boolean, function, null, undefined
 */
export function typeCheck(obj: any, typeName: string): boolean {
  if (obj === null || obj === undefined) return typeName === String(obj);
  if (typeName === "integer") return Number.isInteger(obj);
  if (typeName === "float") {
    return (obj.constructor.name === "Number" && !Number.isInteger(obj));
  }
  return obj.constructor.name.toLowerCase() === typeName;
}


interface ColorList {
  [keyName: string]: string;
};

/**
 *
 * @param colors Key-value pairs of CSS variableName and value
 */
export function setCSSrootColors(colors: ColorList) {
  let rootElem = document.documentElement;
  let colorName: string;

  for (colorName in colors) {
    console.log(colorName, colors[colorName]);
    rootElem.style.setProperty(colorName, colors[colorName]);
  }
}
