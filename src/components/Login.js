import React, { useState, useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useNavigate, useLocation } from "react-router-dom";

function Login() {
  const { instance, inProgress } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || "/", { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (inProgress !== InteractionStatus.None) {
      setError("Authentication is already in progress. Please wait...");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await instance.loginRedirect({
        scopes: [
          "User.Read",
          "User.Read.All",
          "Sites.Read.All",
          "Sites.ReadWrite.All",
          "Files.ReadWrite.All",
        ],
      });
    } catch (error) {
      console.error("Login failed", error);
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center w-[90%] max-w-md">
        <img
          src="/LogoEdintel.png"
          alt="Edintel S.A. Logo"
          className="w-32 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-primary mb-2">Edintel S.A.</h1>
        <h2 className="text-xl text-gray-700 mb-8">Inicio de sesión</h2>

        {error && (
          <div className="mb-4 p-3 bg-error/10 text-error rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <button
            type="submit"
            disabled={isLoading || inProgress !== InteractionStatus.None}
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión con Microsoft"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
