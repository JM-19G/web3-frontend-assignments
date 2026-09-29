import { useState, useEffect, useCallback } from "react";
import { ethers, BrowserProvider, JsonRpcSigner } from "ethers";

const SUPPORTED_CHAINS: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  137: "Polygon",
};

export function useWalletConnection() {
  const [accountAddress, setAccountAddress] = useState("");
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isUnsupportedChain, setIsUnsupportedChain] = useState(false);

  useEffect(() => {
    const { ethereum } = window as any;

    const initializeEthereum = async () => {
      if (typeof window !== "undefined" && typeof ethereum !== "undefined") {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        setProvider(browserProvider);

        try {
          const accounts = await browserProvider.send('eth_requestAccounts', []);
          if (accounts.length > 0) {
            setAccountAddress(accounts[0]);
            setSigner(await browserProvider.getSigner());
          }

          const network = await browserProvider.getNetwork();
          const numericChainId = parseInt(network.chainId.toString());
          setChainId(numericChainId);
          setIsUnsupportedChain(!SUPPORTED_CHAINS[numericChainId]);

          ethereum.on("accountsChanged", handleAccountsChanged);
          ethereum.on("chainChanged", handleChainChanged);
          ethereum.on("disconnect", handleDisconnect);
        } catch (error) {
          console.error("Error initializing Ethereum:", error);
        }
      }
    };

    initializeEthereum();

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
      ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, []);

  const handleDisconnect = () => {
    disconnectWallet();
    console.log("Wallet disconnected");
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccountAddress(accounts[0]);
      setSigner(!provider ? null : await provider.getSigner());
      console.log("Account changed:", accounts[0]);
    }
  };

  const handleChainChanged = async (chainId: string) => {
    const { ethereum } = window as any;
    if (ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        setProvider(browserProvider);
      } catch (error) {
        console.error(error);
      }
    }
    const numericChainId = parseInt(chainId, 16);
    setChainId(numericChainId);
    setIsUnsupportedChain(!SUPPORTED_CHAINS[numericChainId]);
    console.log("Chain changed to:", numericChainId);
  };

  const connectWallet = useCallback(async () => {
    const { ethereum } = window as any;
    if (ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(ethereum);
        setProvider(browserProvider);

        const accounts = await browserProvider.send("eth_requestAccounts", []);
        const network = await browserProvider.getNetwork();
        const numericChainId = parseInt(network.chainId.toString());
        setAccountAddress(accounts[0]);
        setChainId(numericChainId);
        setIsUnsupportedChain(!SUPPORTED_CHAINS[numericChainId]);
        setSigner(await browserProvider.getSigner());
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccountAddress("");
    setSigner(null);
    setBalance(null);
    setChainId(null);
    setProvider(null);
    setIsUnsupportedChain(false);

    console.log(
      "Disconnected from wallet. Please manually disconnect from MetaMask if necessary."
    );
  }, []);

  const switchToSupportedChain = useCallback(async (targetChainId: number) => {
    const { ethereum } = window as any;
    if (!ethereum) return;
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }],
      });
    } catch (error) {
      console.error("Error switching chain:", error);
    }
  }, []);

  const getBalance = useCallback(
    async (address: string) => {
      if (provider && ethers.isAddress(address)) {
        setIsLoading(true);
        try {
          const balance = await provider.send('eth_getBalance', [address]);
          setBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance(null);
        }
        setIsLoading(false);
      } else {
        setBalance(null);
      }
    },
    [provider, accountAddress, chainId]
  );

  return {
    accountAddress,
    chainId,
    balance,
    isLoading,
    signer,
    isUnsupportedChain,
    supportedChains: SUPPORTED_CHAINS,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchToSupportedChain,
  };
}