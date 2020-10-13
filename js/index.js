import * as jXhr from "./jXhr.js";
import * as jLoader from "./jLoader.js";
import * as jHelpers from "./jHelpers.js";
import * as sForms from "./styledForms.js";
import APILIST from "./apiResources.js";
const DUMMY_LOGO = "icons/logo-placeholder-optim.svg", SCREEN_MEDIUM = window.matchMedia("(min-width: 641px) and (max-width: 800px)").matches;
const darkTheme = {
    "--color_1": "#10021b",
    "--color_2": "#38062f",
    "--color_3": "#641c52",
    "--color_4": "#35024e",
    "--color_5": "#66002b",
    "--color_6": "#8e9191",
    "--color_7": "#968787",
    "--color_8": "#606060",
    "--color_9": "black",
    "--color_10": "#bababa",
    "--color_11": "#303030",
    "--color_12": "darkred"
};
let globEl;
let _currentResults = [];
let _responseFingerprint;
;
;
function generateError(msg) {
    throw {
        message: msg,
        from: "index.ts generateError()"
    };
}
function getElem(elem) {
    const maybeElem = document.getElementById(elem);
    if (maybeElem === null)
        generateError(`getElem: could not find element ${elem}`);
    return maybeElem;
}
function queryHTMLElem(elem) {
    return document.querySelector(elem);
}
function showLoadMore(showButton = true) {
    if (showButton) {
        globEl.searchResults.append(globEl.loadMoreButton);
        globEl.loadMoreButton.style.display = "block";
    }
    else {
        globEl.loadMoreButton.style.display = "none";
        document.body.append(globEl.loadMoreButton);
    }
}
async function searchJobs(searchTerm, searchLocation, pageOffset = 0, pageSize = 10) {
    const dataQuery = {
        jobQuery: {
            locations: [{ address: searchLocation, country: APILIST[globEl.countrySelectBox.value].code }],
            query: searchTerm
        },
        offset: pageOffset,
        pageSize: pageSize
    };
    let responseData;
    jLoader.showLoader();
    console.log(`selected country: ${globEl.countrySelectBox.value}`);
    try {
        responseData = await jXhr.sendXhrData("POST", APILIST[globEl.countrySelectBox.value].url, JSON.stringify(dataQuery), "json", "jobsearch request");
        console.log("responseData OK!");
        _responseFingerprint = processResults(responseData);
        if (_responseFingerprint.pageOffset !== undefined && _responseFingerprint.pageSize !== undefined) {
            if (_responseFingerprint.totalResults > (_responseFingerprint.pageOffset + _responseFingerprint.pageSize)) {
                showLoadMore();
            }
        }
    }
    catch (error) {
        console.error("catch block here, details: ", error);
        jHelpers.outTextBr(globEl.messages, "An ERROR occured:");
        jHelpers.outTextBr(globEl.messages, error.message);
        jHelpers.outTextBr(globEl.messages, error.details);
    }
    finally {
        jLoader.hideLoader();
    }
}
function makeXMLconform(inputText) {
    let out = "";
    let regex = /&(?!amp|#38)/g;
    out = inputText.replace(regex, "&amp;");
    return out;
}
function viewJob(id) {
    let foundIndex = -1, myDate, formattedDate, jobTitle, logoSrc;
    let companyLogoBig;
    for (let i = 0; i < _currentResults.length; i++) {
        if (_currentResults[i].jobId === id) {
            foundIndex = i;
            break;
        }
    }
    if (foundIndex === -1) {
        console.error("viewJob() foundIndex is -1");
        return 0;
    }
    myDate = new Date(_currentResults[foundIndex].formattedDate);
    formattedDate = "Last update: " + (myDate.getUTCDate() + 1) + "." + (myDate.getUTCMonth() + 1) + "." + myDate.getUTCFullYear();
    logoSrc = _currentResults[foundIndex].jobPosting.hiringOrganization.logo;
    if (!logoSrc) {
        logoSrc = DUMMY_LOGO;
    }
    jobTitle = _currentResults[foundIndex].jobPosting.title;
    if (jobTitle.length > 70) {
        jobTitle = jobTitle.substring(0, 70) + "...";
    }
    globEl.jobHeader.querySelector("h2").innerText = jobTitle;
    globEl.jobHeader.querySelector("h3").innerText = _currentResults[foundIndex].jobPosting.hiringOrganization.name;
    globEl.jobHeader.querySelector("h4").innerText = _currentResults[foundIndex].jobPosting.jobLocation[0].address.addressLocality;
    globEl.jobHeader.querySelector("span").innerText = formattedDate;
    globEl.jobHeader.querySelector("a").href = _currentResults[foundIndex].apply.applyUrl;
    companyLogoBig = globEl.jobHeader.querySelector(".companyLogoBig");
    companyLogoBig.src = logoSrc;
    try {
        globEl.rawJobData.innerHTML = makeXMLconform(_currentResults[foundIndex].jobPosting.description);
    }
    catch (error) {
        jHelpers.outTextBr(globEl.messages);
        jHelpers.outTextBr(globEl.messages, "Error in text structure, job cannot be displayed.");
        console.log(_currentResults[foundIndex].jobPosting.description);
        console.error(error);
    }
    return 1;
}
function jobClick(ev) {
    const jobID = this.getAttribute("data-jobid");
    const resultNodeLists = globEl.searchResults.querySelectorAll("article");
    for (let i = 0; i < resultNodeLists.length; i++) {
        resultNodeLists[i].classList.remove("selected");
    }
    this.classList.add("selected");
    if (jobID)
        viewJob(jobID);
    if (SCREEN_MEDIUM) {
        toggleResultsClick();
    }
}
function processResults(data) {
    var _a, _b, _c, _d;
    let response = {
        searchTerm: "",
        searchLocation: "",
        pageOffset: (_a = data.jobRequest) === null || _a === void 0 ? void 0 : _a.offset,
        pageSize: (_b = data.jobRequest) === null || _b === void 0 ? void 0 : _b.pageSize,
        totalResults: data.estimatedTotalSize
    };
    let smallLogo;
    console.log("processResults here, data:", data);
    if (!data) {
        jHelpers.outTextBr(globEl.messages, "Unusual error, 'data' in processResults undefined.");
        generateError("Unusual error, 'data' in processResults undefined.");
    }
    if (response.totalResults === 0) {
        jHelpers.outTextBr(globEl.messages, "0 jobs found");
        return response;
    }
    if (data.jobRequest) {
        response.searchTerm = data.jobRequest.jobQuery.query;
        response.searchLocation = data.jobRequest.jobQuery.locations[0].address;
    }
    jHelpers.removeChildrenOf(globEl.messages);
    jHelpers.outText(globEl.messages, response.searchTerm, true);
    if (response.searchLocation.length !== 0) {
        jHelpers.outText(globEl.messages, " in ");
        jHelpers.outText(globEl.messages, response.searchLocation, true);
    }
    jHelpers.outText(globEl.messages, ", total results: ");
    jHelpers.outTextBr(globEl.messages, response.totalResults.toString(), true);
    if (response.pageOffset !== undefined) {
        jHelpers.outText(globEl.messages, response.pageOffset + data.totalSize + "", true);
    }
    jHelpers.outText(globEl.messages, " currently loaded");
    for (let i = 0; i < data.totalSize; i++) {
        let job = document.importNode(globEl.templateJob.content, true);
        let postalCode = data.jobResults[i].jobPosting.jobLocation[0].address.postalCode;
        let locality = data.jobResults[i].jobPosting.jobLocation[0].address.addressLocality;
        let countryCode = data.jobResults[i].jobPosting.jobLocation[0].address.addressCountry;
        let companyName = data.jobResults[i].jobPosting.hiringOrganization.name;
        let logo = data.jobResults[i].jobPosting.hiringOrganization.logo;
        let jobID = data.jobResults[i].jobId;
        let summary = data.jobResults[i].jobPosting.description;
        summary = jHelpers.removeHtmlTags(summary);
        (_c = job.firstElementChild) === null || _c === void 0 ? void 0 : _c.setAttribute("data-jobid", jobID);
        job.querySelector("h3").textContent = data.jobResults[i].jobPosting.title;
        if (!postalCode) {
            postalCode = "";
        }
        job.querySelector(".company").textContent = companyName;
        job.querySelector(".location").textContent = `${postalCode} ${locality} (${countryCode})`;
        job.querySelector(".lastUpdate").textContent = data.jobResults[i].dateRecency;
        job.querySelector(".summary").textContent = summary.substring(0, 160) + "... ";
        if (logo) {
            smallLogo = job.querySelector(".companyLogoSmall");
            smallLogo.src = logo;
        }
        (_d = job.firstElementChild) === null || _d === void 0 ? void 0 : _d.addEventListener("click", jobClick);
        globEl.searchResults.append(job);
        _currentResults.push(data.jobResults[i]);
    }
    console.log("_currentResults:", _currentResults);
    if (response.pageOffset === 0) {
        jobClick.apply(globEl.searchResults.querySelector("article"));
    }
    return response;
}
function searchClick(ev) {
    let title = getElem("inputTitle");
    let location = getElem("inputLocation");
    let intro = getElem("intro");
    ev.preventDefault();
    intro.style.display = "none";
    jHelpers.removeChildrenOf(globEl.messages);
    jHelpers.removeChildrenOf(globEl.searchResults);
    searchJobs(title.value, location.value);
    globEl.searchButton.blur();
}
function loadMoreClick() {
    const pOffset = _responseFingerprint.pageOffset ? _responseFingerprint.pageOffset : 0;
    console.log("loading more jobs...");
    showLoadMore(false);
    searchJobs(_responseFingerprint.searchTerm, _responseFingerprint.searchLocation, pOffset + 10, _responseFingerprint.pageSize);
}
function toggleResultsClick(ev) {
    const opened = !!globEl.toggleResults.dataset["opened"];
    console.log(globEl.toggleResults.dataset);
    if (!opened) {
        globEl.toggleResults.dataset["opened"] = "1";
        globEl.searchResults.style.left = "0";
        queryHTMLElem(".jobContent").style.height = "1px";
        queryHTMLElem(".jobContent").style.overflowY = "hidden";
    }
    else {
        delete globEl.toggleResults.dataset["opened"];
        globEl.searchResults.style.left = "-100%";
        queryHTMLElem(".jobContent").style.height = "auto";
        queryHTMLElem(".jobContent").style.overflowY = "scroll";
    }
}
function gatherElements() {
    try {
        globEl = {
            messages: getElem("messages"),
            templateJob: getElem("templateJob"),
            searchResults: getElem("searchResults"),
            jobHeader: getElem("jobHeader"),
            rawJobData: getElem("rawJobData"),
            searchButton: getElem("searchButton"),
            loadMoreButton: getElem("loadMoreButton"),
            countrySelectBox: getElem("countriesList"),
            toggleResults: getElem("toggleResults")
        };
        return true;
    }
    catch (err) {
        console.error(err.message);
        return false;
    }
}
function setDark() {
    jHelpers.setCSSrootColors(darkTheme);
}
function main() {
    if (!gatherElements())
        return false;
    console.info("All HTML elements found, let's get started...");
    globEl.searchButton.addEventListener("click", searchClick);
    globEl.loadMoreButton.addEventListener("click", loadMoreClick);
    globEl.toggleResults.addEventListener("click", toggleResultsClick);
    sForms.styleSelectbox(globEl.countrySelectBox, {
        selectIndex: 2,
        individualStyles: [
            { backgroundImage: "url(icons/flags/us.svg)" },
            { backgroundImage: "url(icons/flags/ca.svg)" },
            { backgroundImage: "url(icons/flags/de.svg)" },
            { backgroundImage: "url(icons/flags/at.svg)" },
            { backgroundImage: "url(icons/flags/gb.svg)" },
            { backgroundImage: "url(icons/flags/fr.svg)" },
            { backgroundImage: "url(icons/flags/es.svg)" },
            { backgroundImage: "url(icons/flags/it.svg)" },
            { backgroundImage: "url(icons/flags/cz.svg)" }
        ],
        eachStyle: {
            paddingRight: "50px",
            backgroundSize: "22px auto",
            backgroundPosition: "60% center",
            backgroundRepeat: "no-repeat"
        }
    });
    return true;
}
main();
//# sourceMappingURL=index.js.map