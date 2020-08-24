/**
  * @name styledForms.mjs
  * @description Improved form elements. Custom styling of form elements through JS.
  * @version 0.2
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/


/**
 * Custom dropdown (select+option HTML nodes)
 * @param elemID ID of target element.
 * @param content Object which accepts keys: textContents, selectedIndex
 * @param classForSelected Name of class for selected (active) item.
 */
export function styleSelectbox(elemID = "", content = {}, classForSelected = "selected") {
  const {textContents, selectedIndex, individualStyles, eachStyle} = content;
  // TODO: textContents could be taken from genuine element
  // FIXME: mobile devices need a click instead of hover
  let genuineElem,
      genuineElemChildren;

  let span = document.createElement("span");
  let ul = document.createElement("ul");

  const liClick = (ev) => {
    // click event handler for each LI
    let ulChildren = ul.children;
    for (let i = 0; i < ulChildren.length; i++) {
      ulChildren[i].classList.remove("selected");
    }
    ev.target.classList.add(classForSelected);
    genuineElem.value = ev.target.attributes.rel.value;
  }

  try {
    genuineElem = document.getElementById(elemID);
    genuineElemChildren = genuineElem.children;
  } catch (error) {
    console.error("Error in styleSelectbox(), DETAILS:", error);
    return 1;
  }

  span.setAttribute("rel", elemID);
  span.setAttribute("class", "sFormSelectList");
  span.append(ul);

  for (let i = 0; i < genuineElemChildren.length; i++) {
    let optionValue = genuineElemChildren[i].value;
    let li = document.createElement("li");
    let text = document.createTextNode(textContents[i]);
    li.setAttribute("rel", optionValue);
    
    if (selectedIndex === i) {
      li.setAttribute("class", "selected");
    }

    li.append(text);
    li.addEventListener("click", liClick);
    applyStyles(li, individualStyles[i]);
    applyStyles(li, eachStyle);
    ul.append(li);
  }

  applyStyles(genuineElem, {display: "none"});
  genuineElem.parentNode.append(span)
}


/**
 * Apply given styles to given element.
 * @param elem Element (node), will be directly modified.
 * @param objStyles An object (with styles) or an array of objects. Keys for style names either in JS notation (no string) or CSS notation (string needed).
 * Example: {marginRight: "20px", "margin-top": "5px"}
 */
function applyStyles(elem, objStyles) {
  if (Array.isArray(objStyles)) {
    // so we have an array of objects
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
