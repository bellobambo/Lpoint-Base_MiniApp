import { createClient, createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import {
  entryPoint06Address,
  createPaymasterClient,
  createBundlerClient,
} from "viem/account-abstraction";

export const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const PaymasterService = process.env.PAYMASTER_SERVICE_URL!;

export const PaymasterClient = createPaymasterClient({
  transport: http(PaymasterService),
});

export const bundlerClient = createBundlerClient({
  chain: baseSepolia,
  paymaster: PaymasterClient,
  transport: http(PaymasterService),
});
