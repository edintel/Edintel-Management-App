import React, { useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Card from "./common/Card";
import Button from "./common/Button";

function Login() {
  const { instance, inProgress } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state?.from?.pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (inProgress !== InteractionStatus.None) {
      console.log("Authentication is already in progress");
      return;
    }

    try {
      await instance.loginRedirect({
        scopes: [
          "User.Read",
          "User.Read.All",
          "Sites.Read.All",
          "Sites.ReadWrite.All",
          "Files.ReadWrite.All",
        ],
        prompt: "select_account",
      });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center p-8">
          <img
            src="/LogoEdintel.png"
            alt="Edintel S.A. Logo"
            className="w-32 h-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-primary mb-2">Edintel S.A.</h1>
          <h2 className="text-xl text-gray-700 mb-8">Inicio de sesión</h2>
          
          <form onSubmit={handleLogin} className="w-full">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={inProgress !== InteractionStatus.None}
              startIcon={inProgress !== InteractionStatus.None ? 
                <Loader2 className="w-4 h-4 animate-spin" /> : 
                undefined
              }
            >
              {inProgress !== InteractionStatus.None
                ? "Iniciando sesión..."
                : "Iniciar sesión con Microsoft"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default Login;