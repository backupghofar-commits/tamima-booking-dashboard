import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import AuthGate from "./components/auth/AuthGate";
import VerifyPage from "./components/verification/VerifyPage";
import { isVerifyPage } from "./utils/qrVerification";

// 🔓 PUBLIC ROUTE: /verify/* — bypass auth (untuk customer scan QR)
const isPublicVerifyRoute = isVerifyPage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isPublicVerifyRoute ? (
      // Public verify page — no auth needed
      <VerifyPage />
    ) : (
      // Protected app — require login
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    )}
  </StrictMode>
);
