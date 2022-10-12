import { useEffect, useRef, useState } from "react";
import { IdentityFactory as SDKIdentityFactory } from 'poc-itheum-identity-sdk';
import { identityFactoryAddress } from "../constants";

export default function IdentityFactory() {
  let identityFactory = useRef();

  const [identityAddressesState, setIdentityAddressesState] = useState([]);

  async function init() {
    identityFactory.current = await SDKIdentityFactory.init(identityFactoryAddress);
    // const identities = await identityFactory.current.getIdentities();
    const identities = await identityFactory.current.getIdentitiesByTheGraph();

    setIdentityAddressesState(identities.map(identity => identity.address));
  }

  async function deployIdentity() {
    if (identityAddressesState.length === 0) {
      try {
        await identityFactory.current.deployIdentity();

      } catch (e) {
        alert(e.reason);
      }
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <h1>IdentityFactory</h1>
      {identityAddressesState.length > 0 ?
        <div>
          <p>Yeah! 🥳 Your identity contract addresses are:</p>
          <ul>{identityAddressesState.map((ele, i) => <li key={i}>{ele}</li>)}</ul>
        </div> :
        <div>
          <p>You don't have an identity contract yet. 😢 Deploy it!</p>
          <button onClick={deployIdentity}>Deploy Identity</button>
        </div>
      }
    </div>
  );
}