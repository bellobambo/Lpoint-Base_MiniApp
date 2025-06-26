"use client";

import { freelanceContractAddress } from "@/app/call";
import { freelanceContractAbi } from "@/app/page";
import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";

interface Task {
  client: `0x${string}`;
  freelancer: `0x${string}`;
  description: string;
  amount: bigint;
  deadline: bigint;
  status: number;
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Get total number of tasks
  const { data: countData } = useReadContracts({
    contracts: [
      {
        address: freelanceContractAddress,
        abi: freelanceContractAbi,
        functionName: "taskCount",
      },
    ],
  });

  // Prepare contracts for batch reading
  const taskCount = countData?.[0]?.result ? Number(countData[0].result) : 0;
  const contracts = Array.from({ length: taskCount }, (_, i) => ({
    address: freelanceContractAddress,
    abi: freelanceContractAbi,
    functionName: "getTask",
    args: [BigInt(i)],
  }));

  // Fetch all tasks in one batch
  const { data: tasksData } = useReadContracts({
    contracts,
  });

  // Process tasks data
  useEffect(() => {
    if (tasksData) {
      const loadedTasks = tasksData
        .map((item) => item.result as Task | undefined)
        .filter(Boolean) as Task[];
      setTasks(loadedTasks);
    }
  }, [tasksData]);

  function renderTasks() {
    return tasks.map((task, index) => (
      <div key={index} className="border p-4 mb-4 rounded-lg">
        <h3 className="font-bold mb-2">Task #{index + 1}</h3>
        <p className="mb-1">Description: {task.description}</p>
        <p className="mb-1">Client: {shortenAddress(task.client)}</p>
        <p className="mb-1">
          Freelancer:{" "}
          {task.freelancer === "0x0000000000000000000000000000000000000000"
            ? "Not assigned"
            : shortenAddress(task.freelancer)}
        </p>
        <p className="mb-1">Amount: {formatEther(task.amount)} ETH</p>
        <p className="mb-1">Deadline: {formatDate(task.deadline)}</p>
        <p className="mb-1">Status: {getStatusText(task.status)}</p>
      </div>
    ));
  }

  // Helper functions remain the same...
  function shortenAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatEther(wei: bigint) {
    return Number(wei) / 1e18;
  }

  function formatDate(timestamp: bigint) {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  }

  function getStatusText(status: number) {
    switch (status) {
      case 0:
        return "Created";
      case 1:
        return "Accepted";
      case 2:
        return "Completed";
      default:
        return "Unknown";
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Task List</h2>
      {tasks.length > 0 ? renderTasks() : <p>No tasks created yet.</p>}
    </div>
  );
}
