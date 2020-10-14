﻿/**
  * @description Vanilla TypeScript program for job-search on Monster server.
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/
/**
 *
 */

import * as jXhr from "./jXhr.js";
import * as jLoader from "./jLoader.js";
import * as jHelpers from "./jHelpers.js";
import * as sForms from "./styledForms.js";
import APILIST from "./apiResources.js";

const DUMMY_LOGO = "icons/logo-placeholder-optim.svg",
      //SCREEN_LARGE = window.matchMedia("(min-width: 801px)").matches,
      //SCREEN_SMALL = window.matchMedia("(max-width: 640px)").matches,
      SCREEN_MEDIUM: boolean =
        window.matchMedia("(min-width: 641px) and (max-width: 800px)").matches;

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

interface GlobalElements {
  messages: HTMLElement;
  templateJob: HTMLTemplateElement;
  searchResults: HTMLElement;
  jobHeader: HTMLElement;
  rawJobData: HTMLElement;
  searchButton: HTMLElement;
  loadMoreButton: HTMLElement;
  countrySelectBox: HTMLSelectElement;
  toggleResults: HTMLElement;
}

let globEl: GlobalElements;

interface ProcessedData {
  searchTerm: string;
  searchLocation: string;
  pageOffset: number; // -1 if undefined
  pageSize: number; // -1 if undefined
  totalResults: number;
}

let _responseFingerprint: ProcessedData;

let _currentResults: any[] = []; //TODO: get rid of any

interface JsonSingleJobResult {
  dateRecency: string;
  schemaVersion: string;
  jobId: string;
  status: string;
  jobPosting: {
    title: string;
    description: string;
    url: string;
    datePosted: string;
    jobLocation: [
      {
        address: {
          addressLocality: string;
          addressRegion: string;
          addressCountry: string;
          postalCode?: string;
        }
      }
    ];
    hiringOrganization: {
      name: string;
      logo?: string;
    }
  }
}

interface JsonResponse {
  jobRequest?: {
    offset: number;
    pageSize: number;
    jobQuery: {
      query: string;
      locations: [
        {
          address: string;
          country: string;
        }
      ];
    };
  };
  totalSize: number;
  estimatedTotalSize: number;
  jobResults: JsonSingleJobResult[] | []; // empty[] if totalSize: 0 (no jobs found)
}


function generateError(msg: string): never {
  throw {
    message: msg,
    from: "index.ts generateError()"
  };
}

/**
 * This function gets rid of awkward JS type union (HTMLElement | null)
 * in getElementById's return value. Better to use try..catch blocks.
 */
function getElem(elem: string): HTMLElement {
  const maybeElem = document.getElementById(elem);
  if (maybeElem === null) generateError(`getElem: could not find element ${elem}`);
  return maybeElem;
}


function queryHTMLElem(elem: string): HTMLElement | null {
  return document.querySelector(elem);
}

/**
 * @description Shows or hides the "Load more" button below search results
 */
function showLoadMore(showButton: boolean = true): void {
  if (showButton) {
    globEl.searchResults.append(globEl.loadMoreButton);
    globEl.loadMoreButton.style.display = "block";
  } else {
    globEl.loadMoreButton.style.display = "none";
    document.body.append(globEl.loadMoreButton);
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
      locations: [{ address: searchLocation, country: APILIST[globEl.countrySelectBox.value].code }],
      query: searchTerm
    },
    offset: pageOffset,
    pageSize: pageSize
  };

  let responseData: JsonResponse;
  jLoader.showLoader();

  console.log(`selected country: ${globEl.countrySelectBox.value}`);

  try {
    responseData = await jXhr.sendXhrData("POST", APILIST[globEl.countrySelectBox.value].url, JSON.stringify(dataQuery), "json", "jobsearch request");
    console.log("responseData OK!");

    // all errors occuring inside of processResults will also be caught here
    _responseFingerprint = processResults(responseData);

    if (_responseFingerprint.pageOffset !== -1 && _responseFingerprint.pageSize !== -1) {
      if (_responseFingerprint.totalResults > (_responseFingerprint.pageOffset + _responseFingerprint.pageSize)) {
        showLoadMore();
      }
    }
  } catch (error) {
    console.error("catch block here, details: ", error);
    jHelpers.outTextBr(globEl.messages, "An ERROR occured:");
    jHelpers.outTextBr(globEl.messages, error.message);
    jHelpers.outTextBr(globEl.messages, error.details);
  } finally {
    jLoader.hideLoader();
  }
}

/**
 * @description Makes all special character XML-conform.
 */
function makeXMLconform(inputText: string): string {
  let out: string = "";
  let regex: RegExp = /&(?!amp|#38)/g;
  //TODO: more special characters

  out = inputText.replace(regex, "&amp;");
  return out;
}

/**
 * @description View job details by jobID from search results
 * @returns {number} returns 0 if foundIndex is -1, otherwise 1
 */
function viewJob(id: string): number {
  let foundIndex: number = -1,
      myDate: Date,
      formattedDate: string,
      jobTitle: string,
      logoSrc: string;

  let companyLogoBig: HTMLImageElement;

  for (let i = 0; i < _currentResults.length; i++) {
    if (_currentResults[i].jobId === id) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    // this should never happen
    console.error("viewJob() foundIndex is -1");
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
  globEl.jobHeader.querySelector("h2")!.innerText = jobTitle;
  globEl.jobHeader.querySelector("h3")!.innerText = _currentResults[foundIndex].jobPosting.hiringOrganization.name;
  globEl.jobHeader.querySelector("h4")!.innerText = _currentResults[foundIndex].jobPosting.jobLocation[0].address.addressLocality;
  globEl.jobHeader.querySelector("span")!.innerText = formattedDate;
  globEl.jobHeader.querySelector("a")!.href = _currentResults[foundIndex].apply.applyUrl;
  //_jobHeader.getElementsByClassName("companyLogoBig")[0].src = logoSrc;
  //getFirstClassOfElem("companyLogoBig", _jobHeader).src = logoSrc;
  //companyLogoBig = queryHTMLElem(".companyLogoBig") as HTMLImageElement;
  companyLogoBig = globEl.jobHeader.querySelector(".companyLogoBig") as HTMLImageElement;
  companyLogoBig.src = logoSrc;

  try {
    globEl.rawJobData.innerHTML = makeXMLconform(_currentResults[foundIndex].jobPosting.description);
  } catch (error) {
    jHelpers.outTextBr(globEl.messages);
    jHelpers.outTextBr(globEl.messages, "Error in text structure, job cannot be displayed.");
    console.log(_currentResults[foundIndex].jobPosting.description);
    console.error(error);
  }

  return 1;
}

/**
 * @description Click on individual job result will show the full job view.
 */
function jobClick(this: HTMLElement, ev?: Event): void {
  // 'this' here is always the node <article class="job">, so it's of type HTMLElement
  // 'ev' is undefined (because not used) when jobClick is called via apply()
  const jobID: string | null = this.getAttribute("data-jobid");
  const resultNodeLists: NodeListOf<HTMLElement> = globEl.searchResults.querySelectorAll("article");

  for (let i=0; i<resultNodeLists.length; i++) {
    resultNodeLists[i].classList.remove("selected");
  }

  this.classList.add("selected");
  if(jobID) viewJob(jobID);

  if (SCREEN_MEDIUM) {
    toggleResultsClick();
  }
}

/**
 * @description Main function to process incoming JSON data.
 * @param data XHR response data
 */
function processResults(data: JsonResponse): ProcessedData {
  let response: ProcessedData = {
    searchTerm: "",
    searchLocation: "",
    pageOffset: data.jobRequest ? data.jobRequest.offset : -1,
    pageSize: data.jobRequest ? data.jobRequest.pageSize : -1,
    totalResults: data.estimatedTotalSize
  };

  let smallLogo: HTMLImageElement;

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

  if (response.pageOffset !== -1) {
    jHelpers.outText(globEl.messages, response.pageOffset + data.totalSize + "", true);
  }

  jHelpers.outText(globEl.messages, " currently loaded");

  for (let i = 0; i < data.totalSize; i++) {
    // data.totalSize is the number of jobs returned in current pageOffset

    let job = document.importNode(globEl.templateJob.content, true); // true = deep copy
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

    job.firstElementChild?.setAttribute("data-jobid", jobID); // data-xx always lowercase
    job.querySelector("h3")!.textContent = data.jobResults[i].jobPosting.title;

    if (!postalCode) {
      postalCode = "";
    }

    job.querySelector(".company")!.textContent = companyName;
    job.querySelector(".location")!.textContent = `${postalCode} ${locality} (${countryCode})`;
    job.querySelector(".lastUpdate")!.textContent = data.jobResults[i].dateRecency;
    job.querySelector(".summary")!.textContent = summary.substring(0, 160) + "... ";

    if (logo) {
      smallLogo = job.querySelector(".companyLogoSmall") as HTMLImageElement;
      smallLogo.src = logo;
    }

    job.firstElementChild?.addEventListener("click", jobClick);

    globEl.searchResults.append(job);
    _currentResults.push(data.jobResults[i]);
  }

  console.log("_currentResults:", _currentResults);

  if (response.pageOffset === 0) {
    // we are on 1st page, directly select (click) 1st job in results
    jobClick.apply(globEl.searchResults.querySelector("article")!);
  }

  return response;
}

/**
 * @description SEARCH button click handler
 */
function searchClick(ev: Event) {
  //let title = getInputElem("inputTitle").value;
  let title = getElem("inputTitle") as HTMLInputElement;
  let location = getElem("inputLocation") as HTMLInputElement;
  let intro = getElem("intro");
  //console.log(ev.constructor.name); // 'MouseEvent' even if clicked via keyboard!
  ev.preventDefault();
  intro.style.display = "none";
  jHelpers.removeChildrenOf(globEl.messages);
  jHelpers.removeChildrenOf(globEl.searchResults);

  searchJobs(title.value, location.value);
  globEl.searchButton.blur(); // remove focus
}

/**
 * @description "Load more" button click handler
 */
function loadMoreClick(): void {
  const pOffset: number = (_responseFingerprint.pageOffset !== -1) ? _responseFingerprint.pageOffset : 0;
  console.log("loading more jobs...");
  showLoadMore(false);
  searchJobs( _responseFingerprint.searchTerm, _responseFingerprint.searchLocation, pOffset + 10, _responseFingerprint.pageSize );
}

/**
 * @description Click handler for "toggle search results" icon
 */
function toggleResultsClick(ev?: Event): void {
  const opened: boolean = !!globEl.toggleResults.dataset["opened"];

  console.log(globEl.toggleResults.dataset);

  if (!opened) {
    globEl.toggleResults.dataset["opened"] = "1";
    globEl.searchResults.style.left = "0";
    queryHTMLElem(".jobContent")!.style.height = "1px";
    queryHTMLElem(".jobContent")!.style.overflowY = "hidden";
  } else {
    delete globEl.toggleResults.dataset["opened"];
    globEl.searchResults.style.left = "-100%";
    queryHTMLElem(".jobContent")!.style.height = "auto";
    queryHTMLElem(".jobContent")!.style.overflowY = "scroll";
  }
}

/**
 * @returns True on success.
 */
function gatherHTMLElements(): boolean {
  try {
    globEl = {
      messages: getElem("messages"),
      templateJob: getElem("templateJob") as HTMLTemplateElement,
      searchResults: getElem("searchResults"),
      jobHeader: getElem("jobHeader"),
      rawJobData: getElem("rawJobData"),
      searchButton: getElem("searchButton"),
      loadMoreButton: getElem("loadMoreButton"),
      countrySelectBox: getElem("countriesList") as HTMLSelectElement,
      toggleResults: getElem("toggleResults")
    };
    return true;
  } catch (err) {
    console.error(err.message);
    return false;
  }
}


function setDark() {
  jHelpers.setCSSrootColors(darkTheme);
}



function main(): boolean {
  if (!gatherHTMLElements()) return false;
  console.info("All HTML elements found, let's get started...");

  // ADD EVENTS
  globEl.searchButton.addEventListener("click", searchClick);
  globEl.loadMoreButton.addEventListener("click", loadMoreClick);
  globEl.toggleResults.addEventListener("click", toggleResultsClick);

  // CUSTOM FORM ELEMENTS
  sForms.styleSelectbox(globEl.countrySelectBox, {
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


  //setTimeout(setDark, 3000);
  return true;
}


main();
