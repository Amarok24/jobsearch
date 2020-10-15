const TOUCHSCREEN = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
export function styleSelectbox(selectElem, setup) {
    var _a;
    const { textContents = [], selectIndex, individualStyles, eachStyle, classForSelected = "selected" } = setup;
    let span = document.createElement("span");
    let ul = document.createElement("ul");
    const ulMouseEnter = (ev) => {
        let t = ev.target;
        t.dataset["opened"] = "";
        ev.stopPropagation();
    };
    const ulMouseLeave = (ev) => {
        let t = ev.target;
        delete t.dataset["opened"];
        ev.stopPropagation();
    };
    const liClick = (ev) => {
        let t = ev.target;
        if (TOUCHSCREEN) {
            if (t.parentElement)
                t.parentElement.dataset["opened"] = "";
            return 0;
        }
        for (let i = 0; i < ul.children.length; i++) {
            ul.children[i].classList.remove(classForSelected);
        }
        t.classList.add(classForSelected);
        selectElem.value = t.dataset["relvalue"] || "";
        if (t.parentElement)
            delete t.parentElement.dataset["opened"];
        return 1;
    };
    span.dataset["connection"] = selectElem.nodeName;
    span.classList.add("sFormSelectList");
    span.append(ul);
    if (textContents.length === 0) {
        for (let i = 0; i < selectElem.options.length; i++) {
            textContents.push(selectElem.options[i].innerText);
        }
    }
    for (let i = 0; i < selectElem.options.length; i++) {
        let li = document.createElement("li");
        let text = document.createTextNode(textContents[i]);
        li.dataset["relvalue"] = selectElem.options[i].value;
        if (i === selectIndex) {
            li.classList.add("selected");
            selectElem.value = li.dataset["relvalue"];
        }
        li.append(text);
        li.addEventListener("click", liClick);
        ul.addEventListener("mouseenter", ulMouseEnter);
        ul.addEventListener("mouseleave", ulMouseLeave);
        applyStyles(li, individualStyles[i]);
        applyStyles(li, eachStyle);
        ul.append(li);
    }
    applyStyles(selectElem, { display: "none" });
    (_a = selectElem.parentElement) === null || _a === void 0 ? void 0 : _a.append(span);
}
function applyStyles(elem, objStyles) {
    if (Array.isArray(objStyles)) {
        for (let i of objStyles) {
            console.log(i);
            let key;
            for (key in i) {
                elem.style[key] = i[key];
            }
        }
    }
    else {
        let key;
        for (key in objStyles) {
            elem.style[key] = objStyles[key];
        }
    }
}
//# sourceMappingURL=styledForms.js.map