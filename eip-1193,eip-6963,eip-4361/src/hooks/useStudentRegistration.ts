import { useState, useCallback } from "react";
import { ethers, BrowserProvider } from "ethers";
import {
  STUDENT_REGISTRATION_ADDRESS,
  STUDENT_REGISTRATION_ABI,
  MULTICALL3_ADDRESS,
  MULTICALL3_ABI,
} from "../config/contracts";

export interface StudentResult {
  address: string;
  success: boolean;
  name?: string;
  age?: string;
  course?: string;
}

export function useStudentRegistration(
  provider: BrowserProvider | null,
  accountAddress: string
) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [myDetails, setMyDetails] = useState<{
    name: string;
    age: string;
    course: string;
  } | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [trackedAddresses, setTrackedAddresses] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<StudentResult[]>([]);
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  const getContract = useCallback(
    (signerOrProvider: any) =>
      new ethers.Contract(
        STUDENT_REGISTRATION_ADDRESS,
        STUDENT_REGISTRATION_ABI,
        signerOrProvider
      ),
    []
  );

  const register = useCallback(
    async (name: string, age: number, course: string) => {
      if (!provider) return;
      setIsRegistering(true);
      try {
        const signer = await provider.getSigner();
        const contract = getContract(signer);
        const tx = await contract.register(name, age, course);
        await tx.wait();
        await fetchMyDetails();
      } catch (error) {
        console.error("Error registering student:", error);
        throw error;
      } finally {
        setIsRegistering(false);
      }
    },
    [provider, getContract]
  );

  const fetchMyDetails = useCallback(async () => {
    if (!provider || !accountAddress) return;
    try {
      const contract = getContract(provider);
      const registeredStatus: boolean = await contract.registered(accountAddress);
      setIsRegistered(registeredStatus);
      if (registeredStatus) {
        const [name, age, course] = await contract.getStudent(accountAddress);
        setMyDetails({ name, age: age.toString(), course });
      } else {
        setMyDetails(null);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  }, [provider, accountAddress, getContract]);

  const addTrackedAddress = useCallback((address: string) => {
    if (!ethers.isAddress(address)) return;
    setTrackedAddresses((prev) =>
      prev.includes(address) ? prev : [...prev, address]
    );
  }, []);

  const removeTrackedAddress = useCallback((address: string) => {
    setTrackedAddresses((prev) => prev.filter((a) => a !== address));
  }, []);

  const fetchAllStudents = useCallback(async () => {
    if (!provider || trackedAddresses.length === 0) return;
    setIsFetchingAll(true);
    try {
      const iface = new ethers.Interface(STUDENT_REGISTRATION_ABI);
      const multicall = new ethers.Contract(
        MULTICALL3_ADDRESS,
        MULTICALL3_ABI,
        provider
      );

      const calls = trackedAddresses.map((address) => ({
        target: STUDENT_REGISTRATION_ADDRESS,
        allowFailure: true,
        callData: iface.encodeFunctionData("getStudent", [address]),
      }));

      const results = await multicall.aggregate3.staticCall(calls);

      const decoded: StudentResult[] = results.map(
        (result: { success: boolean; returnData: string }, i: number) => {
          if (!result.success) {
            return { address: trackedAddresses[i], success: false };
          }
          try {
            const [name, age, course] = iface.decodeFunctionResult(
              "getStudent",
              result.returnData
            );
            return {
              address: trackedAddresses[i],
              success: true,
              name,
              age: age.toString(),
              course,
            };
          } catch {
            return { address: trackedAddresses[i], success: false };
          }
        }
      );

      setAllStudents(decoded);
    } catch (error) {
      console.error("Error fetching all students via multicall:", error);
    } finally {
      setIsFetchingAll(false);
    }
  }, [provider, trackedAddresses]);

  return {
    isRegistering,
    myDetails,
    isRegistered,
    register,
    fetchMyDetails,
    trackedAddresses,
    addTrackedAddress,
    removeTrackedAddress,
    allStudents,
    isFetchingAll,
    fetchAllStudents,
  };
}