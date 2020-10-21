import useSWR, { responseInterface } from 'swr';
import { ConfigInterface } from 'swr/dist/types';
import { apiv3Get } from '~/client/js/util/apiv3-client';

export const useRecentlyUpdatedSWR = <Data, Error>(config?: ConfigInterface): responseInterface<Data, Error> => {
  return useSWR(
    '/pages/recent',
    endpoint => apiv3Get(endpoint).then(response => response.data),
    config,
  );
};
