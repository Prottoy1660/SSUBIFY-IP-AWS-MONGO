import type { User } from '../../types';

export interface ResellersListProps {
  resellers: User[];
}

export function ResellersList(props: ResellersListProps): JSX.Element; 