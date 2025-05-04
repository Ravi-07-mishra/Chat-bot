import React from "react";
import { Routes, Route } from "react-router-dom";
import LanguageSwitcher from "./components/LanguageSwicher";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notfound from "./pages/Notfound";
import Header from './components/Header';
import "./index.css";
import Chat from "./pages/Chat";

function App() {
  return (
    <>
      <LanguageSwitcher />
      <div style={{ border: "2px solid red", minHeight: "100vh" }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Notfound />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
