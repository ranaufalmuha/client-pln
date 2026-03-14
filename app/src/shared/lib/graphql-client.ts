import { appEnv } from "./env";

const GRAPHQL_ENDPOINT = appEnv.graphqlUrl;

type GraphQLError = {
  message: string;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLError[];
};

export async function graphqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null,
): Promise<TData> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed (${response.status})`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (!payload.data || payload.errors?.length) {
    const message =
      payload.errors?.map((item) => item.message).join(", ") ??
      "GraphQL response did not contain data";
    throw new Error(message);
  }

  return payload.data;
}
