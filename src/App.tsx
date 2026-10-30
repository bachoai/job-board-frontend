import { AuthProvider } from "./app/providers/AuthProvider";
import { AppRouter } from "./app/router/AppRouter";
import "./App.css";
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
