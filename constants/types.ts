import type { FC } from "react";
import type { IconProps } from "@/icons";

export type ISidebarMenuItem = {
  Icon: FC<IconProps>;
  ActiveIcon?: FC<IconProps>;
  label: string;
  url?: string;
  isClosed?: boolean;
  isLg?: boolean;
  fn?: () => void;
};

export interface NavLink {
  label: string;
  href: string;
}

export interface FeatureItem {
  description: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export interface ExtensionFeature {
  title: string;
  description: string;
}
