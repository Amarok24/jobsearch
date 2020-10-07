﻿/**
  * @name jobSearch.ts
  * @description Vanilla TypeScript program for job-search on Monster server.
  * @version 1.00
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as jXhr from "./jXhr.js";
import * as jLoader from "./jLoader.js";
import * as jHelpers from "./jHelpers.js";
import * as sForms from "./styledForms.js";
import APILIST from "./apiResources.js";


const cout = console.log,
      cerr = console.error,
      DUMMY_LOGO = "icons/logo-placeholder-optim.svg",
      SCREEN_LARGE = window.matchMedia("(min-width: 801px)").matches,
      SCREEN_MEDIUM = window.matchMedia("(min-width: 641px) and (max-width: 800px)").matches,
      SCREEN_SMALL = window.matchMedia("(max-width: 640px)").matches,
      TOUCHSCREEN = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

let _messages = getElem("messages"),
    _templateJob = getElem("templateJob") as HTMLTemplateElement,
    _searchResults = getElem("searchResults"),
    _jobHeader = getElem("jobHeader"),
    _rawJobData = getElem("rawJobData"),
    _searchButton = getElem("searchButton"),
    _loadMoreButton = getElem("loadMoreButton"),
    _countrySelectBox = getElem("countriesList") as HTMLSelectElement,
    _toggleResults = getElem("toggleResults");

let _currentResults = [];
let _responseFingerprint: Response;

interface Response {
  searchTerm: string;
  searchLocation: string;
  pageOffset: number;
  pageSize: number;
  totalResults: number;
};


function getElem(elem: string): HTMLElement {
  return document.getElementById(elem);
}

function getInputElem(elem: string): HTMLInputElement {
  return document.getElementById(elem) as HTMLInputElement;
}


function queryHTMLElem(elem: string): HTMLElement {
  return document.querySelector(elem);
}


function generateError(msg: string, code: number): never {
  throw {
    message: msg,
    errorCode: code
  };
}


/**
 * @description Shows or hides the "Load more" button below search results
 */
function showLoadMore(showButton: boolean = true): void {
  if (showButton) {
    cout("showing 'Load more' button");
    _searchResults.append(_loadMoreButton);
    _loadMoreButton.style.display = "block";
  } else {
    cout("hiding 'Load more' button");
    _loadMoreButton.style.display = "none";
    document.body.append(_loadMoreButton);
  }
}

/**
 * @description Search for jobs is handled here :-)
 * @param searchLocation Location (city)
 * @param pageOffset Page offset, starts at offset 0 (influenced by pageSize)
 * @param pageSize Results per page (influences pageOffset)
 */
async function searchJobs(searchTerm: string, searchLocation: string, pageOffset: number = 0, pageSize: number = 10): Promise<void> {
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

    // all errors occuring inside of processResults will also be caught here
    _responseFingerprint = processResults(responseData);

    if (_responseFingerprint.totalResults > (_responseFingerprint.pageOffset + _responseFingerprint.pageSize)) {
      showLoadMore();
    }
  } catch (error) {
    cerr("catch block here, details: ", error);
    jHelpers.outTextBr(_messages, "An ERROR occured:");
    jHelpers.outTextBr(_messages, error.message);
    jHelpers.outTextBr(_messages, error.details);
  } finally {
    jLoader.hideLoader();
  }
}

/**
 * @description Makes all special character XML-conform.
 */
function makeXMLconform(inputText: string): string {
  let out = "";
  let regex = /&(?!amp|#38)/g;
  //TODO: more special characters

  out = inputText.replace(regex, "&amp;");
  return out;
}

/**
 * @description View job details by jobID from search results
 * @returns {number} returns 0 if foundIndex is null, otherwise 1
 */
function viewJob(id: string): number {
  let foundIndex = null,
      myDate,
      formattedDate = "",
      jobTitle = "",
      logoSrc = "";

  let companyLogoBig: HTMLImageElement;

  for (let i = 0; i < _currentResults.length; i++) {
    if (_currentResults[i].jobId === id) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === null) {
    // this should never happen
    cerr("viewJob() foundIndex is null");
    return 0;
  }

  myDate = new Date(_currentResults[foundIndex].formattedDate);
  formattedDate = "Last update: " + (myDate.getUTCDate() + 1) + "." +  (myDate.getUTCMonth() + 1) + "." + myDate.getUTCFullYear();

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
  //_jobHeader.getElementsByClassName("companyLogoBig")[0].src = logoSrc;
  //getFirstClassOfElem("companyLogoBig", _jobHeader).src = logoSrc;
  //companyLogoBig = queryHTMLElem(".companyLogoBig") as HTMLImageElement;
  companyLogoBig = _jobHeader.querySelector(".companyLogoBig") as HTMLImageElement;
  companyLogoBig.src = logoSrc;

  try {
    _rawJobData.innerHTML = makeXMLconform(_currentResults[foundIndex].jobPosting.description);
  } catch (error) {
    jHelpers.outTextBr(_messages);
    jHelpers.outTextBr(_messages, "Error in text structure, job cannot be displayed.");
    cout(_currentResults[foundIndex].jobPosting.description);
    cerr(error);
  }

  return 1;
}

/**
 * @description Click on individual job result will show the full job view.
 */
function jobClick(): void {
  // 'this' is the node <article class="job">
  const jobID = this.getAttribute("data-jobid");
  const resultNodeLists = _searchResults.querySelectorAll("article");

  for (let i=0; i<resultNodeLists.length; i++) {
    resultNodeLists[i].classList.remove("selected");
  }

  this.classList.add("selected");
  viewJob(jobID);

  if (SCREEN_MEDIUM) {
    toggleResultsClick();
  }
}

/**
 * @description Main function to process incoming JSON data.
 * @param data XHR response data
 */
function processResults(data: any): Response {
  let response: Response = {
    searchTerm: "",
    searchLocation: "",
    pageOffset: data.jobRequest?.offset, // ?. == optional chaining, ES2020
    pageSize: data.jobRequest?.pageSize,
    totalResults: data.estimatedTotalSize
  };

  let smallLogo: HTMLImageElement;

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
    // data.totalSize is the number of jobs returned in current pageOffset

    let job = document.importNode(_templateJob.content, true); // true = deep copy
    // type of 'job' is developer.mozilla.org/en-US/docs/Web/API/DocumentFragment

    let postalCode = data.jobResults[i].jobPosting.jobLocation[0].address.postalCode;
    let locality = data.jobResults[i].jobPosting.jobLocation[0].address.addressLocality;
    let countryCode = data.jobResults[i].jobPosting.jobLocation[0].address.addressCountry;
    //let refNum = data.jobResults[i].jobPosting.identifier.value; // customer's own refnum
    let companyName =  data.jobResults[i].jobPosting.hiringOrganization.name;
    let logo = data.jobResults[i].jobPosting.hiringOrganization.logo;
    let jobID = data.jobResults[i].jobId;

    let summary = data.jobResults[i].jobPosting.description;
    summary = jHelpers.removeHtmlTags(summary);

    job.firstElementChild.setAttribute("data-jobid", jobID); // data-xx always lowercase
    job.querySelector("h3").textContent = data.jobResults[i].jobPosting.title;

    if (!postalCode) {
      postalCode = "";
    }

    job.querySelector(".company").textContent = companyName;
    job.querySelector(".location").textContent = `${postalCode} ${locality} (${countryCode})`;
    job.querySelector(".lastUpdate").textContent = data.jobResults[i].dateRecency;
    job.querySelector(".summary").textContent = summary.substring(0, 160) + "... ";

    if (logo) {
      smallLogo = job.querySelector(".companyLogoSmall") as HTMLImageElement;
      smallLogo.src = logo;
    }

    job.firstElementChild.addEventListener("click", jobClick);

    _searchResults.append(job);
    _currentResults.push(data.jobResults[i]);
  }

  cout("_currentResults:", _currentResults);

  if (response.pageOffset === 0) {
    // we are on 1st page, directly select (click) 1st job in results
    jobClick.apply(_searchResults.querySelector("article"));
  }

  return response;
}

/**
 * @description SEARCH button click handler
 */
function searchClick(ev: Event) {
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
  _searchButton.blur(); // remove focus
}

/**
 * @description "Load more" button click handler
 */
function loadMoreClick(): void {
  cout("loading more jobs...");
  showLoadMore(false);
  searchJobs( _responseFingerprint.searchTerm, _responseFingerprint.searchLocation, _responseFingerprint.pageOffset + 10, _responseFingerprint.pageSize );
}

/**
 * @description Click handler for "toggle search results" icon
 */
function toggleResultsClick(): void {
  const opened = !!_toggleResults.dataset.opened;

  cout(_toggleResults.dataset);

  if (!opened) {
    _toggleResults.dataset.opened = "1";
    _searchResults.style.left = "0";
    queryHTMLElem(".jobContent").style.height = "1px";
    queryHTMLElem(".jobContent").style.overflowY = "hidden";
  } else {
    delete _toggleResults.dataset.opened;
    _searchResults.style.left = "-100%";
    queryHTMLElem(".jobContent").style.height = "auto";
    queryHTMLElem(".jobContent").style.overflowY = "scroll";
  }
}


// ADD EVENTS
_searchButton.addEventListener("click", searchClick);
_loadMoreButton.addEventListener("click", loadMoreClick);
_toggleResults.addEventListener("click", toggleResultsClick);


// CUSTOM FORM ELEMENTS
sForms.styleSelectbox(_countrySelectBox, {
  //textContents: ["US", "CA", "DE", "AT", "GB", "FR", "ES", "IT", "CZ"],
  selectIndex: 2, // directly select 2nd index ("DE" in this case)
  individualStyles: [
    {backgroundImage: "url(icons/flags/us.svg)"},
    {backgroundImage: "url(icons/flags/ca.svg)"},
    {backgroundImage: "url(icons/flags/de.svg)"},
    {backgroundImage: "url(icons/flags/at.svg)"},
    {backgroundImage: "url(icons/flags/gb.svg)"},
    {backgroundImage: "url(icons/flags/fr.svg)"},
    {backgroundImage: "url(icons/flags/es.svg)"},
    {backgroundImage: "url(icons/flags/it.svg)"},
    {backgroundImage: "url(icons/flags/cz.svg)"}
   ],
  eachStyle: {
    paddingRight: "50px",
    backgroundSize: "22px auto",
    backgroundPosition: "60% center",
    backgroundRepeat: "no-repeat"
  }
 });
 /* Icon source https://github.com/lipis/flag-icon-css
 License: MIT License, see icons/flags/LICENSE.flags.txt */



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

 //setTimeout(setDark, 3000);

 function setDark() {
  jHelpers.setCSSrootColors(darkTheme);
}
