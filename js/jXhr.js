export function sendXhr(method, url, respType = "text", descr) {
    return sendXhrData(method, url, null, respType, descr);
}
export function sendXhrData(method, url, data, respType, descr) {
    let httpPromise;
    const cout = console.log;
    const cerr = console.error;
    const httpReq = function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        const handleLoad = (ev) => {
            console.group(descr);
            cout(`jXhr: ${ev.type} event here`);
            cout(`jXhr: ${ev.loaded} bytes loaded"`);
            console.groupEnd();
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            }
            else {
                reject(xhr.response);
                cerr(xhr.status);
            }
        };
        const handleError = (ev) => {
            reject(new Error("jXhr: failed to send request!"));
            console.group(descr);
            cout(ev);
            cerr("jXhr: status " + xhr.status);
            console.groupEnd();
        };
        xhr.open(method, url);
        if (method === "POST" && respType === "json") {
            cout("jXhr: setRequestHeader 'Content-Type application/json'");
            xhr.setRequestHeader("Content-Type", "application/json");
        }
        xhr.responseType = respType;
        xhr.addEventListener("load", handleLoad);
        xhr.addEventListener("error", handleError);
        xhr.send(data);
    };
    httpPromise = new Promise(httpReq);
    return httpPromise;
}
