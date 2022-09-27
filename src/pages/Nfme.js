import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { identityAbi, identityFactoryAbi, identityFactoryAddress, nfmeAbi, nfmeAddress } from "../constants";

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

    const identityBalance = await provider.getBalance(identityAddress);
    setIdentityBalanceState(identityBalance);

    const nfme = new ethers.Contract(nfmeAddress, nfmeAbi, signer.current);
    const alreadyMinted = (await nfme.connect(signer.current).balanceOf(identityAddress)) > 0;

    setAlreadyMintedState(alreadyMinted);

    identity.current = new ethers.Contract(identityAddress, identityAbi, signer.current);

    const { identifier } = await identity.current.connect(signer.current).claims("nfme_mint_allowed");
    const claimAvailable = identifier === "nfme_mint_allowed";

    setClaimAvailableState(claimAvailable);

    const claim = {
      identifier: "nfme_mint_allowed",
      from: "0xa838c28201aBb6613022eC02B97fcF6828B0862B",
      to: identityAddress,
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
        const mintFunctionSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("safeMint()")).substring(0, 10);
        const mintTx = await identity.current.connect(signer.current).execute(0, nfmeAddress, ethers.utils.parseEther("0.01"), mintFunctionSignatureHash, { gasLimit: 1_000_000 });

        await mintTx.wait();

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