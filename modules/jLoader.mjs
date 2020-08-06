﻿/**
  * @name jLoader.mjs
  * @description A standalone loader animation library.
  * @version 0.2
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
  How to use:
  1) Import this file into your project, for example:
     import * as jLoader from "./jLoader.mjs";
  2) Use exported functions:
     jLoader.showLoader();
     jLoader.hideLoader();
     jLoader.simulateLoading(1000);
*/


let _loaderDiv = null;
const STATUS_OK = 0;
const STATUS_ERR = 1;


const LOADERSTYLE_PARENT = {
  position: "fixed",
  zIndex: 100,
  width: "68px",
  height: "68px",
  left: "calc(50% - 34px)",
  top: "20%",
  display: "none",
};

const LOADERSTYLE_CHILD = {
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



export function showLoader() {
  if (_loaderDiv) {
    _loaderDiv.style.display = "block";
    return STATUS_OK;
  }
  return STATUS_ERR;
}


export function hideLoader() {
  if (_loaderDiv) {
    _loaderDiv.style.display = "none";
    return STATUS_OK;
  }
  return STATUS_ERR;
}


export function simulateLoading(msTimeout = 500) {
  if (showLoader()) {
    setTimeout( () => {hideLoader();}, msTimeout );
  }
}


function applyStyles(elem, objStyles) {
  for (let key in objStyles) {
    elem.style[key] = objStyles[key];
  }
}


function main() {
  let divChild;
  try {
    divChild = document.createElement("div");
    _loaderDiv = document.createElement("div");
    _loaderDiv.setAttribute("data-info", "jLoader");
    applyStyles(_loaderDiv, LOADERSTYLE_PARENT);
    applyStyles(divChild, LOADERSTYLE_CHILD);
    divChild.animate(ANIM_KEYFRAMES, ANIM_TIMING);
    _loaderDiv.append(divChild);
    document.body.append(_loaderDiv);
  } catch (error) {
    console.error("jLoader init error");
    console.log(error);
    _loaderDiv = null;
  }
}

main();
