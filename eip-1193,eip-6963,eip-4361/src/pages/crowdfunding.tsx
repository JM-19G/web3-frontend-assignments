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

  // Create campaign form
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tokenAccepted, setTokenAccepted] = useState("");
  const [milestoneAmounts, setMilestoneAmounts] = useState("");
  const [milestoneStatuses, setMilestoneStatuses] = useState("");

  // Contribute form
  const [contributeCampaignId, setContributeCampaignId] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeToken, setContributeToken] = useState("");

  // Single actions (withdraw, cancel, refund, approve milestone)
  const [actionCampaignId, setActionCampaignId] = useState("");

  // Lookup single campaign
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);

  // My contribution lookup
  const [myContribCampaignId, setMyContribCampaignId] = useState("");

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
    const result = await getCampaign(Number(lookupId));
    setLookupResult(result);
    if (!result) setError("Could not find that campaign.");
  };

  const handleFetchMyContribution = async () => {
    clearMessages();
    if (!myContribCampaignId) {
      setError("Enter a campaign ID first.");
      return;
    }
    await fetchMyContribution(Number(myContribCampaignId));
  };

  const shortenAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div style={{ minHeight: "100vh", background: "#111827", color: "white", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Crowdfunding Portal</h1>
        <p style={{ color: "#9ca3af", marginBottom: "30px" }}>
          Create campaigns, contribute, manage milestones, and withdraw funds.
        </p>

        {/* Wallet */}
        <section style={{ ...cardStyle, marginBottom: "25px" }}>
          <h2>Wallet</h2>
          {accountAddress ? (
            <>
              <p><strong>Connected:</strong> {shortenAddress(accountAddress)}</p>
              <p><strong>Network:</strong> {chainId === 11155111 ? "Sepolia" : `Chain ID: ${chainId}`}</p>
              {chainId !== 11155111 && (
                <button onClick={() => switchToSupportedChain(11155111)} style={buttonStyle}>
                  Switch to Sepolia
                </button>
              )}
            </>
          ) : (
            <button onClick={connectWallet} style={buttonStyle}>Connect Wallet</button>
          )}
        </section>

        {error && <div style={errorBannerStyle}>{error}</div>}
        {success && <div style={successBannerStyle}>{success}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px" }}>
          {/* Create Campaign */}
          <section style={cardStyle}>
            <h2>Create Campaign</h2>
            <form onSubmit={handleCreateCampaign}>
              <input
                type="text"
                placeholder="Target amount (e.g. 10)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={inputStyle}
              />
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Accepted token address (0x...)"
                value={tokenAccepted}
                onChange={(e) => setTokenAccepted(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Milestone amounts, comma separated (e.g. 3,3,4)"
                value={milestoneAmounts}
                onChange={(e) => setMilestoneAmounts(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Milestone statuses, comma separated (e.g. 0,0,0)"
                value={milestoneStatuses}
                onChange={(e) => setMilestoneStatuses(e.target.value)}
                style={inputStyle}
              />
              <button type="submit" disabled={isLoading || !accountAddress} style={buttonStyle}>
                {isLoading ? "Creating..." : "Create Campaign"}
              </button>
            </form>
          </section>

          {/* Contribute */}
          <section style={cardStyle}>
            <h2>Contribute</h2>
            <form onSubmit={handleContribute}>
              <input
                type="number"
                placeholder="Campaign ID"
                value={contributeCampaignId}
                onChange={(e) => setContributeCampaignId(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Amount (e.g. 1.5)"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Token address (0x...)"
                value={contributeToken}
                onChange={(e) => setContributeToken(e.target.value)}
                style={inputStyle}
              />
              <button type="submit" disabled={isLoading || !accountAddress} style={buttonStyle}>
                {isLoading ? "Contributing..." : "Contribute"}
              </button>
            </form>
          </section>

          {/* Campaign actions */}
          <section style={cardStyle}>
            <h2>Campaign Actions</h2>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
              Enter a campaign ID, then choose an action below.
            </p>
            <input
              type="number"
              placeholder="Campaign ID"
              value={actionCampaignId}
              onChange={(e) => setActionCampaignId(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <button onClick={handleWithdraw} disabled={isLoading} style={buttonStyle}>Withdraw</button>
              <button onClick={handleCancel} disabled={isLoading} style={buttonStyle}>Cancel Campaign</button>
              <button onClick={handleRefund} disabled={isLoading} style={buttonStyle}>Refund Me</button>
              <button onClick={handleApproveMilestone} disabled={isLoading} style={buttonStyle}>Approve Milestone</button>
            </div>
          </section>

          {/* My Contribution */}
          <section style={cardStyle}>
            <h2>My Contribution</h2>
            <input
              type="number"
              placeholder="Campaign ID"
              value={myContribCampaignId}
              onChange={(e) => setMyContribCampaignId(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleFetchMyContribution} style={buttonStyle}>Check My Contribution</button>
            {myContribution !== null && (
              <p style={{ marginTop: "12px" }}>
                <strong>Your contribution:</strong> {myContribution}
              </p>
            )}
          </section>
        </div>

        {/* Single campaign lookup */}
        <section style={{ ...cardStyle, marginTop: "25px" }}>
          <h2>Look Up a Campaign</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input
              type="number"
              placeholder="Campaign ID"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            />
            <button onClick={handleLookup} style={buttonStyle}>Look Up</button>
          </div>
          {lookupResult && <CampaignCard campaign={lookupResult} shortenAddress={shortenAddress} />}
        </section>

        {/* All campaigns via multicall */}
        <section style={{ ...cardStyle, marginTop: "25px" }}>
          <h2>All Campaigns (via Multicall)</h2>
          <button onClick={fetchAllCampaigns} disabled={isFetchingCampaigns} style={buttonStyle}>
            {isFetchingCampaigns ? "Fetching..." : "Fetch All Campaigns"}
          </button>

          {campaigns.length > 0 && (
            <div style={{ marginTop: "20px", display: "grid", gap: "15px" }}>
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

const CampaignCard = ({ campaign, shortenAddress }: { campaign: any; shortenAddress: (a: string) => string }) => (
  <div style={{ background: "#111827", padding: "15px", borderRadius: "8px" }}>
    <p><strong>ID:</strong> {campaign.id}</p>
    <p><strong>Creator:</strong> {shortenAddress(campaign.creator)}</p>
    <p><strong>Target:</strong> {campaign.target}</p>
    <p><strong>Deadline:</strong> {new Date(campaign.deadline * 1000).toLocaleString()}</p>
    <p><strong>Raised:</strong> {campaign.moneyRaised}</p>
    <p><strong>Available:</strong> {campaign.moneyAvailable}</p>
    <p><strong>Active:</strong> {campaign.active ? "Yes" : "No"}</p>
    <p><strong>Cancelled:</strong> {campaign.cancelled ? "Yes" : "No"}</p>
    <p><strong>Token:</strong> {shortenAddress(campaign.tokenAccepted)}</p>
  </div>
);

const cardStyle: React.CSSProperties = {
  background: "#1f2937",
  padding: "25px",
  borderRadius: "12px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #374151",
  background: "#111827",
  color: "white",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
};

const errorBannerStyle: React.CSSProperties = {
  background: "#7f1d1d",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "15px",
};

const successBannerStyle: React.CSSProperties = {
  background: "#14532d",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "15px",
};

export default Crowdfunding;