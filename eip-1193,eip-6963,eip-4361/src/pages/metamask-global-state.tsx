import { useWallet } from "../context";

const MetamaskGlobalState = () => {
  const {
    accountAddress,
    chainId,
    balance,
    isLoading,
    isUnsupportedChain,
    supportedChains,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchToSupportedChain,
  } = useWallet();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center">
      <h1 className="text-4xl font-bold">Metamask Global State</h1>

      {accountAddress ? (
        <div className="space-y-3">
          <p className="text-xl">
            Connected Account: <span className="font-mono">{accountAddress}</span>
          </p>
          <p className="text-lg">
            Chain ID: <span className="font-mono">{chainId}</span>
          </p>

          <div className="space-y-2">
            <p className="text-lg">
              Balance:{" "}
              <span className="font-mono">
                {isLoading ? "Loading..." : balance !== null ? `${balance} ETH` : "—"}
              </span>
            </p>
            <button
              onClick={() => getBalance(accountAddress)}
              disabled={isLoading}
              className="bg-indigo-500 py-2 px-5 rounded-md text-white font-bold disabled:opacity-50"
            >
              {isLoading ? "Refreshing..." : "Refresh Balance"}
            </button>
          </div>

          {isUnsupportedChain && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded space-y-2">
              <p>Unsupported chain detected. Please switch to a supported chain.</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {Object.entries(supportedChains).map(([id, name]) => (
                  <button
                    key={id}
                    onClick={() => switchToSupportedChain(Number(id))}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Switch to {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-100 rounded-md p-4 text-left max-w-sm mx-auto">
            <p className="font-bold mb-2">Supported Chains</p>
            <ul className="space-y-1">
              {Object.entries(supportedChains).map(([id, name]) => (
                <li key={id} className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-mono">
                    {Number(id) === chainId ? "✅ current" : id}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={disconnectWallet}
            className="bg-red-500 py-2 px-5 rounded-md text-white font-bold"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-green-500 py-2 px-5 rounded-md text-white font-bold"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default MetamaskGlobalState;