import { useMemo } from 'react';
import { VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { type Address } from 'viem';
import {
  LINEA_MAINNET_CHAIN_ID,
  LINEA_SEPOLIA_CHAIN_ID,
} from '../utils/constants.ts';

export const useVeraxSdk = (chainId?: number, address?: Address) => {
  const veraxSdk = useMemo(() => {
    if (!chainId || !address) {
      return undefined;
    }

    if (
      chainId !== LINEA_MAINNET_CHAIN_ID &&
      chainId !== LINEA_SEPOLIA_CHAIN_ID
    ) {
      return undefined;
    }

    const sdkConf =
      chainId === LINEA_MAINNET_CHAIN_ID
        ? VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND
        : VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND;

    return new VeraxSdk(sdkConf, address);
  }, [chainId, address]);

  return { veraxSdk };
};
