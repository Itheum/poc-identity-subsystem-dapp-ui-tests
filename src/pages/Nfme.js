import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { IdentityFactory as SDKIdentityFactory } from "poc-itheum-identity-sdk";
import { identityFactoryAddress, nfmeAbi, nfmeAddress } from "../constants";

export default function Nfme() {
  let signer = useRef();
  let identity = useRef();

  const [alreadyMintedState, setAlreadyMintedState] = useState(false);
  const [claimAvailableState, setClaimAvailableState] = useState(false);
  const [identityBalanceState, setIdentityBalanceState] = useState(0);
  const [claimState, setClaimState] = useState("");

  async function init() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer.current = provider.getSigner();

    const identityFactory = await SDKIdentityFactory.init(identityFactoryAddress);
    const identities = await identityFactory.getIdentities();

    if (identities.length === 0) {
      alert('No identity deployed');
      return;
    }

    identity.current = identities[0];

    const identityBalance = await provider.getBalance(identity.current.address);

    setIdentityBalanceState(identityBalance);

    const nfme = new ethers.Contract(nfmeAddress, nfmeAbi, signer.current);
    const alreadyMinted = (await nfme.connect(signer.current).balanceOf(identity.current.address)) > 0;

    setAlreadyMintedState(alreadyMinted);

    const claims = await identity.current.getClaims();
    const claimAvailable = claims.includes("nfme_mint_allowed");

    setClaimAvailableState(claimAvailable);

    const claim = {
      identifier: "nfme_mint_allowed",
      from: "0xa838c28201aBb6613022eC02B97fcF6828B0862B",
      to: identity.current.address,
      data: ethers.utils.formatBytes32String(""),
      validFrom: 0,
      validTo: 0,
    }

    const claimString = JSON.stringify(claim);

    setClaimState(claimString);

    await navigator.clipboard.writeText(claimString);
  }

  async function mintNfme(){
    // if non-existent, create one, let it be signed and add it
    if (!alreadyMintedState && claimAvailableState && identityBalanceState >= 0.01) {
      try {
        await identity.current.execute("safeMint()", nfmeAddress, "0.01", 3_000_000);

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
      <h1>Nfme</h1>
      {alreadyMintedState ?
        <div>
          <p>Your already minted an NFMe 🤩</p>
        </div> :
        <div>
          {claimAvailableState ?
              <div>
                {identityBalanceState >= 0.01 ?
                  <div>
                    <p>Mint your NFMe now</p>
                    <button onClick={mintNfme}>Mint</button>
                    <p>Claim data copied to clipboard:</p>
                    <span>{claimState}</span>
                  </div> :
                  <div>
                    <p>Fund your identity contract with at least 0.01 ETH</p>
                    <p>It's address is: {identity.current.address}</p>
                  </div>
                }
              </div> :
              <div>
                <p>Get your claim first and add it to your identity</p>
                <p>Claim data copied to clipboard:</p>
                <p>{claimState}</p>
              </div>
          }
        </div>
      }
    </div>
  );
}