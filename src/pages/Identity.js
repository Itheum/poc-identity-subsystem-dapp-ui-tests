import { useEffect, useRef, useState } from "react";
import { IdentityFactory as SDKIdentityFactory } from "poc-itheum-identity-sdk";
import { identityFactoryAddress } from "../constants";

export default function Identity() {
  let identity = useRef();

  const [identityOwnerState, setIdentityOwnerState] = useState([]);
  const [claimsState, setClaimsState] = useState([]);

  async function init() {
    const identityFactory = await SDKIdentityFactory.init(identityFactoryAddress);
    const identities = await identityFactory.getIdentities();

    if (identities.length === 0) {
      alert('No identity deployed');
      return;
    }

    identity.current = identities[0];

    const owners = await identity.current.getOwner();

    setIdentityOwnerState(owners);

    const claims = await identity.current.getClaims();

    setClaimsState(claims);

    console.log(await identity.current.getClaimByIdentifier(claims[0]));
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <h1>Identity</h1>
      <h3>Current Owners</h3>
      <ul>{identityOwnerState.map((ele, i) => <li key={i}>{ele}</li>)}</ul>
      <h3>Claims</h3>
      <ul>{claimsState.map((ele, i) => <li key={i}>{ele}</li>)}</ul>
    </div>
  );
}