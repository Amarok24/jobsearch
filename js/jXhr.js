/**
 * @name jXhr.ts
 * @description Asynchronous XMLHttpRequest (XHR) library.
 * @version 0.3
 * @author Jan Prazak
 * @website https://github.com/Amarok24/
 * @license MPL-2.0
 This Source Code Form is subject to the terms of the Mozilla Public License,
 v. 2.0. If a copy of the MPL was not distributed with this file, you can
 obtain one at http://mozilla.org/MPL/2.0/.
*/
/**
 * Shortened sendXhrData() when no data needs to be sent with request.
 * @param method "GET" or "POST"
 * @param url "URL" for request
 * @param respType Response type, "text" or "json"
 * @param descr Custom description of request for console output.
 */
export function sendXhr(method, url, respType = "text", descr) {
    return sendXhrData(method, url, null, respType, descr);
}
/**
 * Asynchronous XHR function.
 * @param method "GET" or "POST"
 * @param url "URL" for request
 * @param data Data to send with request
 * @param respType Response type, "text" or "json"
 * @param descr Custom description of request for console output.
 */
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
                // here we could do for example: resolve(JSON.parse(xhr.response));
            }
            else {
                reject(xhr.response); // reject with full response content to use later
                // 'reject' does not abort code flow (like return or break)
                cerr(xhr.status); // may be for example: 401
            }
        };
        const handleError = (ev) => {
            // serious error like timeout or unreachable URL or no internet connection
            reject(new Error("jXhr: failed to send request!"));
            console.group(descr);
            cout(ev);
            cerr("jXhr: status " + xhr.status);
            console.groupEnd();
        };
        xhr.open(method, url);
        if (method === "POST" && respType === "json") {
            cout("jXhr: setRequestHeader 'Content-Type application/json'");
            xhr.setRequestHeader("Content-Type", "application/json"); // neccessary for some servers
        }
        xhr.responseType = respType; // if respType set to "json" then xhr will automatically use JSON.parse() on it later to convert it to JS object
        xhr.addEventListener("load", handleLoad);
        xhr.addEventListener("error", handleError);
        // other possible events: loadstart, loadend, progress, abort
        xhr.send(data);
    };
    httpPromise = new Promise(httpReq);
    return httpPromise; // function has to return type Promise to work with 'await'
}
