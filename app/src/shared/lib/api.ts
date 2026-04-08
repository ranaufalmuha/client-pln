import { graphqlRequest } from "./graphql-client";

export type AuthUser = {
  id: number;
  email: string;
  isAdmin: boolean;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export type UnitCategory = {
  id: number;
  key: string;
  name: string;
};

export type Unit = {
  id: number;
  name: string;
  categoryId: number;
  categoryKey: string;
  categoryName: string;
};

export type Bay = {
  id: number;
  unitId: number;
  unitName: string;
  unitCategoryId: number;
  unitCategoryKey: string;
  unitCategoryName: string;
  name: string;
};

export type Beban = {
  id: number;
  bayId: number | null;
  bayName: string | null;
  unitId: number | null;
  unitName: string | null;
  unitCategoryId: number | null;
  unitCategoryKey: string | null;
  unitCategoryName: string | null;
  kv: number;
  a: number;
  mw: number;
  mvar: number;
  percentage: number;
  tap: number | null;
  measuredAt: string;
};

export type CreateBebanInput = {
  bayId: number | null;
  kv: number;
  a: number;
  mw: number;
  mvar: number;
  percentage: number;
  tap: number | null;
  measuredAt: string;
};

export type UpdateBebanInput = {
  id: number;
  bayId?: number | null;
  kv?: number;
  a?: number;
  mw?: number;
  mvar?: number;
  percentage?: number;
  tap?: number | null;
  measuredAt?: string;
};

export type CreateUnitInput = {
  name: string;
  categoryId: number;
};

export type UpdateUnitInput = {
  id: number;
  name?: string;
  categoryId?: number;
};

export type CreateUnitCategoryInput = {
  key: string;
  name: string;
};

export type UpdateUnitCategoryInput = {
  id: number;
  key?: string;
  name?: string;
};

export type CreateBayInput = {
  unitId: number;
  name: string;
};

export type UpdateBayInput = {
  id: number;
  unitId?: number;
  name?: string;
};

export type AdminCreateUserInput = {
  email: string;
  password: string;
  isAdmin: boolean;
};

export type AdminUpdateUserInput = {
  id: number;
  email?: string;
  password?: string;
  isAdmin?: boolean;
};

const USER_FIELDS = `
  id
  email
  isAdmin
`;

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

const SIGNUP_MUTATION = `
  mutation Signup($input: CreateUserInput!) {
    signup(input: $input) {
      token
      user {
        ${USER_FIELDS}
      }
    }
  }
`;

const ME_QUERY = `
  query Me {
    me {
      ${USER_FIELDS}
    }
  }
`;

const USERS_QUERY = `
  query Users {
    users {
      ${USER_FIELDS}
    }
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: AdminCreateUserInput!) {
    createUser(input: $input) {
      ${USER_FIELDS}
    }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($input: AdminUpdateUserInput!) {
    updateUser(input: $input) {
      ${USER_FIELDS}
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

const UNIT_CATEGORIES_QUERY = `
  query UnitCategories {
    unitCategories {
      id
      key
      name
    }
  }
`;

const CREATE_UNIT_CATEGORY_MUTATION = `
  mutation CreateUnitCategory($input: CreateUnitCategoryInput!) {
    createUnitCategory(input: $input) {
      id
      key
      name
    }
  }
`;

const UPDATE_UNIT_CATEGORY_MUTATION = `
  mutation UpdateUnitCategory($input: UpdateUnitCategoryInput!) {
    updateUnitCategory(input: $input) {
      id
      key
      name
    }
  }
`;

const DELETE_UNIT_CATEGORY_MUTATION = `
  mutation DeleteUnitCategory($id: Int!) {
    deleteUnitCategory(id: $id)
  }
`;

const UNITS_QUERY = `
  query Units {
    units {
      id
      name
      categoryId
      categoryKey
      categoryName
    }
  }
`;

const CREATE_UNIT_MUTATION = `
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
      id
      name
      categoryId
      categoryKey
      categoryName
    }
  }
`;

const UPDATE_UNIT_MUTATION = `
  mutation UpdateUnit($input: UpdateUnitInput!) {
    updateUnit(input: $input) {
      id
      name
      categoryId
      categoryKey
      categoryName
    }
  }
`;

const DELETE_UNIT_MUTATION = `
  mutation DeleteUnit($id: Int!) {
    deleteUnit(id: $id)
  }
`;

const BAYS_QUERY = `
  query Bays($unitId: Int) {
    bays(unitId: $unitId) {
      id
      unitId
      unitName
      unitCategoryId
      unitCategoryKey
      unitCategoryName
      name
    }
  }
`;

const CREATE_BAY_MUTATION = `
  mutation CreateBay($input: CreateBayInput!) {
    createBay(input: $input) {
      id
      unitId
      unitName
      unitCategoryId
      unitCategoryKey
      unitCategoryName
      name
    }
  }
`;

const UPDATE_BAY_MUTATION = `
  mutation UpdateBay($input: UpdateBayInput!) {
    updateBay(input: $input) {
      id
      unitId
      unitName
      unitCategoryId
      unitCategoryKey
      unitCategoryName
      name
    }
  }
`;

const DELETE_BAY_MUTATION = `
  mutation DeleteBay($id: Int!) {
    deleteBay(id: $id)
  }
`;

const BEBANS_QUERY = `
  query Bebans($limit: Int, $offset: Int) {
    bebans(limit: $limit, offset: $offset) {
      id
      bayId
      bayName
      unitId
      unitName
      unitCategoryId
      unitCategoryKey
      unitCategoryName
      kv
      a
      mw
      mvar
      percentage
      tap
      measuredAt
    }
  }
`;

const BEBANS_COUNT_QUERY = `
  query BebansCount {
    bebansCount
  }
`;

const CREATE_BEBAN_MUTATION = `
  mutation CreateBeban($input: CreateBebanInput!) {
    createBeban(input: $input) {
      id
      bayId
      bayName
      unitId
      unitName
      unitCategoryId
      unitCategoryKey
      unitCategoryName
      kv
      a
      mw
      mvar
      percentage
      tap
      measuredAt
    }
  }
`;

const UPDATE_BEBAN_MUTATION = `
  mutation UpdateBeban($input: UpdateBebanInput!) {
    updateBeban(input: $input) {
      id
      bayId
      bayName
      unitId
      unitName
      unitCategoryId
      unitCategoryKey
      unitCategoryName
      kv
      a
      mw
      mvar
      percentage
      tap
      measuredAt
    }
  }
`;

const DELETE_BEBAN_MUTATION = `
  mutation DeleteBeban($id: Int!) {
    deleteBeban(id: $id)
  }
`;

export async function loginUser(email: string, password: string): Promise<AuthPayload> {
  const data = await graphqlRequest<{ login: AuthPayload }>(LOGIN_MUTATION, {
    email,
    password,
  });
  return data.login;
}

export async function signupUser(email: string, password: string): Promise<AuthPayload> {
  const data = await graphqlRequest<{ signup: AuthPayload }>(SIGNUP_MUTATION, {
    input: { email, password },
  });
  return data.signup;
}

export async function getMe(token: string): Promise<AuthUser> {
  const data = await graphqlRequest<{ me: AuthUser }>(ME_QUERY, {}, token);
  return data.me;
}

export async function getUsers(token: string): Promise<AuthUser[]> {
  const data = await graphqlRequest<{ users: AuthUser[] }>(USERS_QUERY, {}, token);
  return data.users;
}

export async function createUser(token: string, input: AdminCreateUserInput): Promise<AuthUser> {
  const data = await graphqlRequest<{ createUser: AuthUser }>(
    CREATE_USER_MUTATION,
    {
      input: {
        email: input.email,
        password: input.password,
        isAdmin: input.isAdmin,
      },
    },
    token,
  );
  return data.createUser;
}

export async function updateUser(token: string, input: AdminUpdateUserInput): Promise<AuthUser> {
  const data = await graphqlRequest<{ updateUser: AuthUser }>(
    UPDATE_USER_MUTATION,
    {
      input: {
        id: input.id,
        email: input.email,
        password: input.password,
        isAdmin: input.isAdmin,
      },
    },
    token,
  );
  return data.updateUser;
}

export async function deleteUser(token: string, id: number): Promise<boolean> {
  const data = await graphqlRequest<{ deleteUser: boolean }>(DELETE_USER_MUTATION, { id }, token);
  return data.deleteUser;
}

export async function getUnitCategories(token: string): Promise<UnitCategory[]> {
  const data = await graphqlRequest<{ unitCategories: UnitCategory[] }>(
    UNIT_CATEGORIES_QUERY,
    {},
    token,
  );
  return data.unitCategories;
}

export async function createUnitCategory(
  token: string,
  input: CreateUnitCategoryInput,
): Promise<UnitCategory> {
  const data = await graphqlRequest<{ createUnitCategory: UnitCategory }>(
    CREATE_UNIT_CATEGORY_MUTATION,
    { input },
    token,
  );
  return data.createUnitCategory;
}

export async function updateUnitCategory(
  token: string,
  input: UpdateUnitCategoryInput,
): Promise<UnitCategory> {
  const data = await graphqlRequest<{ updateUnitCategory: UnitCategory }>(
    UPDATE_UNIT_CATEGORY_MUTATION,
    { input },
    token,
  );
  return data.updateUnitCategory;
}

export async function deleteUnitCategory(token: string, id: number): Promise<boolean> {
  const data = await graphqlRequest<{ deleteUnitCategory: boolean }>(
    DELETE_UNIT_CATEGORY_MUTATION,
    { id },
    token,
  );
  return data.deleteUnitCategory;
}

export async function getUnits(token: string): Promise<Unit[]> {
  const data = await graphqlRequest<{ units: Unit[] }>(UNITS_QUERY, {}, token);
  return data.units;
}

export async function createUnit(token: string, input: CreateUnitInput): Promise<Unit> {
  const data = await graphqlRequest<{ createUnit: Unit }>(CREATE_UNIT_MUTATION, { input }, token);
  return data.createUnit;
}

export async function updateUnit(token: string, input: UpdateUnitInput): Promise<Unit> {
  const data = await graphqlRequest<{ updateUnit: Unit }>(UPDATE_UNIT_MUTATION, { input }, token);
  return data.updateUnit;
}

export async function deleteUnit(token: string, id: number): Promise<boolean> {
  const data = await graphqlRequest<{ deleteUnit: boolean }>(DELETE_UNIT_MUTATION, { id }, token);
  return data.deleteUnit;
}

export async function getBays(token: string, unitId?: number): Promise<Bay[]> {
  const variables = unitId !== undefined ? { unitId } : {};
  const data = await graphqlRequest<{ bays: Bay[] }>(BAYS_QUERY, variables, token);
  return data.bays;
}

export async function createBay(token: string, input: CreateBayInput): Promise<Bay> {
  const data = await graphqlRequest<{ createBay: Bay }>(CREATE_BAY_MUTATION, { input }, token);
  return data.createBay;
}

export async function updateBay(token: string, input: UpdateBayInput): Promise<Bay> {
  const data = await graphqlRequest<{ updateBay: Bay }>(UPDATE_BAY_MUTATION, { input }, token);
  return data.updateBay;
}

export async function deleteBay(token: string, id: number): Promise<boolean> {
  const data = await graphqlRequest<{ deleteBay: boolean }>(DELETE_BAY_MUTATION, { id }, token);
  return data.deleteBay;
}

export async function getBebans(token: string, limit?: number, offset?: number): Promise<Beban[]> {
  const variables: { limit?: number; offset?: number } = {};
  if (limit !== undefined) variables.limit = limit;
  if (offset !== undefined) variables.offset = offset;
  const data = await graphqlRequest<{ bebans: Beban[] }>(BEBANS_QUERY, variables, token);
  return data.bebans;
}

export async function getBebansCount(token: string): Promise<number> {
  const data = await graphqlRequest<{ bebansCount: number }>(BEBANS_COUNT_QUERY, {}, token);
  return data.bebansCount;
}

export async function createBeban(token: string, input: CreateBebanInput): Promise<Beban> {
  const data = await graphqlRequest<{ createBeban: Beban }>(
    CREATE_BEBAN_MUTATION,
    { input },
    token,
  );
  return data.createBeban;
}

export async function updateBeban(token: string, input: UpdateBebanInput): Promise<Beban> {
  const data = await graphqlRequest<{ updateBeban: Beban }>(
    UPDATE_BEBAN_MUTATION,
    { input },
    token,
  );
  return data.updateBeban;
}

export async function deleteBeban(token: string, id: number): Promise<boolean> {
  const data = await graphqlRequest<{ deleteBeban: boolean }>(DELETE_BEBAN_MUTATION, { id }, token);
  return data.deleteBeban;
}
