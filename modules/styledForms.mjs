/**
  * @name styledForms.mjs
  * @description Improved form elements. Custom styling of form elements through JS.
  * @version 0.21
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/

/**
 * Custom dropdown (select+option HTML nodes)
 * @param selectElem Reference to HTML <select> element.
 * @param setup Object with optional keys: textContents, selectIndex, individualStyles, eachStyle, classForSelected.
 * Provided textContents[] will override original <option> element text contents.
 */
export function styleSelectbox(selectElem, setup = {}) {
  const {textContents=[], selectIndex=0, individualStyles, eachStyle, classForSelected="selected"} = setup;

  let span = document.createElement("span");
  let ul = document.createElement("ul");

  // BEGIN: EVENT LISTENERS **********************************************
  const ulMouseEnter = (ev) => { ev.target.dataset.opened = ""; }
  const ulMouseLeave = (ev) => { delete ev.target.dataset.opened; }
  const liClick = (ev) => {
    // click event handler for each LI

    if (ev.target.parentElement.dataset.opened === undefined) {
      // user has touchscreen because ulMouseEnter event was not triggered
      ev.target.parentElement.dataset.opened = "";
      return 0;
    }

    for (let i = 0; i < ul.children.length; i++) {
      ul.children[i].classList.remove(classForSelected);
    }
    ev.target.classList.add(classForSelected);
    selectElem.value = ev.target.dataset.relvalue; // mirror selection to selectElem
    delete ev.target.parentElement.dataset.opened; // close selectbox
  }
  // END: EVENT LISTENERS **********************************************

  span.dataset.connection = selectElem.nodeName; // remove? unused, just for info
  span.classList.add("sFormSelectList");
  span.append(ul);

  if (textContents.length === 0) {
    // textContents[] not provided, so let's take it from original element
    for (let i of selectElem.options) {
      textContents.push(i.innerText);
    }
  }

  for (let i = 0; i < selectElem.options.length; i++) {
    let li = document.createElement("li");
    let text = document.createTextNode(textContents[i]);
    li.dataset.relvalue = selectElem.options[i].value;

    if (i === selectIndex) {
      li.classList.add("selected");
      selectElem.value = li.dataset.relvalue; // also modify original elem selection
    }

    li.append(text);
    li.addEventListener("click", liClick);
    ul.addEventListener("mouseenter", ulMouseEnter);
    ul.addEventListener("mouseleave", ulMouseLeave);
    applyStyles(li, individualStyles[i]);
    applyStyles(li, eachStyle);
    ul.append(li);
  }

  applyStyles(selectElem, {display: "none"});
  selectElem.parentElement.append(span);
}


/**
 * Apply given styles to given element.
 * @param elem Element (node), will be directly modified.
 * @param objStyles An object (with styles) or an array of objects. Keys for style names either in JS notation (no string) or CSS notation (string needed).
 * Example: {marginRight: "20px", "margin-top": "5px"}
 */
function applyStyles(elem, objStyles) {
  if (Array.isArray(objStyles)) {
    //console.log("array of objects");
    for (let i of objStyles) {
      console.log(i);
      for (let key in i) {
        elem.style[key] = i[key];
      }
    }
  } else {
    //console.log("just one object");
    for (let key in objStyles) {
      elem.style[key] = objStyles[key];
    }
  }
}
