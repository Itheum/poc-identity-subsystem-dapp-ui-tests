import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

export default function SignClaim() {
  let signer = useRef();

  const [claimDataState, setClaimDataState] = useState("");
  const [claimSignatureState, setClaimSignatureState] = useState("");

  async function init() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer.current = provider.getSigner();
  }

  async function signClaim() {
    const claimData = JSON.parse(claimDataState);

    const claimDataHash = ethers.utils.solidityKeccak256(["string", "address", "address", "bytes", "uint64", "uint64"], [claimData.identifier, claimData.from, claimData.to, claimData.data, claimData.validFrom, claimData.validTo]);

    const signedClaimDataHash = await signer.current.signMessage(ethers.utils.arrayify(claimDataHash));

    const signedClaimString = JSON.stringify({
      ...claimData,
      signature: signedClaimDataHash,
    });

    setClaimSignatureState(signedClaimString);

    setTimeout(async () => await navigator.clipboard.writeText(signedClaimString), 500);
  }

  function handleClaimDataInput(event) {
    setClaimDataState(event.target.value);
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <h1>SignClaim</h1>
      <p>Address 0xa838c28201aBb6613022eC02B97fcF6828B0862B must sign the claim</p>
      <div>
        <textarea cols="50" rows="10" value={claimDataState} onChange={handleClaimDataInput} />
      </div>
      <button onClick={signClaim}>Sign Claim</button>
      {claimSignatureState ?
        <div>
          <p>Copied to clipboard:</p>
          <p>{claimSignatureState}</p>
        </div> :
        <div />
      }
    </div>
  );
}