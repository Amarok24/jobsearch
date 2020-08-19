﻿/**
  * @name jobSearch.mjs
  * @description Vanilla JavaScript program for job-search on Monster server.
  * @version 0.11
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

let cout = console.log;
let cerr = console.error;

let _messages = document.getElementById("messages");
let _templateJob = document.getElementById("templateJob");
let _searchResults = document.getElementById("searchResults");
let _jobDetailHeader = document.getElementById("jobDetailHeader");
let _jobWrap = document.getElementById("jobWrap");
let _searchButton = document.getElementById("searchButton");
let _loadMoreButton = document.getElementById("loadMoreButton");

let _currentResults = [];
let _responseFingerprint = {
  searchTerm: "",
  searchLocation: "",
  pageOffset: null,
  pageSize: null,
  totalSize: null
};


const _API_URL = "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/de-de";
//const _API_URL = "https://job-openings.monster.com/v2/job/pure-json-view";
//const _API_URL = "https://stellenangebot.monster.de/v2/job/pure-json-view?jobid="; // GERMAN version




// removes all html tags from string, only basic functionality
function removeHTML(s) {
  let r = s.replace(/<(?:\/|\s)?(?:h.|p|ul|ol|li|strong|em|div|span).*?>/gmi, " ");
  return r;
}


function setLoadMore(showButton = true) {
  if (showButton) {
    _searchResults.append(_loadMoreButton);
    _loadMoreButton.style.display = "block";
  } else {
    _loadMoreButton.style.display = "none";
    document.querySelector("body").prepend(_loadMoreButton);
  }
  //FIXME: bug. button should be moved at the correct position
}


async function searchJobs(searchTerm, searchLocation, pageOffset = 0, pageSize = 10) {
  const dataQuery = {
    jobQuery: {
      locations: [{ address: searchLocation, country: "de" }],
      query: searchTerm
    },
    offset: pageOffset,
    pageSize: pageSize
  };

  let responseData = null;
  jLoader.showLoader();

  try {
    //responseData = await jXhr.sendXhrData("POST", _API_URL, dataQuery, "json");
    responseData = await jXhr.sendXhrData("POST", _API_URL, JSON.stringify(dataQuery), "json");
    cout("responseData OK!");
    _responseFingerprint = processResults(responseData); // all errors insinde processResults will also be catched here
    if (_responseFingerprint.totalSize > _responseFingerprint.pageOffset) {
      setLoadMore();
    }
  } catch (error) {
    cerr("catch block here, details: ", error);
    jHelpers.outTextBr(_messages, error.Error);
  } finally {
    jLoader.hideLoader();
  }
}



function viewJob(id) {
  // view job details by jobID from search results
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
    pageOffset: data.jobRequest.jobQuery.offset,
    pageSize: data.jobRequest.jobQuery.pageSize,
    totalSize: null
  };
  cout(data);

  if (!data) {
    jHelpers.outTextBr(_messages, "Search error.");
    return 1;
  }

  response.totalSize = data.estimatedTotalSize;
  response.searchTerm = data.jobRequest.jobQuery.query;
  response.searchLocation = data.jobRequest.jobQuery.locations[0].address;

  jHelpers.outText(_messages, response.searchTerm, true);
  jHelpers.outText(_messages, " in ");
  jHelpers.outText(_messages, response.searchLocation, true);
  jHelpers.outText(_messages, ", results: ");
  jHelpers.outTextBr(_messages, response.totalSize, true);

  for (let i = 0; i < data.totalSize; i++) {

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

  if (data.totalSize !== 0) {
    // directly select (click) 1st job in results
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

  if (location.length === 0) {
    location = "bundesweit";
  }
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
}


main();


/*


POST
https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/de-de

DATA WITH POST
{"jobQuery":{"locations":[{"address":"Berlin, Land Berlin","country":"de"}],"query":"fahrer"},"offset":0,"pageSize":10}

next query
offset:10

next query
offset:20

etc...

*/



const JSON_SAMPLE = {
  "totalSize": 8,
  "estimatedTotalSize": 12,
  "jobResults": [
    {
      "schemaVersion": "2.0.10",
      "jobId": "e2bafa24-f255-4458-af0a-c9817ba4a02f",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "<strong>Aktuell auf Jobsuche?</strong><br/><br/><br/>Für unseren Kunden, einem Unternehmen für Servicedienstleistungen für Mobilfunktelefone suchen wir Sie schnellstmöglich, als <strong>Fahrer (m/w/d)</strong> mit einem Faible <strong>für Handyreparaturen</strong> für den lokalen Einsatz in Ihrem Wohnumfeld in Vollzeit.<br/><br/><br/><strong>Unser Angebot an Sie:</strong><br/><br/><ul><li>Ein feste Übernahmeoption - mit uns können Sie langfristig planen!</li><li>Ihr Gehalt ist mit ca. <strong>2.800 Euro</strong> überdurchschnittlich und fix - auch damit können Sie rechnen.</li><li>Bezahlte und gut organisierte Einarbeitung.</li><li>Attraktive Arbeitszeiten - Montag bis Freitag, in Ausnahmefällen Samstag bis 18:00 Uhr!</li></ul><br/><br/><strong>Das sind Ihre Aufgaben:</strong><br/><ul><li>Mit einer mobilen Werkstatt fahren Sie nach Routenplan zu Ihren Kunden.</li><li>Freundliche Entgegennahme und Sofortreparatur von beschädigten und defekten Smartphones.</li><li>Auftragsdokumentation bildet dann den Abschluss.</li></ul><br/><br/><strong>Das bringen Sie mit:</strong><br/><ul><li>Sie sind ein echtler Tüftler und haben Freude an der oft kleinteiligen Reparatur von Smartphones.</li><li>Technikaffinität und erste Erfahrung in der Smartphonereparatur wünschenswert, aber auch im Kurs bei uns erlernbar.</li><li>Lokale Flexibilität, Engagement und Einsatzbereitschaft</li><li>Führerschein Klasse B/C/C1</li></ul><br/><br/><strong>Interessiert?</strong><br/><br/><br/>Dann freuen wir uns auf Ihre Bewerbung!<br/><br/><br/><br/>Wir leben Vielfalt und Chancengleichheit und freuen uns deshalb natürlich über Bewerbungen von Menschen mit Behinderung.<br/>Alle personenbezogenen Formulierungen in dieser Stellenanzeige sind geschlechtsneutral zu betrachten.<br/>",
        "url": "https://vivento.hr4you.org/generator.php?id=16617&lang=de&utm_source=monster",
        "datePosted": "2020-07-17T08:51:15.937783900Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "VIS GmbH"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "VIS GmbH",
          "value": "49919"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "addressLocality": "Hannover",
              "addressRegion": "Niedersachsen",
              "postalCode": "30171",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "52.366",
              "longitude": "9.755"
            }
          }
        ],
        "occupationalCategory": "5301045001001",
        "title": "Kraftfahrer (m/w/d) mit technischer Affinität gesucht!"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://vivento.hr4you.org/generator.php?id=16617&lang=de&utm_source=monster&sid=1455"
      },
      "enrichments": {
        "ats": {
          "atsName": "HR4You",
          "atsId": "ATS/315",
          "source": "1455",
          "isSourceTagged": true,
          "isDefaultSourceTagged": false
        },
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "5301045001001",
            "alias": "Heavy and Tractor-Trailer Truck Drivers",
            "usen": "Heavy and Tractor-Trailer Truck Drivers"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.5",
                "longitude": "10.5"
              }
            },
            "locationId": "2921044",
            "countryCode": "DE"
          }
        ],
        "normalizedTitles": [
          {
            "title": "Berufskraftfahrer"
          }
        ],
        "normalizedSalary": {
          "currencyCode": {
            "name": "UNKNOWN",
            "id": 927
          },
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2921044",
            "url": "https://www.jobs.com/de-de/jobs/kraftfahrer-%28m%2fw%2fd%29-mit-technischer-affinit%c3%a4t-gesucht%21--e2bafa24-f255-4458-af0a-c9817ba4a02f"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-07-17T00:00:00",
      "dateRecency": "Today"
    },
    {
      "schemaVersion": "2.0.10",
      "jobId": "beea7c34-4082-479b-8545-50d8924078f3",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "Fahrer sind Einzelkämpfer? Nicht bei uns! Du hast ein Team, das Dich unterstützt und Kunden, bei denen man gerne ausliefert. Das klingt zu schön, um wahr zu sein?Bei unserem Partnerunternehmen ANSINN in Nordkirchen gibt es das!Dort suchen wir Dich als <b>Deine Chance</b><p/><p/><p/><ul><li>Du hast geregelte, wiederkehrende Touren und nette Kunden, die sich auf Dich freuen</li><li>Du hast einen sicheren Arbeitsplatz mit Zukunft</li><li>Die Übernahme nach etwa 6 Monaten wird Dir in Aussicht gestellt</li><li>In dem traditionsreichen und zugleich fortschrittlichen Familienunternehmen wird Zusammenhalt und Teamgedanke gelebt</li></ul><b>Deine tägliche Tour</b><ul><li>Deine Route startet montags bis freitags um 7 Uhr</li><li>Du belädst gemeinsam mit Deinen Kollegen den LKW mit Getränkekisten</li><li>Du führst Dein Fahrzeug (7,5-12,5t) nach wiederkehrenden Touren</li><li>Du lieferst die Getränke an Unternehmen und Tankstellen </li><li>Du wartest und pflegst Dein Fahrzeug</li></ul><b>Dein Rüstzeug</b><ul><li>Du hast geregelte, wiederkehrende Touren und nette Kunden, die sich auf Dich freuen</li><li>Du hast einen sicheren Arbeitsplatz mit Zukunft</li><li>Die Übernahme nach etwa 6 Monaten wird Dir in Aussicht gestellt</li><li>In dem traditionsreichen und zugleich fortschrittlichen Familienunternehmen wird Zusammenhalt und Teamgedanke gelebt</li></ul><b>Das darfst Du von uns erwarten</b>Einen sicheren Arbeitsplatz mit Perspektive in einem netten und kompetenten Team sowie:<ul><li>Tariflöhne (BAP/ DGB) auf hohem Niveau</li><li>Individuelle Beratung und Betreuung durch unser Team vor Ort </li><li>Jährliche Sonderzahlungen wie Urlaubs- und Weihnachtsgeld</li></ul><p><b>Wir machen Dir das Bewerben einfach!</b>Schicke uns die Nachricht „Fahrer ANSINN“ über WhatsApp: +49 173 9612922 (einfach auf die Nummer klicken, dann öffnet sich WhatsApp). <br/>Oder ruf uns an: +49 2306 91060-15.<br/>Wir freuen uns darauf, Dich kennenzulernen!</p>",
        "url": "https://amg.hr4you.org/generator.php?id=3961585&lang=de&utm_source=monster",
        "datePosted": "2020-07-16T08:33:30.979475300Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "AMG RECRUITING GmbH"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "AMG RECRUITING GmbH",
          "value": "613"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "addressLocality": "Nordkirchen",
              "addressRegion": "Nordrhein-Westfalen",
              "postalCode": "59394",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "51.728",
              "longitude": "7.549"
            }
          }
        ],
        "occupationalCategory": "5301048001001",
        "title": "Fahrer (m/w/d) - Getränkeauslieferung"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://amg.hr4you.org/generator.php?id=3961585&lang=de&utm_source=monster"
      },
      "enrichments": {
        "ats": {
          "atsName": "HR4You",
          "atsId": "ATS/315",
          "isSourceTagged": false,
          "isDefaultSourceTagged": false
        },
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "5301048001001",
            "alias": "Motor Vehicle Operators, All Other",
            "usen": "Motor Vehicle Operators, All Other"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressLocality": "Nordkirchen",
                "addressRegion": "07",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.73827",
                "longitude": "7.52197"
              }
            },
            "locationId": "2861923",
            "countryCode": "DE"
          }
        ],
        "normalizedTitles": [
          {
            "title": "Fahrer"
          }
        ],
        "normalizedSalary": {
          "currencyCode": {
            "name": "UNKNOWN",
            "id": 927
          },
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2861923",
            "url": "https://www.jobs.com/de-de/jobs/%3c%2fbr%3e%3cb%3efahrer-%28m%2fw%2fd%29---getr%c3%a4nkeauslieferung%3c%2fb%3e-nordkirchen-07--beea7c34-4082-479b-8545-50d8924078f3"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-07-16T00:00:00",
      "dateRecency": "1 day ago"
    },
    {
      "schemaVersion": "2.0.10",
      "jobId": "79099fe4-1094-4e04-bb4f-89380bc443bb",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "mitarbeiter operative transportlogistik (m/w/d) \n \n für die transmed transport gmbh suchen wir ab sofort am standort hannover einen mitarbeiter operative transportlogistik (m/w/d).\n \n your tasks\n \n verstärkung des teams bei allen anfallenden, operativen aufgaben im tagesgeschäft\n einhaltung und durchführung geforderter maßnahmen zur sicherstellung des qualitätsmanagementsystems (pflege von qm-aufzeichnungen, kontrolle von qm-verfahrensanweisungen, einhaltung gdp-relevanter maßnahmen wie überprüfung der fahrzeugtemperaturen)\n prüfung der übernahme von transportgut aus dem pharma- und drittgeschäft und disposition des guts sowie identifikation des transportgutes und sicherstellung über die rückverfolgbarkeit\n steuerung und dokumentation vorhandener ressourcen (kleidung der fahrer, ausweiskontrolle, fahrerschulungen) sowie kontrolle und bearbeitung der nacht- und tagtourendaten \n verteilung und überwachung der eingehenden rückläufer sowie reklamationsbearbeitung\n \n your profile\n \n erfolgreich abgeschlossene kaufmännische ausbildung mit einschlägiger berufserfahrung in der transportlogistik\n sicherer umgang mit microsoft office sowie ausgezeichnete deutschkenntnisse in wort und schrift sowie idealerweise englischkenntnisse\n gute ortskenntnisse innerhalb der region\n kundenorientierte, strukturierte und engagierte arbeitsweise sowie die bereitschaft zu flexiblen arbeitszeiten\n hohes engagement und entsprechende belastbarkeit sowie teamfähigkeit und kommunikationsfähigkeit\n \n bitte bewerben sie sich online mit angabe ihrer gehaltsvorstellung sowie ihres frühestmöglichen eintrittstermins. ihre ansprechpartnerin ist frau natalie lösch. wir freuen uns auf ihre bewerbung.\n \n share with:\n \n apply \n \n phoenix group\n \n contact\n phoenix pharmahandel gmbh & co kg\n pfingstweidstraße 10-12\n d-68199 mannheim\n \n for visitors",
        "url": "https://jobs.phoenixgroup.eu/en/p/hp-germany/jobs/31530/mitarbeiter-operative-transportlogistik-mwd",
        "datePosted": "2020-07-08T06:53:10.381517800Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "PHOENIX Pharmahandel GmbH & Co KG"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "PHOENIX Pharmahandel GmbH & Co KG",
          "value": "314066321"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "streetAddress": "",
              "addressLocality": "Hannover",
              "addressRegion": "Niedersachsen",
              "postalCode": "30001",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "52.38",
              "longitude": "9.762"
            }
          }
        ],
        "occupationalCategory": "4300739001001",
        "title": "Mitarbeiter operative Transportlogistik (m/w/d)"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://jobs.phoenixgroup.eu/en/p/hp-germany/jobs/31530/mitarbeiter-operative-transportlogistik-mwd"
      },
      "enrichments": {
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "4300739001001",
            "alias": "Shipping, Receiving, and Traffic Clerks",
            "usen": "Shipping, Receiving, and Traffic Clerks"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.5",
                "longitude": "10.5"
              }
            },
            "locationId": "2921044",
            "countryCode": "DE"
          }
        ],
        "companyKb": {
          "normalizedCompanyName": "PHOENIX Pharmahandel Aktiengesellschaft & Co KG",
          "code": "",
          "normalizedCompanyGuid": "ut32caxz35dy5nbkbjfnlqj2jf"
        },
        "normalizedTitles": [
          {
            "title": "Transportarbeiter"
          }
        ],
        "normalizedSalary": {
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2921044",
            "url": "https://www.jobs.com/de-de/jobs/mitarbeiter-operative-transportlogistik-%28m%2fw%2fd%29--79099fe4-1094-4e04-bb4f-89380bc443bb"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-07-08T00:00:00",
      "dateRecency": "9 days ago"
    },
    {
      "schemaVersion": "2.0.10",
      "jobId": "0e56b7a7-f5b0-48fe-b7d9-3301c57e348f",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "freie stellen: rettungsdienst\n \n 19.06.2020\n \n springe: fahrer im blutkonserveneildienst (m/w/d)\n \n zum nächstmöglichen zeitpunkt suchen wir für unseren drk-standort in springe mitarbeiter und mitarbeiterinnen im bereich des blutkonserveneildienstes.\n \n eine der hauptaufgaben der drk-hilfsdienste in der region hannover ggmbh ist der transport von blutkonserven. regelmäßig werden verschiedene kliniken und arztpraxen im gesamten bundesgebiet mit blutkonserven von uns versorgt. hierfür verwenden wir 6 einsatzfahrzeuge, die alle mit zertifizierten kühlboxen sowie temperaturüberwachung- und dokumentation ausgestattet sind.\n \n zum nächst möglichen zeitpunkt suchen wir für unseren drk-standort in springe mitarbeiter und mitarbeiterinnen im bereich des blutkonserveneildienstes.\n \n ihr profil\n \n soziale, kommunikative kompetenz \n teamfähigkeit, zuverlässigkeit und engagement \n edv basiskenntnisse \n fahrerlaubnis klasse b \n fahrpraxis \n weitere anforderungen nach regionalen vorgaben \n identifikation mit den grundsätzen des roten kreuzes \n \n wir bieten\n \n eine leistungsgerechte vergütung \n mitarbeit in einem engagierten kollegialen team \n eine strukturierte einarbeitung und eine atmosphäre der wertschätzung \n ein vielseitiges aufgabengebiet \n einen verantwortungsvollen krisensicheren arbeitsplatz \n moderne, hochwertig ausgestattete fahrzeuge \n zusammenarbeit mit verschiedenen, interdisziplinären akteuren \n \n interessiert?\n dann bewerben sie sich bitte ausschließlich elektronisch über unser online-bewerbungsformular.\n \n weitere informationen erhalten sie auf unserer internetpräsenz www.drk-hannover.de \n \n interessiert?\n \n kontakt\n \n drk-hilfsdienste in der region hannover ggmbh - blutkonserveneildienst\n \n ute aden\n eldagsener str. 15\n 31832 springe",
        "url": "https://www.drk-jobboerse.de/jobs/rettungsdienst?tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Baction%5D=show&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bcontroller%5D=Job&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bjob%5D=3086&cHash=063b8d8796232543147eb401a68fb5d4",
        "datePosted": "2020-07-13T06:47:27.925240200Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "DRK-Pflegestützpunkt Eldagsen"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "DRK-Pflegestützpunkt Eldagsen",
          "value": "314666416"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "streetAddress": "",
              "addressLocality": "Laatzen",
              "addressRegion": "Niedersachsen",
              "postalCode": "30856",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "52.293",
              "longitude": "9.829"
            }
          }
        ],
        "occupationalCategory": "5301048001001",
        "title": "Springe: Fahrer im Blutkonserveneildienst (m/w/d)"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://www.drk-jobboerse.de/jobs/rettungsdienst?tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Baction%5D=show&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bcontroller%5D=Job&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bjob%5D=3086&cHash=063b8d8796232543147eb401a68fb5d4"
      },
      "enrichments": {
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "5301048001001",
            "alias": "Motor Vehicle Operators, All Other",
            "usen": "Motor Vehicle Operators, All Other"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.5",
                "longitude": "10.5"
              }
            },
            "locationId": "2921044",
            "countryCode": "DE"
          }
        ],
        "normalizedTitles": [
          {
            "title": "Fahrer"
          }
        ],
        "normalizedSalary": {
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2921044",
            "url": "https://www.jobs.com/de-de/jobs/springe%3a-fahrer-im-blutkonserveneildienst-%28m%2fw%2fd%29--0e56b7a7-f5b0-48fe-b7d9-3301c57e348f"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-07-13T00:00:00",
      "dateRecency": "4 days ago"
    },
    {
      "schemaVersion": "2.0.10",
      "jobId": "de80a9a5-7b63-4b1e-b4cf-ded8955f4e4d",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "<p/><h1>Einleitung</h1><p>Wir sind ein Baustoffhandel mit über 550 Mitarbeitern und insgesamt 13 Filialen in Niedersachsen, Nordrhein-Westfalen und Brandenburg. Für unseren Standort in <strong>Hannover / Garbsen </strong>suchen wir zum nächstmöglichen Zeitpunkt einen <strong>LKW Fahrer (m/w/d).</strong></p><p><br/></p><p><br/></p><p/><p/><h1>Profil</h1><ul><li>Führerschein Klasse BCE</li><li>Erfahrung im Umgang mit einem LKW-Ladekran</li><li>Wünschenswert: Baustoffkenntnisse und Gabelstaplerschein</li></ul><p/><p/><h1>Aufgaben</h1><ul><li>Befördern von Gütern im Nahverkehr</li><li>Abholungen und Auslieferungen</li><li>Korrektes und sicheres Be- und Entladen</li><li>Sichern der Ladung</li></ul><p/><p/><h1>Vorteile</h1><ul><li>Unbefristeten Anstellungsvertrag (Vollzeit)</li><li>Sicheren Arbeitsplatz in einem familiengeführten Unternehmen</li><li>Selbständiges, eigenverantwortliches Arbeiten</li><li>Interessantes und vielseitiges Aufgabengebiet</li><li>Leistungsgerechte Vergütung</li><li>Zusätzliche soziale Leistungen</li></ul><p/>",
        "url": "https://leymann-baustoffe.onapply.de/bewerbung/23919.html?source=monsterFeed",
        "datePosted": "2020-06-30T07:53:16.724461800Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "Albert Leymann GmbH & Co.KG"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "Albert Leymann GmbH & Co.KG",
          "value": "23919"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "addressLocality": "Garbsen",
              "addressRegion": "Niedersachsen",
              "postalCode": "",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "52.418",
              "longitude": "9.599"
            }
          }
        ],
        "occupationalCategory": "5301045001001",
        "title": "Garbsen Lkw Fahrer m/w/d"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://leymann-baustoffe.onapply.de/bewerbung/23919.html?source=monsterFeed"
      },
      "enrichments": {
        "ats": {
          "atsName": "OnApply",
          "atsId": "ATS/486",
          "atsJobId": "23919.html",
          "isSourceTagged": false,
          "isDefaultSourceTagged": false
        },
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "5301045001001",
            "alias": "Heavy and Tractor-Trailer Truck Drivers",
            "usen": "Heavy and Tractor-Trailer Truck Drivers"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.5",
                "longitude": "10.5"
              }
            },
            "locationId": "2921044",
            "countryCode": "DE"
          }
        ],
        "normalizedTitles": [
          {
            "title": "Berufskraftfahrer"
          }
        ],
        "normalizedSalary": {
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2921044",
            "url": "https://www.jobs.com/de-de/jobs/garbsen-lkw-fahrer-m%2fw%2fd--de80a9a5-7b63-4b1e-b4cf-ded8955f4e4d"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-06-30T00:00:00",
      "dateRecency": "17 days ago"
    },
    {
      "schemaVersion": "2.0.10",
      "jobId": "8dc6f7ed-f315-4e5a-b248-6bce58557985",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "freie stellen: alle jobangebote\n \n 19.06.2020\n \n springe: fahrer im blutkonserveneildienst (m/w/d)\n \n zum nächst möglichen zeitpunkt suchen wir für unseren drk-standort in springe mitarbeiter und mitarbeiterinnen im bereich des blutkonserveneildienstes.\n \n eine der hauptaufgaben der drk-hilfsdienste in der region hannover ggmbh ist der transport von blutkonserven. regelmäßig werden verschiedene kliniken und arztpraxen im gesamten bundesgebiet mit blutkonserven von uns versorgt. hierfür verwenden wir 6 einsatzfahrzeuge, die alle mit zertifizierten kühlboxen sowie temperaturüberwachung- und dokumentation ausgestattet sind.\n \n zum nächst möglichen zeitpunkt suchen wir für unseren drk-standort in springe mitarbeiter und mitarbeiterinnen im bereich des blutkonserveneildienstes.\n \n ihr profil\n \n soziale, kommunikative kompetenz \n teamfähigkeit, zuverlässigkeit und engagement \n edv basiskenntnisse \n fahrerlaubnis klasse b \n fahrpraxis \n weitere anforderungen nach regionalen vorgaben \n identifikation mit den grundsätzen des roten kreuzes \n \n wir bieten\n \n eine leistungsgerechte vergütung \n mitarbeit in einem engagierten kollegialen team \n eine strukturierte einarbeitung und eine atmosphäre der wertschätzung \n ein vielseitiges aufgabengebiet \n einen verantwortungsvollen krisensicheren arbeitsplatz \n moderne, hochwertig ausgestattete fahrzeuge \n zusammenarbeit mit verschiedenen, interdisziplinären akteuren \n \n interessiert?\n dann bewerben sie sich bitte ausschließlich elektronisch über unser online-bewerbungsformular.\n \n weitere informationen erhalten sie auf unserer internetpräsenz\n www.drk-hannover.de \n \n interessiert?\n \n kontakt\n \n drk-hilfsdienste in der region hannover ggmbh - blutkonserveneildienst\n \n ute aden\n eldagsener str. 15\n 31832 springe",
        "url": "https://www.drk-jobboerse.de/jobs/rettungsdienst?tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Baction%5D=show&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bcontroller%5D=Job&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bjob%5D=3086&cHash=063b8d8796232543147eb401a68fb5d4",
        "datePosted": "2020-06-20T06:46:53.688824Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "DRK-Pflegestützpunkt Eldagsen"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "DRK-Pflegestützpunkt Eldagsen",
          "value": "312041745"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "streetAddress": "Lange Str. 80",
              "addressLocality": "Springe",
              "addressRegion": "Niedersachsen",
              "postalCode": "31832",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "52.207",
              "longitude": "9.613"
            }
          }
        ],
        "occupationalCategory": "5301048001001",
        "title": "Springe: Fahrer im Blutkonserveneildienst (m/w/d)"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://www.drk-jobboerse.de/jobs/rettungsdienst?tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Baction%5D=show&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bcontroller%5D=Job&tx_dtidrkregionhjobs_dtidrkregionhjobslist%5Bjob%5D=3086&cHash=063b8d8796232543147eb401a68fb5d4"
      },
      "enrichments": {
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "5301048001001",
            "alias": "Motor Vehicle Operators, All Other",
            "usen": "Motor Vehicle Operators, All Other"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.5",
                "longitude": "10.5"
              }
            },
            "locationId": "2921044",
            "countryCode": "DE"
          }
        ],
        "normalizedTitles": [
          {
            "title": "Fahrer"
          }
        ],
        "normalizedSalary": {
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2921044",
            "url": "https://www.jobs.com/de-de/jobs/springe%3a-fahrer-im-blutkonserveneildienst-%28m%2fw%2fd%29--8dc6f7ed-f315-4e5a-b248-6bce58557985"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-06-20T00:00:00",
      "dateRecency": "27 days ago"
    },
    {
      "schemaVersion": "2.0.10",
      "jobId": "61740dc9-952e-486b-956f-10891332de2c",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "fahrer (w,m,d) gesucht (standort hannover anderten)\n \n 29. juni 202029. juni 2020 \n \n für unseren standort in hannover anderten suchen wir ab sofort in festanstellung einen\n \n auslieferungsfahrer/in (w,m,d) mit klasse ce oder c1.\n \n ihr aufgabengebiet:\n \n sie sind für die ordnungsgemäße verladung der ware verantwortlich.\n sie beliefern mit unseren kühl-fahrzeugen unsere kunden und holen waren bei unseren lieferanten ab.\n sie sind für die pflege und sauberkeit des lkw verantwortlich.\n kunden gegenüber haben sie ein freundliches und zuverlässiges auftreten.\n \n qualifikationen:\n \n sie verfügen über einen führerschein klasse ce oder c1.\n sie sprechen gut deutsch.\n verantwortungsbewusstsein, zuverlässigkeit und flexibilität gehören zu ihren stärken.\n sie sind gerne alleine unterwegs und sind auch nachts einsatzfähig.\n \n es erwartet sie eine herausfordernde und abwechslungsreiche tätigkeit.\n \n interessiert? wir freuen uns darauf, sie kennenzulernen!\n \n nutzen sie gern unsere onlinebewerbung .",
        "url": "https://harderreform.de/fahrer-wmd-gesucht-standort-hannover-anderten/",
        "datePosted": "2020-06-30T06:54:40.146237400Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "Harder Reform Vertriebs GmbH"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "Harder Reform Vertriebs GmbH",
          "value": "313097367"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "streetAddress": "",
              "addressLocality": "Hannover",
              "addressRegion": "Niedersachsen",
              "postalCode": "30559",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "52.36",
              "longitude": "9.833"
            }
          }
        ],
        "occupationalCategory": "5301044001001",
        "title": "Auslieferungsfahrer/in (w,m,d) mit Klasse CE oder C1 M/W/D"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://harderreform.de/fahrer-wmd-gesucht-standort-hannover-anderten/"
      },
      "enrichments": {
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "5301044001001",
            "alias": "Driver/Sales Workers",
            "usen": "Driver/Sales Workers"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.5",
                "longitude": "10.5"
              }
            },
            "locationId": "2921044",
            "countryCode": "DE"
          }
        ],
        "normalizedTitles": [
          {
            "title": "Auslieferungsfahrer"
          }
        ],
        "normalizedSalary": {
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2921044",
            "url": "https://www.jobs.com/de-de/jobs/auslieferungsfahrer%2fin-%28w%2cm%2cd%29-mit-klasse-ce-oder-c1--61740dc9-952e-486b-956f-10891332de2c"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-06-30T00:00:00",
      "dateRecency": "17 days ago"
    },
    {
      "schemaVersion": "2.0.10",
      "jobId": "405bb8a7-9f23-4c81-a0d8-1052c3a43122",
      "status": "ACTIVE",
      "jobPosting": {
        "@context": "http://schema.org",
        "@type": "JobPosting",
        "description": "Du bist auf der Suche nach einem Arbeitsplatz an dem Dein Wohlbefinden im Fokus steht? Eine Vier-Tage-Woche im Projektbereich, Zusammenhalt und eine kollegiale Atmosphäre sind Dir wichtig? Wir suchen Dich zum nächstmöglichen Zeitpunkt zur Festanstellung bei unserem Partnerunternehmen H&S als <b>Darauf kannst Du Dich bei H&S freuen</b><ul><li>Vier-Tage-Woche im Projektbereich (Montag bis Donnerstag)</li><li>Überstunden werden bezahlt oder können abgefeiert werden (mit Zeitkonto, Du entscheidest selbst)</li><li>Ein angenehmes Betriebsklima und starker kollegialer Zusammenhalt durch gemeinsame Geselligkeitsrunden (Abendessen, Grillfeste, Ausflüge mit Übernachtung)</li><li>Stetige Weiterentwicklung der Mitarbeiter durch externe Schulungsmaßnahmen und die Möglichkeit sich auf einen bestimmten Bereich zu spezialisieren</li><li>Es wird ein Fahrzeug zur Verfügung gestellt sowie hochwertige Arbeitskleidung von Engelbert Strauss</li><li>Ein inhabergeführtes, familienfreundliches und wachsendes Unternehmen</li></ul><strong>Verschaff Dir einen Einblick in die Arbeitswelt von H&S:</strong><br/>Unsere Recruiterin Julia hat die Kollegen Daniel und Timo der Firma H&S Heizungs-, Sanitär- und Kaminofentechnik GmbH aus Werl <a href=\"https://youtu.be/jOo3omdRbJ0\" rel=\"nofollow\">einen Tag lang begleitet.</a><br/><b>Dein zukünftiger Aufgabenbereich</b><ul><li>Du installierst technische Anlagen und nimmst sie in Betrieb</li><li>Darüber hinaus verantwortest Du die Beratung und Einweisung von Kunden</li><li>Zu Deinen Zuständigkeiten gehören der Einbau und Anschluss von Sanitäranlagen, Heizkörpern, Klimaanlagen etc.</li></ul><b>Wir suchen Dich mit dem folgenden Hintergrund</b><ul><li>Vier-Tage-Woche im Projektbereich (Montag bis Donnerstag)</li><li>Überstunden werden bezahlt oder können abgefeiert werden (mit Zeitkonto, Du entscheidest selbst)</li><li>Ein angenehmes Betriebsklima und starker kollegialer Zusammenhalt durch gemeinsame Geselligkeitsrunden (Abendessen, Grillfeste, Ausflüge mit Übernachtung)</li><li>Stetige Weiterentwicklung der Mitarbeiter durch externe Schulungsmaßnahmen und die Möglichkeit sich auf einen bestimmten Bereich zu spezialisieren</li><li>Es wird ein Fahrzeug zur Verfügung gestellt sowie hochwertige Arbeitskleidung von Engelbert Strauss</li><li>Ein inhabergeführtes, familienfreundliches und wachsendes Unternehmen</li></ul><strong>Verschaff Dir einen Einblick in die Arbeitswelt von H&S:</strong><br/>Unsere Recruiterin Julia hat die Kollegen Daniel und Timo der Firma H&S Heizungs-, Sanitär- und Kaminofentechnik GmbH aus Werl <a href=\"https://youtu.be/jOo3omdRbJ0\" rel=\"nofollow\">einen Tag lang begleitet.</a><br/><b>Unser Angebot an Dich</b><ul><li>Einfache Kommunikationswege und eine schnelle Rückmeldung</li><li>Klare Prozesse</li><li>Optimale Betreuung über den gesamten Wechsel-/Einstiegsprozess</li></ul><p><a href=\"https://work-live.de/jobwechsel/personalvermittlung?utm_source=hr4you&utm_medium=button&utm_campaign=Stellenanzeige\" rel=\"nofollow\">Alles über Direktvermittlung</a></p><b>Wir machen Dir das Bewerben einfach!</b>Schicke uns die Nachricht „H&S SHK“ über WhatsApp: <strong><a href=\"https://api.whatsapp.com/send?phone=491739612909&text=HuS%20SHK\" rel=\"nofollow\">+491739612909</a></strong><b> </b>(einfach auf die Nummer klicken, dann öffnet sich WhatsApp). <br/>Oder ruf uns an: +49 2921 66059-62.<br/>Wir freuen uns darauf, Dich kennenzulernen!",
        "url": "https://amg.hr4you.org/generator.php?id=3961364&lang=de&utm_source=monster",
        "datePosted": "2020-07-16T08:33:31.859598100Z",
        "hiringOrganization": {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "AMG RECRUITING GmbH"
        },
        "identifier": {
          "@context": "http://schema.org",
          "@type": "PropertyValue",
          "name": "AMG RECRUITING GmbH",
          "value": "658"
        },
        "jobLocation": [
          {
            "@context": "http://schema.org",
            "@type": "Place",
            "address": {
              "@context": "http://schema.org",
              "@type": "PostalAddress",
              "addressLocality": "Werl",
              "addressRegion": "Nordrhein-Westfalen",
              "postalCode": "59457",
              "addressCountry": "DE"
            },
            "geo": {
              "@context": "http://schema.org",
              "@type": "GeoCoordinates",
              "latitude": "51.557",
              "longitude": "7.911"
            }
          }
        ],
        "occupationalCategory": "4900883001001",
        "title": "SHK Anlagenmechaniker (m/w/d) in Direktvermittlung"
      },
      "apply": {
        "applyType": "OFFSITE",
        "applyUrl": "https://amg.hr4you.org/generator.php?id=3961364&lang=de&utm_source=monster"
      },
      "enrichments": {
        "ats": {
          "atsName": "HR4You",
          "atsId": "ATS/315",
          "isSourceTagged": false,
          "isDefaultSourceTagged": false
        },
        "language": {
          "languageCode": "de"
        },
        "mescos": [
          {
            "id": "4900883001001",
            "alias": "Heating, Air Conditioning, and Refrigeration Mechanics and Installers",
            "usen": "Heating, Air Conditioning, and Refrigeration Mechanics and Installers"
          }
        ],
        "normalizedJobLocations": [
          {
            "postalAddress": {
              "@context": "http://schema.org",
              "@type": "Place",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressLocality": "Werl",
                "addressRegion": "07",
                "addressCountry": "DE"
              },
              "geo": {
                "@context": "http://schema.org",
                "@type": "GeoCoordinates",
                "latitude": "51.55493",
                "longitude": "7.91403"
              }
            },
            "locationId": "2810878",
            "countryCode": "DE"
          }
        ],
        "normalizedTitles": [
          {
            "title": "Anlagenmechaniker Sanitär- / Heizungs- / Klimatechnik (SHK)"
          }
        ],
        "normalizedSalary": {
          "currencyCode": {
            "name": "UNKNOWN",
            "id": 927
          },
          "salaryBaseType": {
            "name": "UNKNOWN",
            "id": 239
          }
        },
        "jobLocationType": {
          "name": "UNKNOWN",
          "id": 109
        },
        "employmentTypes": [
          {
            "name": "UNKNOWN",
            "id": 29
          }
        ],
        "status": {
          "name": "ACTIVE",
          "id": 52
        },
        "applyType": {
          "name": "OFFSITE",
          "id": 51
        },
        "ingestionMethod": {
          "name": "ADAPTED_NOW",
          "id": 704
        },
        "jobPositionLevel": {
          "name": "UNKNOWN",
          "id": 89
        },
        "localizedMonsterUrls": [
          {
            "locationId": "2810878",
            "url": "https://www.jobs.com/de-de/jobs/%3c%2fbr%3e%3cb%3eshk-anlagenmechaniker-%28m%2fw%2fd%29-in-direktvermittlung%3c%2fb%3e-werl-07--405bb8a7-9f23-4c81-a0d8-1052c3a43122"
          }
        ]
      },
      "now": {
        "jobAdPricingTypeId": 3
      },
      "formattedDate": "2020-07-16T00:00:00",
      "dateRecency": "1 day ago"
    }
  ],
  "jobRequest": {
    "offset": 0,
    "pageSize": 10,
    "jobQuery": {
      "query": "fahrer",
      "locations": [
        {
          "address": "bundesweit",
          "country": "de"
        }
      ],
      "disableSpellCheck": false
    },
    "debug": false
  },
  "histogramQueryResult": []
};
