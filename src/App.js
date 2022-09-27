import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import IdentityFactory from "./pages/IdentityFactory";
import Nfme from "./pages/Nfme";
import Identity from "./pages/Identity";
import AddClaim from "./pages/AddClaim";
import SignClaim from "./pages/SignClaim";

function App() {
  return (
    <BrowserRouter>
      <a href={'/'}>Home</a>&nbsp;|&nbsp;
      <a href={'identity-factory'}>IdentityFactory</a>&nbsp;|&nbsp;
      <a href={'nfme'}>NFMe</a>&nbsp;|&nbsp;
      <a href={'add-claim'}>AddClaim</a>&nbsp;|&nbsp;
      <a href={'sign-claim'}>SignClaim</a>&nbsp;|&nbsp;
      <a href={'identity'}>Identity</a>
      <Routes>
        <Route index element={<Home />} />
        <Route path="identity-factory" element={<IdentityFactory />} />
        <Route path="nfme" element={<Nfme />} />
        <Route path="add-claim" element={<AddClaim />} />
        <Route path="sign-claim" element={<SignClaim />} />
        <Route path="identity" element={<Identity />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
