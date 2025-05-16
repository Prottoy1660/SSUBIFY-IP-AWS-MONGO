import type { User, Submission } from '../../types';

export interface ResellerProfileProps {
  reseller: User;
  submissions: Submission[];
}

export function ResellerProfile(props: ResellerProfileProps): JSX.Element; 