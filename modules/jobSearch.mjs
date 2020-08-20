﻿/**
  * @name jobSearch.mjs
  * @description Vanilla JavaScript program for job-search on Monster server.
  * @version 0.2
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as jXhr from "./jXhr.mjs";
import * as jLoader from "./jLoader.mjs";
import * as jHelpers from "./jHelpers.mjs";
import APILIST from "./apiResources.mjs";


let cout = console.log;
let cerr = console.error;

let _messages = document.getElementById("messages");
let _templateJob = document.getElementById("templateJob");
let _searchResults = document.getElementById("searchResults");
let _jobDetailHeader = document.getElementById("jobDetailHeader");
let _jobWrap = document.getElementById("jobWrap");
let _searchButton = document.getElementById("searchButton");
let _loadMoreButton = document.getElementById("loadMoreButton");
let _countrySelectBox = document.getElementById("countriesList");
let _countrySelected = "US";

let _currentResults = [];
let _responseFingerprint = {
  searchTerm: "",
  searchLocation: "",
  pageOffset: null,
  pageSize: null,
  totalResults: null
};






// removes all html tags from string, only basic functionality
function removeHTML(s) {
  let r = s.replace(/<(?:\/|\s)?(?:h.|p|ul|ol|li|strong|em|div|span).*?>/gmi, " ");
  return r;
}


function setLoadMore(showButton = true) {
  if (showButton === true) {
    cout("showing button");
    _searchResults.append(_loadMoreButton);
    _loadMoreButton.style.display = "block";
  } else {
    cout("hiding button");
    _loadMoreButton.style.display = "none";
    document.body.append(_loadMoreButton);
  }
}


async function searchJobs(searchTerm, searchLocation, pageOffset = 0, pageSize = 10) {
  const dataQuery = {
    jobQuery: {
      locations: [{ address: searchLocation, country: APILIST[_countrySelected].code }],
      query: searchTerm
    },
    offset: pageOffset,
    pageSize: pageSize
  };

  let responseData = null;
  jLoader.showLoader();

  cout("selected country: ", _countrySelected);

  try {
    responseData = await jXhr.sendXhrData("POST", APILIST[_countrySelected].url, JSON.stringify(dataQuery), "json");
    cout("responseData OK!");
    _responseFingerprint = processResults(responseData); // all errors insinde processResults will also be catched here
    cout(_responseFingerprint);
    if (_responseFingerprint.totalResults > (_responseFingerprint.pageOffset + _responseFingerprint.pageSize)) {
      cout("more jobs to come, showing button");
      setLoadMore();
    } else {
      cout("no more jobs to come, button stays hidden");
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
  let foundIndex = null;
  let myDate;
  let formattedDate = "";
  let jobTitle = "";

  cout(_currentResults);

  for (let i=0; i<_currentResults.length; i++) {
    if (_currentResults[i].jobId === id) {
      cout("found!");
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === null) {
    cerr("foundIndex is null");
    return -1;
  }

  //cout(_jobDetailHeader);

  myDate = new Date(_currentResults[foundIndex].formattedDate);
  formattedDate = "Last update: " + (myDate.getUTCDate() + 1) + "." +  (myDate.getUTCMonth() + 1) + "." + myDate.getUTCFullYear();

  jobTitle = _currentResults[foundIndex].jobPosting.title;
  if (jobTitle.length > 70) {
    jobTitle = jobTitle.substring(0, 70) + "...";
  }
  _jobDetailHeader.querySelector("h2").innerText = jobTitle;
  _jobDetailHeader.querySelector("h3").innerText = _currentResults[foundIndex].jobPosting.hiringOrganization.name;
  _jobDetailHeader.querySelector("h4").innerText = _currentResults[foundIndex].jobPosting.jobLocation[0].address.addressLocality;
  _jobDetailHeader.querySelector(".datePublished").innerText = formattedDate;
  _jobDetailHeader.querySelector("a").href = _currentResults[foundIndex].apply.applyUrl;

  _jobWrap.innerHTML = _currentResults[foundIndex].jobPosting.description;

}


function jobClick(ev) {
  cout("ev = ", ev);
  cout("this = ", this);

  let jobID = this.getAttribute("data-jobid");
  cout(jobID);

  let resultNodeLists = _searchResults.querySelectorAll("article");

  for (let i=0; i<resultNodeLists.length; i++) {
    //cout(resultNodeLists);
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

  cout(data);

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
    summary = removeHTML(summary);

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
/*
    if (i===0) {
      job.firstElementChild.classList.add("selected");
      _jobWrap.innerHTML = data.jobResults[i].jobPosting.description;
    }
 */
    _searchResults.append(job);

    _currentResults.push(data.jobResults[i]);

  }

  if (response.pageOffset === 0) {
    // we are on 1st page, directly select (click) 1st job in results
    jobClick.apply(_searchResults.querySelector("article"), [data.jobResults[0].jobId]);
  }

  return response;
}


function searchClick(ev) {
  let title = document.getElementById("inputTitle").value;
  let location = document.getElementById("inputLocation").value;
  let intro = document.getElementById("intro");
  ev.preventDefault();
  intro.style.display = "none";
  jHelpers.removeChildrenOf(_messages);
  jHelpers.removeChildrenOf(_searchResults);

  searchJobs(title, location);
  //processResults(JSON_SAMPLE);

  _searchButton.blur(); // remove focus
}


function loadMoreClick() {
  cout("loading more jobs...");
  setLoadMore(false);
  searchJobs( _responseFingerprint.searchTerm, _responseFingerprint.searchLocation, _responseFingerprint.pageOffset + 10, _responseFingerprint.pageSize );
}


function main() {
  _searchButton.addEventListener("click", searchClick);
  _loadMoreButton.addEventListener("click", loadMoreClick);
  _countrySelectBox.addEventListener("change", () => {_countrySelected = _countrySelectBox.value; });
}


main();
