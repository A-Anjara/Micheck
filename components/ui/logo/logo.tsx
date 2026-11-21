import type { SVGProps } from "react";

export interface LogoLightProps extends SVGProps<SVGSVGElement> {
  /** Couleur du logo. Par défaut `currentColor`, donc modifiable via `className="text-..."` ou une couleur CSS héritée. */
  color?: string;
}

/**
 * Logo MiCheck (version claire) converti en composant React.
 *
 * @example
 * <LogoLight className="h-10 w-10 text-white" />
 * <LogoLight className="h-10 w-10" color="#A8C37D" />
 */
export function LogoLight({
  className,
  color = "currentColor",
  ...props
}: LogoLightProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 205 213"
      fill="none"
      role="img"
      aria-label="MiCheck"
      className={className}
      {...props}
    >
      <path
        fill={color}
        d="M151.801 0C159.581 0 166.971 1.67148 173.632 4.67569L104.105 92.2694L59.6197 50.9547L32.1029 89.056L104.105 142.765L204.995 52.5444C204.998 52.7792 205 53.0144 205 53.25V139.084C205 164.038 184.523 184.125 159.597 183.621L161.432 213C158.864 211.164 111.137 192.343 104.564 184.998L52.9662 184.771C23.6765 184.642 3.77112e-05 160.84 0 131.522V53.25C1.89123e-06 23.8408 23.8181 0 53.1991 0H151.801ZM205 52.5408L204.995 52.5444C204.995 52.5405 204.995 52.5366 204.995 52.5327L205 52.5408ZM173.81 4.75639C173.751 4.72947 173.692 4.7024 173.632 4.67569L173.701 4.59052L173.81 4.75639Z"
      />
    </svg>
  );
}

export default LogoLight;
