import { React } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./config/AuthConfig";
import { AuthProvider } from "./components/AuthProvider";
import InactivityHandler from "./components/InactivityHandler";
import AppRoutes from "./routes";

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().catch(() => {
    // Silent fail - no need for console.error
  });
});

function App() {
  return (
    <Router>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
        <InactivityHandler timeout={15 * 60 * 1000} />
          <AppRoutes />
        </AuthProvider>
      </MsalProvider>
    </Router>
  );
}

export default App;