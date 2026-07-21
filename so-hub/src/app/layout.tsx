import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Root layout passing children to locale-specific layout
export default function RootLayout({ children }: Props) {
  return children;
}
