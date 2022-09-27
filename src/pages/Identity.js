import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { identityAbi, identityFactoryAbi, identityFactoryAddress } from "../constants";

export default function Identity() {
  let signer = useRef();
  let identity = useRef();

  const [identityOwnerState, setIdentityOwnerState] = useState([]);
  const [confirmationState, setConfirmationState] = useState([]);
  const [claimsState, setClaimsState] = useState([]);
  const [addingOwnerState, setAddingOwnerState] = useState("");
  const [removeOwnerProposalState, SetRemoveOwnerProposalState] = useState("");
  const [removingOwnerState, setRemovingOwnerState] = useState("");

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

    const owners = [await identity.current.owner()];

    const additionalOwnerAddedEvents = await identity.current.queryFilter('AdditionalOwnerAdded', 0);
    const additionalOwnerRemovedEvents = await identity.current.queryFilter('AdditionalOwnerRemoved', 0);

    owners.push(...additionalOwnerAddedEvents.map(ele => ele.args[1]));

    additionalOwnerRemovedEvents
      .map(ele => ele.args[1])
      .forEach(ele => {
        const index = owners.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) owners.splice(index, 1);
    });

    setIdentityOwnerState(owners);

    const confirmations = [];

    for (const owner of owners) {
      const count = await identity.current.removeAdditionalOwnerConfirmationCount(owner);
      confirmations.push(count);
    }

    setConfirmationState(confirmations);

    const claims = [];

    const claimAddedEvents = await identity.current.queryFilter('ClaimAdded', 0);
    const claimRemovedEvents = await identity.current.queryFilter('ClaimRemoved', 0);

    claims.push(...claimAddedEvents.map(ele => ele.args[0]));

    claimRemovedEvents
      .map(ele => ele.args[0])
      .forEach(ele => {
        const index = claims.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) claims.splice(index, 1);
      });

    setClaimsState(claims);
  }

  function handleAddingOwnerInput(event) {
    setAddingOwnerState(event.target.value);
  }

  function handleRemoveOwnerProposalInput(event) {
    SetRemoveOwnerProposalState(event.target.value);
  }

  function handleRemovingOwnerInput(event) {
    setRemovingOwnerState(event.target.value);
  }

  async function addOwner() {
    try {
      const addOwnerTx = await identity.current.connect(signer.current).addAdditionalOwner(addingOwnerState);

      await addOwnerTx.wait();

      window.location.reload();
    } catch (e) {
      alert(e.reason);
    }
  }

  async function proposeOwnerRemoval() {
    try {
      const proposeOwnerRemovalOwnerTx = await identity.current.connect(signer.current).proposeAdditionalOwnerRemoval(removeOwnerProposalState);

      await proposeOwnerRemovalOwnerTx.wait();

      window.location.reload();
    } catch (e) {
      alert(e.reason);
    }
  }

  async function removeOwner() {
    try {
      const removeOwnerTx = await identity.current.connect(signer.current).removeAdditionalOwner(removingOwnerState);

      await removeOwnerTx.wait();

      window.location.reload();
    } catch (e) {
      alert(e.reason);
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <h1>Identity</h1>
      <h3>Current Owners</h3>
      <ul>{identityOwnerState.map((ele, i) => <li key={i}>{ele} ({confirmationState[i]}x proposed for removal)</li>)}</ul>
      <h5>Add Owner</h5>
      <input size="50" value={addingOwnerState} onChange={handleAddingOwnerInput} />&nbsp;
      <button onClick={addOwner}>Add</button>
      <h5>Propose Owner Removal</h5>
      <input size="50" value={removeOwnerProposalState} onChange={handleRemoveOwnerProposalInput} />&nbsp;
      <button onClick={proposeOwnerRemoval}>Propose</button>
      <h5>Remove Owner</h5>
      <input size="50" value={removingOwnerState} onChange={handleRemovingOwnerInput} />&nbsp;
      <button onClick={removeOwner}>Remove</button>
      <h3>Claims</h3>
      <ul>{claimsState.map((ele, i) => <li key={i}>{ele}</li>)}</ul>
    </div>
  );
}