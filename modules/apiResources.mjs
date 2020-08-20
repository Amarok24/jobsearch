

export const API = {
  US: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/en-us",
    code: "us"
  },
  CA: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/en-ca",
    code: "ca"
  },
  DE: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/de-de",
    code: "de"
  },
  AT: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/de-at",
    code: "at"
  },
  GB: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/en-gb",
    code: "gb"
  },
  FR: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/fr-fr",
    code: "fr"
  },
  ES: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/es-es",
    code: "es"
  },
  IT: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/it-it",
    code: "it"
  },
  CZ: {
    url: "https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/cs-cz",
    code: "cz"
  }
};


//const _API_URL = "https://job-openings.monster.com/v2/job/pure-json-view";
//const _API_URL = "https://stellenangebot.monster.de/v2/job/pure-json-view?jobid="; // GERMAN version




/*


POST
https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/de-de
country	"de"
https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/de-at
country	"at"
https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/cs-cz
country	"cz"
https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/en-gb
country	"gb"
https://services.monster.io/jobs-svx-service/v2/search-jobs/samsearch/fr-fr
country	"fr"

DATA WITH POST
{"jobQuery":{"locations":[{"address":"Berlin, Land Berlin","country":"de"}],"query":"fahrer"},"offset":0,"pageSize":10}

next query
offset:10

next query
offset:20

etc...

*/
