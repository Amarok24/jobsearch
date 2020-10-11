import * as jXhr from "./jXhr.js";
import * as jLoader from "./jLoader.js";
import * as jHelpers from "./jHelpers.js";
import * as sForms from "./styledForms.js";
import APILIST from "./apiResources.js";
const cout = console.log, cerr = console.error, DUMMY_LOGO = "icons/logo-placeholder-optim.svg", SCREEN_MEDIUM = window.matchMedia("(min-width: 641px) and (max-width: 800px)").matches;
let _messages = getElem("messages"), _templateJob = getElem("templateJob"), _searchResults = getElem("searchResults"), _jobHeader = getElem("jobHeader"), _rawJobData = getElem("rawJobData"), _searchButton = getElem("searchButton"), _loadMoreButton = getElem("loadMoreButton"), _countrySelectBox = getElem("countriesList"), _toggleResults = getElem("toggleResults");
let _currentResults = [];
let _responseFingerprint;
;
function getElem(elem) {
    return document.getElementById(elem);
}
function getInputElem(elem) {
    return document.getElementById(elem);
}
function queryHTMLElem(elem) {
    return document.querySelector(elem);
}
function generateError(msg, code) {
    throw {
        message: msg,
        errorCode: code
    };
}
function showLoadMore(showButton = true) {
    if (showButton) {
        cout("showing 'Load more' button");
        _searchResults.append(_loadMoreButton);
        _loadMoreButton.style.display = "block";
    }
    else {
        cout("hiding 'Load more' button");
        _loadMoreButton.style.display = "none";
        document.body.append(_loadMoreButton);
    }
}
async function searchJobs(searchTerm, searchLocation, pageOffset = 0, pageSize = 10) {
    const dataQuery = {
        jobQuery: {
            locations: [{ address: searchLocation, country: APILIST[_countrySelectBox.value].code }],
            query: searchTerm
        },
        offset: pageOffset,
        pageSize: pageSize
    };
    let responseData = null;
    jLoader.showLoader();
    cout(`selected country: ${_countrySelectBox.value}`);
    try {
        responseData = await jXhr.sendXhrData("POST", APILIST[_countrySelectBox.value].url, JSON.stringify(dataQuery), "json", "jobsearch request");
        cout("responseData OK!");
        _responseFingerprint = processResults(responseData);
        if (_responseFingerprint.totalResults > (_responseFingerprint.pageOffset + _responseFingerprint.pageSize)) {
            showLoadMore();
        }
    }
    catch (error) {
        cerr("catch block here, details: ", error);
        jHelpers.outTextBr(_messages, "An ERROR occured:");
        jHelpers.outTextBr(_messages, error.message);
        jHelpers.outTextBr(_messages, error.details);
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
    let foundIndex = null, myDate, formattedDate = "", jobTitle = "", logoSrc = "";
    let companyLogoBig;
    for (let i = 0; i < _currentResults.length; i++) {
        if (_currentResults[i].jobId === id) {
            foundIndex = i;
            break;
        }
    }
    if (foundIndex === null) {
        cerr("viewJob() foundIndex is null");
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
    _jobHeader.querySelector("h2").innerText = jobTitle;
    _jobHeader.querySelector("h3").innerText = _currentResults[foundIndex].jobPosting.hiringOrganization.name;
    _jobHeader.querySelector("h4").innerText = _currentResults[foundIndex].jobPosting.jobLocation[0].address.addressLocality;
    _jobHeader.querySelector("span").innerText = formattedDate;
    _jobHeader.querySelector("a").href = _currentResults[foundIndex].apply.applyUrl;
    companyLogoBig = _jobHeader.querySelector(".companyLogoBig");
    companyLogoBig.src = logoSrc;
    try {
        _rawJobData.innerHTML = makeXMLconform(_currentResults[foundIndex].jobPosting.description);
    }
    catch (error) {
        jHelpers.outTextBr(_messages);
        jHelpers.outTextBr(_messages, "Error in text structure, job cannot be displayed.");
        cout(_currentResults[foundIndex].jobPosting.description);
        cerr(error);
    }
    return 1;
}
function jobClick(ev) {
    const jobID = this.getAttribute("data-jobid");
    const resultNodeLists = _searchResults.querySelectorAll("article");
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
    cout("data:", data);
    if (!data) {
        jHelpers.outTextBr(_messages, "Unusual error, no data in processResults.");
        response.searchTerm = "ERROR";
        return response;
    }
    if (response.totalResults === 0) {
        jHelpers.outTextBr(_messages, "0 jobs found");
        return response;
    }
    response.searchTerm = data.jobRequest.jobQuery.query;
    response.searchLocation = data.jobRequest.jobQuery.locations[0].address;
    jHelpers.removeChildrenOf(_messages);
    jHelpers.outText(_messages, response.searchTerm, true);
    if (response.searchLocation.length !== 0) {
        jHelpers.outText(_messages, " in ");
        jHelpers.outText(_messages, response.searchLocation, true);
    }
    jHelpers.outText(_messages, ", total results: ");
    jHelpers.outTextBr(_messages, response.totalResults.toString(), true);
    jHelpers.outText(_messages, response.pageOffset + data.totalSize, true);
    jHelpers.outText(_messages, " currently loaded");
    for (let i = 0; i < data.totalSize; i++) {
        let job = document.importNode(_templateJob.content, true);
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
        _searchResults.append(job);
        _currentResults.push(data.jobResults[i]);
    }
    cout("_currentResults:", _currentResults);
    if (response.pageOffset === 0) {
        jobClick.apply(_searchResults.querySelector("article"));
    }
    return response;
}
function searchClick(ev) {
    let title = getInputElem("inputTitle").value;
    let location = getInputElem("inputLocation").value;
    let intro = getElem("intro");
    cout(typeof ev);
    cout(ev);
    ev.preventDefault();
    intro.style.display = "none";
    jHelpers.removeChildrenOf(_messages);
    jHelpers.removeChildrenOf(_searchResults);
    searchJobs(title, location);
    _searchButton.blur();
}
function loadMoreClick() {
    cout("loading more jobs...");
    showLoadMore(false);
    searchJobs(_responseFingerprint.searchTerm, _responseFingerprint.searchLocation, _responseFingerprint.pageOffset + 10, _responseFingerprint.pageSize);
}
function toggleResultsClick(ev) {
    const opened = !!_toggleResults.dataset["opened"];
    cout(_toggleResults.dataset);
    if (!opened) {
        _toggleResults.dataset["opened"] = "1";
        _searchResults.style.left = "0";
        queryHTMLElem(".jobContent").style.height = "1px";
        queryHTMLElem(".jobContent").style.overflowY = "hidden";
    }
    else {
        delete _toggleResults.dataset["opened"];
        _searchResults.style.left = "-100%";
        queryHTMLElem(".jobContent").style.height = "auto";
        queryHTMLElem(".jobContent").style.overflowY = "scroll";
    }
}
_searchButton.addEventListener("click", searchClick);
_loadMoreButton.addEventListener("click", loadMoreClick);
_toggleResults.addEventListener("click", toggleResultsClick);
sForms.styleSelectbox(_countrySelectBox, {
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
function setDark() {
    jHelpers.setCSSrootColors(darkTheme);
}
