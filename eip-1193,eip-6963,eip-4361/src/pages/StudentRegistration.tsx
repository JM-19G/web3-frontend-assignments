import { FormEvent, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context";
import { useStudentRegistration } from "../hooks/useStudentRegistration";

const StudentRegistration = () => {
  const { provider, accountAddress, chainId, connectWallet, switchToSupportedChain } =
    useWallet();

  const {
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
  } = useStudentRegistration(provider, accountAddress);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [course, setCourse] = useState("");

  const [addressInput, setAddressInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (accountAddress) {
      fetchMyDetails();
    }
  }, [accountAddress, fetchMyDetails]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!accountAddress) {
      setError("Please connect your wallet first.");
      return;
    }
    if (chainId !== 11155111) {
      setError("Please switch to the Sepolia network.");
      return;
    }
    if (!name || !age || !course) {
      setError("Please fill in all fields.");
      return;
    }
    if (Number(age) <= 0) {
      setError("Please enter a valid age.");
      return;
    }

    try {
      await register(name, Number(age), course);
      await fetchMyDetails();
      setSuccess("Student registered successfully!");
      setName("");
      setAge("");
      setCourse("");
    } catch (err: any) {
      console.error(err);
      setError(err?.reason || err?.shortMessage || "Registration failed. Please try again.");
    }
  };

  const handleAddAddress = () => {
    setError("");
    if (!ethers.isAddress(addressInput)) {
      setError("Please enter a valid Ethereum address.");
      return;
    }
    addTrackedAddress(addressInput);
    setAddressInput("");
  };

  const handleFetchStudents = async () => {
    setError("");
    if (trackedAddresses.length === 0) {
      setError("Add at least one student address first.");
      return;
    }
    await fetchAllStudents();
  };

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white px-4 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
            Student Registration Portal
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Register students, view your details, and fetch multiple students using Multicall.
          </p>
        </div>

        {/* Wallet card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 sm:p-6 mb-6 shadow-lg shadow-black/20">
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
              className="bg-indigo-500 hover:bg-indigo-400 transition-colors text-white font-semibold px-5 py-2.5 rounded-lg shadow shadow-indigo-900/40"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Alerts */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Register */}
          <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/20">
            <h2 className="text-lg font-semibold mb-4">Register Student</h2>
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="text"
                placeholder="Student name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              <input
                type="text"
                placeholder="Course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              <button
                type="submit"
                disabled={isRegistering || !accountAddress}
                className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                {isRegistering && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {isRegistering ? "Registering..." : "Register Student"}
              </button>
            </form>
          </section>

          {/* My Details */}
          <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/20">
            <h2 className="text-lg font-semibold mb-4">My Details</h2>
            {!accountAddress ? (
              <p className="text-slate-400 text-sm">Please connect your wallet.</p>
            ) : !isRegistered ? (
              <p className="text-slate-400 text-sm">You are not registered yet.</p>
            ) : myDetails ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-400">Name:</span> <span className="font-medium">{myDetails.name}</span></p>
                <p><span className="text-slate-400">Age:</span> <span className="font-medium">{myDetails.age}</span></p>
                <p><span className="text-slate-400">Course:</span> <span className="font-medium">{myDetails.course}</span></p>
                <button
                  onClick={fetchMyDetails}
                  className="mt-3 bg-slate-800 hover:bg-slate-700 transition-colors text-sm px-4 py-2 rounded-lg border border-white/10"
                >
                  Refresh Details
                </button>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Loading your details...</p>
            )}
          </section>
        </div>

        {/* Multicall */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mt-6 shadow-lg shadow-black/20">
          <h2 className="text-lg font-semibold mb-1">Fetch All Students Using Multicall</h2>
          <p className="text-slate-400 text-sm mb-4">
            Add registered student wallet addresses, then fetch their details in one multicall.
          </p>

          <div className="flex gap-2 mb-5">
            <input
              type="text"
              placeholder="0x..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="flex-1 bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
            <button
              onClick={handleAddAddress}
              className="bg-indigo-500 hover:bg-indigo-400 transition-colors font-semibold text-sm px-5 py-2.5 rounded-lg"
            >
              Add
            </button>
          </div>

          {trackedAddresses.length > 0 && (
            <div className="space-y-2 mb-5">
              {trackedAddresses.map((address) => (
                <div
                  key={address}
                  className="flex justify-between items-center bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono"
                >
                  <span>{shortenAddress(address)}</span>
                  <button
                    onClick={() => removeTrackedAddress(address)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold px-3 py-1 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleFetchStudents}
            disabled={isFetchingAll || trackedAddresses.length === 0}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors font-semibold text-sm px-5 py-2.5 rounded-lg flex items-center gap-2"
          >
            {isFetchingAll && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {isFetchingAll ? "Fetching..." : "Fetch All Students"}
          </button>

          {allStudents.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              {allStudents.map((student) => (
                <div
                  key={student.address}
                  className="bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm"
                >
                  <p className="font-mono text-xs text-slate-400 mb-2">{shortenAddress(student.address)}</p>
                  {student.success ? (
                    <div className="space-y-1">
                      <p><span className="text-slate-400">Name:</span> {student.name}</p>
                      <p><span className="text-slate-400">Age:</span> {student.age}</p>
                      <p><span className="text-slate-400">Course:</span> {student.course}</p>
                    </div>
                  ) : (
                    <p className="text-red-400 text-xs">Could not fetch this student's details.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentRegistration;