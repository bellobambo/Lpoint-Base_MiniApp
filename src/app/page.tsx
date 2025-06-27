"use client";

import { useCallback, useEffect, useState } from "react";
import { sdk } from "@farcaster/frame-sdk";

import { Address, Avatar, Identity, Name } from "@coinbase/onchainkit/identity";
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction";
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";

import { parseEther } from "viem";
import { TaskList } from "@/components/TaskList";
import { freelanceContractAbi, freelanceContractAddress } from "./freelanceABI";

const BASE_SEPOLIA_CHAIN_ID = 84532;

export default function Home() {
  const { address, chain } = useAccount();
  const [description, setDescription] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [daysFromNow, setDaysFromNow] = useState<number>(1);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Calculate deadline (current time + daysFromNow in seconds)
  const deadline = Math.floor(Date.now() / 1000) + daysFromNow * 24 * 60 * 60;

  const handleOnStatus = useCallback((status: LifecycleStatus) => {
    console.log("Transaction Status:", status);
  }, []);

  // Validate amount before creating transaction
  const isValidAmount =
    amountEth && !isNaN(Number(amountEth)) && Number(amountEth) > 0;

  // Prepare transaction calls with proper typing
  const calls = [
    {
      address: freelanceContractAddress, // Using 'address' instead of 'to'
      abi: freelanceContractAbi,
      functionName: "createTask",
      args: [description, deadline],
      value: isValidAmount ? parseEther(amountEth) : BigInt(0),
    },
  ];

  // Check if we're on the correct network
  const isCorrectNetwork = chain?.id === BASE_SEPOLIA_CHAIN_ID;

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Wallet Connection */}
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
      </Wallet>

      {address ? (
        <>
          {!isCorrectNetwork && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Please switch to Base Sepolia network (Chain ID: 84532)
            </div>
          )}

          <h3 className="text-lg font-bold mb-4">Create a New Task</h3>

          {/* Task Description */}
          <label className="block mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="What needs to be done?"
            required
          />

          {/* Deadline Input */}
          <label className="block mb-1">Deadline (in days)</label>
          <input
            type="number"
            value={daysFromNow}
            onChange={(e) => setDaysFromNow(Number(e.target.value))}
            className="w-full p-2 border rounded mb-4"
            placeholder="e.g. 3"
            required
          />

          {/* Funding Amount */}
          <label className="block mb-1">Amount to fund (ETH)</label>
          <input
            type="number"
            value={amountEth}
            onChange={(e) => setAmountEth(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="e.g. 0.01"
            step="0.001"
            min="0.001"
            required
          />

          {/* Transaction Section */}
          {isCorrectNetwork && description && daysFromNow && isValidAmount && (
            <Transaction
              chainId={BASE_SEPOLIA_CHAIN_ID}
              calls={calls}
              onStatus={handleOnStatus}
            >
              <TransactionButton />

              <TransactionSponsor />
              <TransactionStatus className="mt-2">
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          )}
        </>
      ) : (
        <p className="mt-4 text-center">
          Please connect your wallet to create a task.
        </p>
      )}

      <TaskList />
    </div>
  );
}
