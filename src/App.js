import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { MsalProvider, MsalAuthenticationTemplate } from "@azure/msal-react";
import { PublicClientApplication, InteractionType } from "@azure/msal-browser";
import { msalConfig } from "./config/AuthConfig";
import { AuthProvider } from "./components/AuthProvider";
import { AppProvider } from "./contexts/AppContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

const msalInstance = new PublicClientApplication(msalConfig);

const AuthenticatedContent = () => (
  <AuthProvider>
    <AppProvider>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppProvider>
  </AuthProvider>
);

function App() {
  return (
    <Router>
      <MsalProvider instance={msalInstance}>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="*"
              element={
                <MsalAuthenticationTemplate
                  interactionType={InteractionType.Redirect}
                >
                  <AuthenticatedContent />
                </MsalAuthenticationTemplate>
              }
            />
          </Routes>
        </div>
      </MsalProvider>
    </Router>
  );
}

export default App;
