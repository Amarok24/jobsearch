﻿/**
  * @description A standalone loader animation library.
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

let _loaderDiv: HTMLElement;

interface StyleList {
  [keyName: string]: string;
}

const LOADERSTYLE_PARENT: StyleList = {
  position: "fixed",
  zIndex: "100",
  width: "68px",
  height: "68px",
  left: "calc(50% - 34px)",
  top: "20%",
  display: "none"
};

const LOADERSTYLE_CHILD: StyleList = {
  width: "68px",
  height: "68px",
  borderRadius: "50%",
  boxShadow: "5px 3px 3px steelblue"
};

const ANIM_KEYFRAMES = [
  { transform: 'rotate(0)' },
  { transform: 'rotate(1turn)' }
];

const ANIM_TIMING = {
  duration: 600,
  iterations: Infinity
};



export function showLoader(): void {
  _loaderDiv.style.display = "block";
}


export function hideLoader(): void {
  _loaderDiv.style.display = "none";
}


export function simulateLoading(msTimeout = 500): void {
  showLoader();
  setTimeout( () => {hideLoader();}, msTimeout );
}


function applyStyles(elem: HTMLElement, objStyles: StyleList) {
  let k: any; // TODO: no any
  for (k in objStyles) {
    if (elem.style[k] !== undefined) {
      elem.style[k] = objStyles[k];
    }
  }
}


function main() {
  let divChild = document.createElement("div");
  _loaderDiv = document.createElement("div");
  _loaderDiv.setAttribute("data-info", "jLoader");
  applyStyles(_loaderDiv, LOADERSTYLE_PARENT);
  applyStyles(divChild, LOADERSTYLE_CHILD);
  divChild.animate(ANIM_KEYFRAMES, ANIM_TIMING);
  _loaderDiv.append(divChild);
  document.body.append(_loaderDiv);
}

main();
