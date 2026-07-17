import { Client } from "@opensearch-project/opensearch";

import { envs } from "@/src/common/envs";

export const create_opensearch_client = (): Client =>
  new Client({
    node: envs.OPENSEARCH_URL,
  });

export const OPENSEARCH_CLIENT = Symbol("OPENSEARCH_CLIENT");
