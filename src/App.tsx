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
  Stats,
} from "./pages/Stats/Stats";


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
          <Stats />
        }
      />

      <Route
        path="/history"
        element={
          <Navigate
            to="/stats"
            replace
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