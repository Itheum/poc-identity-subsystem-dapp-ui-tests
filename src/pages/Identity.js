import { useEffect, useRef, useState } from "react";
import { IdentityFactory as SDKIdentityFactory } from "itheum-identity-sdk";
import { identityFactoryAddress } from "../constants";

export default function Identity() {
  let identity = useRef();

  const [identityOwnerState, setIdentityOwnerState] = useState([]);
  const [confirmationState, setConfirmationState] = useState([]);
  const [claimsState, setClaimsState] = useState([]);
  const [addingOwnerState, setAddingOwnerState] = useState("");
  const [removeOwnerProposalState, SetRemoveOwnerProposalState] = useState("");
  const [removingOwnerState, setRemovingOwnerState] = useState("");

  async function init() {
    const identityFactory = await SDKIdentityFactory.init(identityFactoryAddress);
    const identities = await identityFactory.getIdentities();

    if (identities.length === 0) {
      alert('No identity deployed');
      return;
    }

    identity.current = identities[0];

    const owners = await identity.current.getOwners();

    setIdentityOwnerState(owners);

    const confirmations = await identity.current.getOwnerRemovalConfirmations();

    setConfirmationState(confirmations);

    const claims = await identity.current.getClaims();

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
      await identity.current.addOwner(addingOwnerState);

      window.location.reload();
    } catch (e) {
      alert(e.reason);
    }
  }

  async function proposeOwnerRemoval() {
    try {
      await identity.current.proposeOwnerRemoval(removeOwnerProposalState);

      window.location.reload();
    } catch (e) {
      alert(e.reason);
    }
  }

  async function removeOwner() {
    try {
      await identity.current.removeOwner(removingOwnerState);

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