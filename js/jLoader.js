let _loaderDiv;
;
const LOADERSTYLE_PARENT = {
    position: "fixed",
    zIndex: "100",
    width: "68px",
    height: "68px",
    left: "calc(50% - 34px)",
    top: "20%",
    display: "none"
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
    _loaderDiv.style.display = "block";
}
export function hideLoader() {
    _loaderDiv.style.display = "none";
}
export function simulateLoading(msTimeout = 500) {
    showLoader();
    setTimeout(() => { hideLoader(); }, msTimeout);
}
function applyStyles(elem, objStyles) {
    let k;
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
//# sourceMappingURL=jLoader.js.map