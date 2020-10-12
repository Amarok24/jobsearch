export function outText(element, text, bold = false, wrapper = "span", linebreak = false) {
    const message = document.createTextNode(text);
    let fragment = document.createDocumentFragment();
    let strong, br;
    let paragraph = document.createElement(wrapper);
    if (bold) {
        strong = document.createElement("strong");
        paragraph.appendChild(strong);
        strong.appendChild(message);
        fragment.appendChild(paragraph);
    }
    else {
        paragraph.appendChild(message);
        fragment.appendChild(paragraph);
    }
    if (linebreak) {
        br = document.createElement("br");
        fragment.appendChild(br);
    }
    element.appendChild(fragment);
}
export function outTextBr(element, text = "", bold = false) {
    outText(element, text, bold, "span", true);
}
export function removeChildrenOf(element) {
    while (element.lastElementChild) {
        let last = element.lastElementChild;
        element.removeChild(last);
    }
}
export function removeHtmlTags(str) {
    return str.replace(/<(?:\/|\s)?(?:h.|p|ul|ol|li|strong|em|div|span|table|th|tr|td|br\/).*?>/gmi, " ");
    ;
}
;
export function sanitizeJSONobject(obj) {
    let objCopy = Object.assign({}, obj);
    let keyName;
    const tryStrToNum = function (s) {
        let plusS = +s;
        return isNaN(plusS) ? s : plusS;
    };
    for (keyName in objCopy) {
        if (typeof objCopy[keyName] === "string") {
            objCopy[keyName] = (objCopy[keyName] === "null") ? null : tryStrToNum(objCopy[keyName]);
        }
    }
    return objCopy;
}
export function filterObject(obj, keysArr) {
    let json = JSON.stringify(obj, keysArr);
    return JSON.parse(json);
}
export function sortArrayOfObjects(arrayOfObjects, key, ascending = true) {
    let arrCopy = [...arrayOfObjects];
    const compareFunc = function (a, b) {
        if (a[key] < b[key]) {
            return ascending ? -1 : 1;
        }
        if (a[key] > b[key]) {
            return ascending ? 1 : -1;
        }
        return 0;
    };
    arrCopy.sort(compareFunc);
    return arrCopy;
}
export function typeCheck(obj, typeName) {
    if (obj === null || obj === undefined)
        return typeName === String(obj);
    if (typeName === "integer")
        return Number.isInteger(obj);
    if (typeName === "float") {
        return (obj.constructor.name === "Number" && !Number.isInteger(obj));
    }
    return obj.constructor.name.toLowerCase() === typeName;
}
;
export function setCSSrootColors(colors) {
    let rootElem = document.documentElement;
    let colorName;
    for (colorName in colors) {
        console.log(colorName, colors[colorName]);
        rootElem.style.setProperty(colorName, colors[colorName]);
    }
}
//# sourceMappingURL=jHelpers.js.map