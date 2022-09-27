import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { identityAbi, identityFactoryAbi, identityFactoryAddress } from "../constants";

export default function AddClaim() {
  let signer = useRef();
  let identity = useRef();

  const [claimAddedState, setClaimAddedState] = useState(false);
  const [claimDataState, setClaimDataState] = useState("");

  async function init() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer.current = provider.getSigner();
    const walletAddress = await signer.current.getAddress();

    const identityFactory = new ethers.Contract(identityFactoryAddress, identityFactoryAbi, signer.current);

    const events = await identityFactory.queryFilter('IdentityDeployed', 0);
    const identityDeployedEvent = events.find(event => event.args[1] === walletAddress);
    const identityAddress = identityDeployedEvent ? identityDeployedEvent.args[0] : null;

    if (!identityAddress) {
      alert('No identity contract deployed');
      return;
    }

    identity.current = new ethers.Contract(identityAddress, identityAbi, signer.current);
  }

  async function addClaim() {
    try {
      const addClaimTx = await identity.current.connect(signer.current).addClaim(JSON.parse(claimDataState));

      await addClaimTx.wait();

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