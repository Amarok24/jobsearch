interface JobServerList {
  // this type declaration is needed else we get error in index.ts accessing APILIST[...]
  [countryCode: string]: {
    url: string;
    code: string;
  };
};

const apiList: JobServerList = {
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

export default apiList;
