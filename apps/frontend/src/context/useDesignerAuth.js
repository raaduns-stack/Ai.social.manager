import { useContext } from "react";
import { DesignerAuthContext } from "./DesignerAuthContext";

export function useDesignerAuth() {
  const ctx = useContext(DesignerAuthContext);
  if (!ctx) {
    throw new Error("useDesignerAuth must be used inside <DesignerAuthProvider>");
  }
  return ctx;
}
