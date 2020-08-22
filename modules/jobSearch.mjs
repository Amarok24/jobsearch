﻿﻿/**
  * @name jobSearch.mjs
  * @description Vanilla JavaScript program for job-search on Monster server.
  * @version 0.22
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/

// @ts-nocheck

import * as jXhr from "./jXhr.mjs";
import * as jLoader from "./jLoader.mjs";
import * as jHelpers from "./jHelpers.mjs";
import APILIST from "./apiResources.mjs";


const elID = document.getElementById,
      cout = console.log,
      cerr = console.error,
      DUMMY_LOGO = "icons/logo-placeholder-optim.svg";

let _messages = elID("messages"),
    _templateJob = elID("templateJob"),
    _searchResults = elID("searchResults"),
    _jobDetailHeader = elID("jobDetailHeader"),
    _jobDetailContent = elID("jobDetailContent"),
    _searchButton = elID("searchButton"),
    _loadMoreButton = elID("loadMoreButton"),
    _countrySelectBox = elID("countriesList");

let _currentResults = [];
let _responseFingerprint = {};


// @desc Shows or hides the "Load more" button below search results
function showLoadMore(showButton = true) {
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


// @desc Search for jobs is handled here :-)
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
    responseData = await jXhr.sendXhrData("POST", APILIST[_countrySelectBox.value].url, JSON.stringify(dataQuery), "json");
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


// @desc View job details by jobID from search results
function viewJob(id) {
  let foundIndex = null,
      myDate,
      formattedDate = "",
      jobTitle = "",
      logoSrc = "";

  for (let i = 0; i < _currentResults.length; i++) {
    if (_currentResults[i].jobId === id) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === null) {
    // this should never happen
    cerr("viewJob() foundIndex is null");
    return -1;
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
  _jobDetailHeader.querySelector("h2").innerText = jobTitle;
  _jobDetailHeader.querySelector("h3").innerText = _currentResults[foundIndex].jobPosting.hiringOrganization.name;
  _jobDetailHeader.querySelector("h4").innerText = _currentResults[foundIndex].jobPosting.jobLocation[0].address.addressLocality;
  _jobDetailHeader.querySelector(".datePublished").innerText = formattedDate;
  _jobDetailHeader.querySelector("a").href = _currentResults[foundIndex].apply.applyUrl;
  _jobDetailHeader.querySelector(".companyLogoBig").src = logoSrc;

  _jobDetailContent.innerHTML = _currentResults[foundIndex].jobPosting.description;
}


// @desc Click on individual job result will show the full job view.
function jobClick() {
  // 'this' is the node <article class="job">
  const jobID = this.getAttribute("data-jobid");
  const resultNodeLists = _searchResults.querySelectorAll("article");

  for (let i=0; i<resultNodeLists.length; i++) {
    resultNodeLists[i].classList.remove("selected");
  }

  this.classList.add("selected");
  viewJob(jobID);
}


function processResults(data) {
  let response = {
    searchTerm: "",
    searchLocation: "",
    pageOffset: data.jobRequest?.offset,
    pageSize: data.jobRequest?.pageSize,
    totalResults: data.estimatedTotalSize
  };

  cout("data:", data);

  if (!data) {
    jHelpers.outTextBr(_messages, "Unusual error, no data in processResults.");
    return 1;
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
  jHelpers.outTextBr(_messages, response.totalResults, true);
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
      job.querySelector(".companyLogoSmall").src = logo;
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


function searchClick(ev) {
  let title = elID("inputTitle").value;
  let location = elID("inputLocation").value;
  let intro = elID("intro");

  ev.preventDefault();
  intro.style.display = "none";
  jHelpers.removeChildrenOf(_messages);
  jHelpers.removeChildrenOf(_searchResults);

  searchJobs(title, location);
  _searchButton.blur(); // remove focus
}


function loadMoreClick() {
  cout("loading more jobs...");
  showLoadMore(false);
  searchJobs( _responseFingerprint.searchTerm, _responseFingerprint.searchLocation, _responseFingerprint.pageOffset + 10, _responseFingerprint.pageSize );
}



// ADD EVENTS
_searchButton.addEventListener("click", searchClick);
_loadMoreButton.addEventListener("click", loadMoreClick);
