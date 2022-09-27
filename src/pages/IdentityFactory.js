import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { identityFactoryAbi, identityFactoryAddress } from "../constants";

export default function IdentityFactory() {
  let signer = useRef();
  let identityFactory = useRef();

  const [identityAddressesState, setIdentityAddressesState] = useState([]);

  async function init() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer.current = provider.getSigner();
    const walletAddress = await signer.current.getAddress();

    identityFactory.current = new ethers.Contract(identityFactoryAddress, identityFactoryAbi, signer.current);

    let events = await identityFactory.current.queryFilter('IdentityDeployed', 0);
    const identityDeployedEvents = events.filter(event => event.args[1] === walletAddress);
    let identityAddresses = identityDeployedEvents.length > 0 ? identityDeployedEvents.map(event => event.args[0]) : [];

    if (identityAddresses.length === 0) {
      events = await identityFactory.current.queryFilter('AdditionalOwnerAction', 0);

      const eventsForWalletAddress = events.filter(event => event.args[2] === walletAddress);
      const addingEvents = eventsForWalletAddress.filter(event => event.args[3] === "added");
      const removingEvents = eventsForWalletAddress.filter(event => event.args[3] === "removed");

      identityAddresses = addingEvents.map(event => event.args[0]);

      removingEvents.map(event => event.args[0]).forEach(ele => {
        const index = identityAddresses.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) identityAddresses.splice(index, 1);
      });
    }

    setIdentityAddressesState(identityAddresses);
  }

  async function deployIdentity() {
    if (identityAddressesState.length === 0) {
      try {
        const deployIdentityTx = await identityFactory.current.connect(signer.current).deployIdentity();

        await deployIdentityTx.wait();

        window.location.reload();
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