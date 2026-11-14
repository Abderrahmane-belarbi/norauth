import { Fingerprint } from "lucide-react";

export function Brand() {
  return (
    <div className="brand" aria-label="norauth home">
      <span className="brand-mark">
        <Fingerprint size={20} strokeWidth={2.2} />
      </span>
      <span>
        norauth<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
