export const msalConfig = {
  auth: {
    clientId: "3eee694a-fdde-46b8-8706-444424e7cc3f",
    authority:
      "https://login.microsoftonline.com/4b185944-f69f-4840-8c18-fa9cb2f4bde3",
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "User.Read.All",
    "Sites.Read.All",
    "Sites.ReadWrite.All",
    "Files.ReadWrite.All",
  ],
};