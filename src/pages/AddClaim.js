import { useEffect, useRef, useState } from "react";
import { IdentityFactory as SDKIdentityFactory } from "poc-itheum-identity-sdk";
import { identityFactoryAddress } from "../constants";

export default function AddClaim() {
  let identity = useRef();

  const [claimAddedState, setClaimAddedState] = useState(false);
  const [claimDataState, setClaimDataState] = useState("");

  async function init() {
    const identityFactory = await SDKIdentityFactory.init(identityFactoryAddress);
    const identities = await identityFactory.getIdentities();

    if (identities.length === 0) {
      alert('No identity deployed');
      return;
    }

    identity.current = identities[0];
  }

  async function addClaim() {
    try {
      await identity.current.addClaim(JSON.parse(claimDataState));

      setClaimAddedState(true);
      setClaimDataState("");
    } catch (e) {
      alert(e.reason);
    }
  }

  function handleClaimDataInput(event) {
    setClaimDataState(event.target.value);
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <h1>AddClaim</h1>
      <div>
        <textarea cols="50" rows="10" value={claimDataState} onChange={handleClaimDataInput} />
      </div>
      <button onClick={addClaim}>Add Claim</button>
      <p>Claim {claimAddedState ? '': 'not'} added</p>
    </div>
  );
}