import { useState, useCallback } from "react";
import { ethers, BrowserProvider } from "ethers";
import {
  CROWDFUNDING_ADDRESS,
  CROWDFUNDING_ABI,
  ERC20_ABI,
  MULTICALL3_ADDRESS,
  MULTICALL3_ABI,
} from "../config/contracts";

export interface Campaign {
  id: number;
  creator: string;
  target: string;
  deadline: number;
  moneyRaised: string;
  moneyAvailable: string;
  active: boolean;
  cancelled: boolean;
  tokenAccepted: string;
}

export function useCrowdfunding(
  provider: BrowserProvider | null,
  accountAddress: string
) {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);
  const [myContribution, setMyContribution] = useState<string | null>(null);

  const getContract = useCallback(
    (signerOrProvider: any) =>
      new ethers.Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signerOrProvider),
    []
  );

  const getTokenContract = useCallback(
    (tokenAddress: string, signerOrProvider: any) =>
      new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider),
    []
  );

  // --- WRITE FUNCTIONS ---

  const createCampaign = useCallback(
    async (
      target: string,
      deadline: number,
      tokenAccepted: string,
      amounts: string[],
      statuses: number[]
    ) => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const signer = await provider.getSigner();
        const contract = getContract(signer);
        const targetWei = ethers.parseUnits(target, 18);
        const amountsWei = amounts.map((a) => ethers.parseUnits(a, 18));
        const tx = await contract.createCampaign(
          targetWei,
          deadline,
          tokenAccepted,
          amountsWei,
          statuses
        );
        await tx.wait();
      } catch (error) {
        console.error("Error creating campaign:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, getContract]
  );

  const contribute = useCallback(
    async (campaignId: number, amount: string, tokenAddress: string) => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        const amountWei = ethers.parseUnits(amount, 18);

        const tokenContract = getTokenContract(tokenAddress, signer);
        const currentAllowance: bigint = await tokenContract.allowance(
          signerAddress,
          CROWDFUNDING_ADDRESS
        );

        if (currentAllowance < amountWei) {
          const approveTx = await tokenContract.approve(
            CROWDFUNDING_ADDRESS,
            amountWei
          );
          await approveTx.wait();
        }

        const contract = getContract(signer);
        const tx = await contract.contributing(amountWei, tokenAddress, campaignId);
        await tx.wait();
      } catch (error) {
        console.error("Error contributing:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, getContract, getTokenContract]
  );

  const withdraw = useCallback(
    async (campaignId: number) => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const signer = await provider.getSigner();
        const contract = getContract(signer);
        const tx = await contract.Withdrawal(campaignId);
        await tx.wait();
      } catch (error) {
        console.error("Error withdrawing:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, getContract]
  );

  const cancelCampaign = useCallback(
    async (campaignId: number) => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const signer = await provider.getSigner();
        const contract = getContract(signer);
        const tx = await contract.cancelCampaign(campaignId);
        await tx.wait();
      } catch (error) {
        console.error("Error cancelling campaign:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, getContract]
  );

  const refundMoney = useCallback(
    async (campaignId: number) => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const signer = await provider.getSigner();
        const contract = getContract(signer);
        const tx = await contract.refundMoney(campaignId);
        await tx.wait();
      } catch (error) {
        console.error("Error refunding:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, getContract]
  );

  const approveMilestones = useCallback(
    async (campaignId: number) => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const signer = await provider.getSigner();
        const contract = getContract(signer);
        const tx = await contract.approveMilestones(campaignId);
        await tx.wait();
      } catch (error) {
        console.error("Error approving milestone:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, getContract]
  );

  // --- READ FUNCTIONS ---

  const getCampaign = useCallback(
    async (campaignId: number): Promise<Campaign | null> => {
      if (!provider) return null;
      try {
        const contract = getContract(provider);
        const result = await contract.campaign(campaignId);
        return {
          id: campaignId,
          creator: result[0],
          target: ethers.formatUnits(result[1], 18),
          deadline: Number(result[2]),
          moneyRaised: ethers.formatUnits(result[3], 18),
          moneyAvailable: ethers.formatUnits(result[4], 18),
          active: result[5],
          cancelled: result[6],
          tokenAccepted: result[7],
        };
      } catch (error) {
        console.error("Error fetching campaign:", error);
        return null;
      }
    },
    [provider, getContract]
  );

  const fetchMyContribution = useCallback(
    async (campaignId: number) => {
      if (!provider || !accountAddress) return;
      try {
        const contract = getContract(provider);
        const amount = await contract.contributors(campaignId, accountAddress);
        setMyContribution(ethers.formatUnits(amount, 18));
      } catch (error) {
        console.error("Error fetching contribution:", error);
      }
    },
    [provider, accountAddress, getContract]
  );

  const fetchAllCampaigns = useCallback(async () => {
    if (!provider) return;
    setIsFetchingCampaigns(true);
    try {
      const contract = getContract(provider);
      const nextId: bigint = await contract.NextCampignId();
      const totalCampaigns = Number(nextId);

      if (totalCampaigns === 0) {
        setCampaigns([]);
        return;
      }

      const iface = new ethers.Interface(CROWDFUNDING_ABI);
      const multicall = new ethers.Contract(
        MULTICALL3_ADDRESS,
        MULTICALL3_ABI,
        provider
      );

      const calls = Array.from({ length: totalCampaigns }, (_, id) => ({
        target: CROWDFUNDING_ADDRESS,
        allowFailure: true,
        callData: iface.encodeFunctionData("campaign", [id]),
      }));

      const results = await multicall.aggregate3.staticCall(calls);

      const decoded: Campaign[] = results
        .map((result: { success: boolean; returnData: string }, id: number) => {
          if (!result.success) return null;
          try {
            const r = iface.decodeFunctionResult("campaign", result.returnData);
            return {
              id,
              creator: r[0],
              target: ethers.formatUnits(r[1], 18),
              deadline: Number(r[2]),
              moneyRaised: ethers.formatUnits(r[3], 18),
              moneyAvailable: ethers.formatUnits(r[4], 18),
              active: r[5],
              cancelled: r[6],
              tokenAccepted: r[7],
            };
          } catch {
            return null;
          }
        })
        .filter((c: Campaign | null): c is Campaign => c !== null);

      setCampaigns(decoded);
    } catch (error) {
      console.error("Error fetching all campaigns:", error);
    } finally {
      setIsFetchingCampaigns(false);
    }
  }, [provider, getContract]);

  return {
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
  };
}