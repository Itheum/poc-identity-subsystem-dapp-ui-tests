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

    let events = await identityFactory.queryFilter('IdentityDeployed', 0);
    const identityDeployedEvents = events.filter(event => event.args[1] === walletAddress);
    let identityAddress = identityDeployedEvents.length > 0 ? identityDeployedEvents.map(event => event.args[0])[0] : null;

    if (!identityAddress) {
      events = await identityFactory.queryFilter('AdditionalOwnerAction', 0);

      const eventsForWalletAddress = events.filter(event => event.args[2] === walletAddress);
      const addingEvents = eventsForWalletAddress.filter(event => event.args[3] === "added");
      const removingEvents = eventsForWalletAddress.filter(event => event.args[3] === "removed");

      const identityAddresses = addingEvents.map(event => event.args[0]);

      removingEvents.map(event => event.args[0]).forEach(ele => {
        const index = identityAddresses.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) identityAddresses.splice(index, 1);
      });

      if (identityAddresses.length === 0) {
        alert('No identity contract deployed');
        return;
      }

      identityAddress = identityAddresses[0];
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