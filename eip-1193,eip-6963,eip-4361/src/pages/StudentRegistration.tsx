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
    } catch (err: any)  {
      console.error(err);
      setError(
        err?.reason ||
          err?.shortMessage ||
          "Registration failed. Please try again."
      );
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

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          Student Registration Portal
        </h1>

        <p style={{ color: "#9ca3af", marginBottom: "30px" }}>
          Register students, view your details, and fetch multiple students
          using Multicall.
        </p>

        {/* Wallet */}
        <section
          style={{
            background: "#1f2937",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "25px",
          }}
        >
          <h2>Wallet</h2>

          {accountAddress ? (
            <>
              <p>
                <strong>Connected:</strong>{" "}
                {shortenAddress(accountAddress)}
              </p>

              <p>
                <strong>Network:</strong>{" "}
                {chainId === 11155111
                  ? "Sepolia"
                  : `Chain ID: ${chainId}`}
              </p>

              {chainId !== 11155111 && (
                <button
                  onClick={() => switchToSupportedChain(11155111)}
                  style={buttonStyle}
                >
                  Switch to Sepolia
                </button>
              )}
            </>
          ) : (
            <button onClick={connectWallet} style={buttonStyle}>
              Connect Wallet
            </button>
          )}
        </section>

        {/* Messages */}
        {error && (
          <div
            style={{
              background: "#7f1d1d",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#14532d",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "25px",
          }}
        >
          {/* Register */}
          <section style={cardStyle}>
            <h2>Register Student</h2>

            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Student name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />

              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={inputStyle}
              />

              <input
                type="text"
                placeholder="Course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                style={inputStyle}
              />

              <button
                type="submit"
                disabled={isRegistering || !accountAddress}
                style={buttonStyle}
              >
                {isRegistering ? "Registering..." : "Register Student"}
              </button>
            </form>
          </section>

          {/* My Details */}
          <section style={cardStyle}>
            <h2>My Details</h2>

            {!accountAddress ? (
              <p>Please connect your wallet.</p>
            ) : !isRegistered ? (
              <p>You are not registered yet.</p>
            ) : myDetails ? (
              <div>
                <p>
                  <strong>Name:</strong> {myDetails.name}
                </p>

                <p>
                  <strong>Age:</strong> {myDetails.age}
                </p>

                <p>
                  <strong>Course:</strong> {myDetails.course}
                </p>

                <button onClick={fetchMyDetails} style={buttonStyle}>
                  Refresh Details
                </button>
              </div>
            ) : (
              <p>Loading your details...</p>
            )}
          </section>
        </div>

        {/* Multicall */}
        <section style={{ ...cardStyle, marginTop: "25px" }}>
          <h2>Fetch All Students Using Multicall</h2>

          <p style={{ color: "#9ca3af" }}>
            Add registered student wallet addresses, then fetch their details
            in one multicall.
          </p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="0x..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            />

            <button onClick={handleAddAddress} style={buttonStyle}>
              Add
            </button>
          </div>

          {trackedAddresses.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3>Addresses</h3>

              {trackedAddresses.map((address) => (
                <div
                  key={address}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#111827",
                    padding: "10px",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <span>{shortenAddress(address)}</span>

                  <button
                    onClick={() => removeTrackedAddress(address)}
                    style={removeButtonStyle}
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
            style={buttonStyle}
          >
            {isFetchingAll ? "Fetching..." : "Fetch All Students"}
          </button>

          {allStudents.length > 0 && (
            <div style={{ marginTop: "25px" }}>
              <h3>Student Results</h3>

              {allStudents.map((student) => (
                <div
                  key={student.address}
                  style={{
                    background: "#111827",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <p>
                    <strong>Address:</strong>{" "}
                    {shortenAddress(student.address)}
                  </p>

                  {student.success ? (
                    <>
                      <p>
                        <strong>Name:</strong> {student.name}
                      </p>
                      <p>
                        <strong>Age:</strong> {student.age}
                      </p>
                      <p>
                        <strong>Course:</strong> {student.course}
                      </p>
                    </>
                  ) : (
                    <p style={{ color: "#f87171" }}>
                      Could not fetch this student's details.
                    </p>
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

const removeButtonStyle: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: "6px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
};

export default StudentRegistration;