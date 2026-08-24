import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  Home,
} from "./pages/Home/Home";

import {
  Quiz,
} from "./pages/Quiz/Quiz";

import {
  Topics,
} from "./pages/Topics/Topics";

import {
  Mistakes,
} from "./pages/Mistakes/Mistakes";

import {
  PlaceholderPage,
} from "./pages/Placeholder/PlaceholderPage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home />
        }
      />

      <Route
        path="/quiz"
        element={
          <Quiz />
        }
      />

      <Route
        path="/topics"
        element={
          <Topics />
        }
      />

      <Route
        path="/mistakes"
        element={
          <Mistakes />
        }
      />

      <Route
        path="/stats"
        element={
          <PlaceholderPage
            title="Estadísticas"
            description="Aquí construiremos el análisis completo del rendimiento."
          />
        }
      />

      <Route
        path="/history"
        element={
          <PlaceholderPage
            title="Historial"
            description="Aquí aparecerán todas las sesiones realizadas en este dispositivo."
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;