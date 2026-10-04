import { FormEvent, useState } from "react";
import { useWallet } from "../context";
import { useCrowdfunding } from "../hooks/useCrowdfunding";

const Crowdfunding = () => {
  const { provider, accountAddress, chainId, connectWallet, switchToSupportedChain } =
    useWallet();

  const {
    isLoading,
    createCampaign,
    contribute,
    withdraw,
    cancelCampaign,
    refundMoney,
    approveMilestones,
    getCampaign,
    campaigns,
    isFetchingCampaigns,
    fetchAllCampaigns,
    myContribution,
    fetchMyContribution,
  } = useCrowdfunding(provider, accountAddress);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tokenAccepted, setTokenAccepted] = useState("");
  const [milestoneAmounts, setMilestoneAmounts] = useState("");
  const [milestoneStatuses, setMilestoneStatuses] = useState("");

  const [contributeCampaignId, setContributeCampaignId] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeToken, setContributeToken] = useState("");

  const [actionCampaignId, setActionCampaignId] = useState("");

  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [myContribCampaignId, setMyContribCampaignId] = useState("");
  const [isCheckingContribution, setIsCheckingContribution] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleCreateCampaign = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!target || !deadline || !tokenAccepted || !milestoneAmounts || !milestoneStatuses) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      const amounts = milestoneAmounts.split(",").map((a) => a.trim());
      const statuses = milestoneStatuses.split(",").map((s) => Number(s.trim()));

      if (amounts.length !== statuses.length) {
        setError("Milestone amounts and statuses must have the same count.");
        return;
      }

      await createCampaign(target, deadlineTimestamp, tokenAccepted, amounts, statuses);
      setSuccess("Campaign created successfully!");
      setTarget("");
      setDeadline("");
      setTokenAccepted("");
      setMilestoneAmounts("");
      setMilestoneStatuses("");
      await fetchAllCampaigns();
    } catch (err: any) {
      setError(err?.reason || err?.shortMessage || "Failed to create campaign.");
    }
  };

  const handleContribute = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!contributeCampaignId || !contributeAmount || !contributeToken) {
      setError("Please fill in all contribution fields.");
      return;
    }

    try {
      await contribute(Number(contributeCampaignId), contributeAmount, contributeToken);
      setSuccess("Contribution successful!");
      setContributeAmount("");
      await fetchAllCampaigns();
    } catch (err: any) {
      setError(err?.reason || err?.shortMessage || "Contribution failed.");
    }
  };

  const handleWithdraw = async () => {
    clearMessages();
    if (!actionCampaignId) {
      setError("Enter a campaign ID first.");
      return;
    }
    try {
      await withdraw(Number(actionCampaignId));
      setSuccess("Withdrawal successful!");
      await fetchAllCampaigns();
    } catch (err: any) {
      setError(err?.reason || err?.shortMessage || "Withdrawal failed.");
    }
  };

  const handleCancel = async () => {
    clearMessages();
    if (!actionCampaignId) {
      setError("Enter a campaign ID first.");
      return;
    }
    try {
      await cancelCampaign(Number(actionCampaignId));
      setSuccess("Campaign cancelled.");
      await fetchAllCampaigns();
    } catch (err: any) {
      setError(err?.reason || err?.shortMessage || "Cancel failed.");
    }
  };

  const handleRefund = async () => {
    clearMessages();
    if (!actionCampaignId) {
      setError("Enter a campaign ID first.");
      return;
    }
    try {
      await refundMoney(Number(actionCampaignId));
      setSuccess("Refund successful!");
      await fetchAllCampaigns();
    } catch (err: any) {
      setError(err?.reason || err?.shortMessage || "Refund failed.");
    }
  };

  const handleApproveMilestone = async () => {
    clearMessages();
    if (!actionCampaignId) {
      setError("Enter a campaign ID first.");
      return;
    }
    try {
      await approveMilestones(Number(actionCampaignId));
      setSuccess("Milestone approved.");
      await fetchAllCampaigns();
    } catch (err: any) {
      setError(err?.reason || err?.shortMessage || "Approval failed.");
    }
  };

  const handleLookup = async () => {
    clearMessages();
    if (!lookupId) {
      setError("Enter a campaign ID to look up.");
      return;
    }
    setIsLookingUp(true);
    const result = await getCampaign(Number(lookupId));
    setIsLookingUp(false);
    setLookupResult(result);
    if (!result) setError("Could not find that campaign.");
  };

  const handleFetchMyContribution = async () => {
    clearMessages();
    if (!myContribCampaignId) {
      setError("Enter a campaign ID first.");
      return;
    }
    setIsCheckingContribution(true);
    await fetchMyContribution(Number(myContribCampaignId));
    setIsCheckingContribution(false);
  };

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const inputClass =
    "w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60";

  const cardClass =
    "bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/20";

  const Spinner = () => (
    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white px-4 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300 bg-clip-text text-transparent">
            Crowdfunding Portal
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Create campaigns, contribute, manage milestones, and withdraw funds.
          </p>
        </div>

        {/* Wallet */}
        <div className={`${cardClass} mb-6`}>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Wallet</h2>
          {accountAddress ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full text-sm font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {shortenAddress(accountAddress)}
              </div>
              <div className="text-sm text-slate-300">
                Network:{" "}
                <span className={chainId === 11155111 ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                  {chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`}
                </span>
              </div>
              {chainId !== 11155111 && (
                <button
                  onClick={() => switchToSupportedChain(11155111)}
                  className="ml-auto bg-amber-500 hover:bg-amber-400 transition-colors text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg"
                >
                  Switch to Sepolia
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-emerald-500 hover:bg-emerald-400 transition-colors text-slate-900 font-semibold px-5 py-2.5 rounded-lg shadow shadow-emerald-900/40"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl mb-5 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Create Campaign */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold mb-4">Create Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <input
                type="text"
                placeholder="Target amount (e.g. 10)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={inputClass}
              />
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Accepted token address (0x...)"
                value={tokenAccepted}
                onChange={(e) => setTokenAccepted(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Milestone amounts (e.g. 3,3,4)"
                value={milestoneAmounts}
                onChange={(e) => setMilestoneAmounts(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Milestone statuses (e.g. 0,0,0)"
                value={milestoneStatuses}
                onChange={(e) => setMilestoneStatuses(e.target.value)}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={isLoading || !accountAddress}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors text-slate-900 disabled:font-normal font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                {isLoading && <Spinner />}
                {isLoading ? "Processing..." : "Create Campaign"}
              </button>
            </form>
          </section>

          {/* Contribute */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold mb-4">Contribute</h2>
            <form onSubmit={handleContribute} className="space-y-3">
              <input
                type="number"
                placeholder="Campaign ID"
                value={contributeCampaignId}
                onChange={(e) => setContributeCampaignId(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Amount (e.g. 1.5)"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Token address (0x...)"
                value={contributeToken}
                onChange={(e) => setContributeToken(e.target.value)}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={isLoading || !accountAddress}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors text-slate-900 disabled:font-normal font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                {isLoading && <Spinner />}
                {isLoading ? "Processing..." : "Contribute"}
              </button>
            </form>
          </section>

          {/* Campaign actions */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold mb-1">Campaign Actions</h2>
            <p className="text-slate-400 text-xs mb-4">
              Enter a campaign ID, then choose an action below.
            </p>
            <input
              type="number"
              placeholder="Campaign ID"
              value={actionCampaignId}
              onChange={(e) => setActionCampaignId(e.target.value)}
              className={`${inputClass} mb-3`}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm px-3 py-2 rounded-lg border border-white/10"
              >
                Withdraw
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm px-3 py-2 rounded-lg border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={isLoading}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm px-3 py-2 rounded-lg border border-white/10"
              >
                Refund Me
              </button>
              <button
                onClick={handleApproveMilestone}
                disabled={isLoading}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm px-3 py-2 rounded-lg border border-white/10"
              >
                Approve
              </button>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <Spinner /> Waiting for confirmation...
              </div>
            )}
          </section>

          {/* My Contribution */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold mb-4">My Contribution</h2>
            <input
              type="number"
              placeholder="Campaign ID"
              value={myContribCampaignId}
              onChange={(e) => setMyContribCampaignId(e.target.value)}
              className={`${inputClass} mb-3`}
            />
            <button
              onClick={handleFetchMyContribution}
              disabled={isCheckingContribution}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm px-4 py-2.5 rounded-lg border border-white/10 flex items-center justify-center gap-2"
            >
              {isCheckingContribution && <Spinner />}
              Check My Contribution
            </button>
            {myContribution !== null && (
              <p className="mt-4 text-sm">
                <span className="text-slate-400">Your contribution:</span>{" "}
                <span className="font-semibold">{myContribution}</span>
              </p>
            )}
          </section>
        </div>

        {/* Lookup */}
        <section className={`${cardClass} mt-6`}>
          <h2 className="text-lg font-semibold mb-4">Look Up a Campaign</h2>
          <div className="flex gap-2 mb-5">
            <input
              type="number"
              placeholder="Campaign ID"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={handleLookup}
              disabled={isLookingUp}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 transition-colors text-slate-900 disabled:text-slate-400 font-semibold text-sm px-5 py-2.5 rounded-lg flex items-center gap-2"
            >
              {isLookingUp && <Spinner />}
              Look Up
            </button>
          </div>
          {lookupResult && <CampaignCard campaign={lookupResult} shortenAddress={shortenAddress} />}
        </section>

        {/* All campaigns */}
        <section className={`${cardClass} mt-6`}>
          <h2 className="text-lg font-semibold mb-4">All Campaigns (via Multicall)</h2>
          <button
            onClick={fetchAllCampaigns}
            disabled={isFetchingCampaigns}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 transition-colors text-slate-900 font-semibold text-sm px-5 py-2.5 rounded-lg flex items-center gap-2"
          >
            {isFetchingCampaigns && <Spinner />}
            {isFetchingCampaigns ? "Fetching..." : "Fetch All Campaigns"}
          </button>

          {campaigns.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} shortenAddress={shortenAddress} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const CampaignCard = ({
  campaign,
  shortenAddress,
}: {
  campaign: any;
  shortenAddress: (a: string) => string;
}) => (
  <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm space-y-1.5">
    <div className="flex justify-between items-center mb-1">
      <span className="font-semibold">Campaign #{campaign.id}</span>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          campaign.cancelled
            ? "bg-red-500/15 text-red-300"
            : campaign.active
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-slate-500/15 text-slate-300"
        }`}
      >
        {campaign.cancelled ? "Cancelled" : campaign.active ? "Active" : "Inactive"}
      </span>
    </div>
    <p><span className="text-slate-400">Creator:</span> {shortenAddress(campaign.creator)}</p>
    <p><span className="text-slate-400">Target:</span> {campaign.target}</p>
    <p><span className="text-slate-400">Deadline:</span> {new Date(campaign.deadline * 1000).toLocaleString()}</p>
    <p><span className="text-slate-400">Raised:</span> {campaign.moneyRaised}</p>
    <p><span className="text-slate-400">Available:</span> {campaign.moneyAvailable}</p>
    <p><span className="text-slate-400">Token:</span> {shortenAddress(campaign.tokenAccepted)}</p>
  </div>
);

export default Crowdfunding;