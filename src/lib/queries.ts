import { gql } from '@urql/svelte';

export const SIGN_UP_MUTATION = gql`
  mutation SignUp($input: AuthInput!) {
    signUp(input: $input) {
      token
      username
      email
      message
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: AuthInput!) {
    login(input: $input) {
      token
      username
      email
      message
    }
  }
`;
