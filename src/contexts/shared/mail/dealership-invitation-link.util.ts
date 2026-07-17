import { envs } from "@/src/common/envs";
import { V1_DEALERSHIP_INVITATIONS } from "../../dealership/api/route.constants";

export const build_dealership_invitation_accept_link = (
  invitation_token: string,
): string => {
  const base_invitation_url = envs.BACKEND_URL.trim();
  const normalized_base_url = `${base_invitation_url}/${V1_DEALERSHIP_INVITATIONS}/accept`;
  const separator = normalized_base_url.includes("?") ? "&" : "?";

  return `${normalized_base_url}${separator}token=${encodeURIComponent(invitation_token)}&with_response=false`;
};

export const build_dealership_invitation_reject_link = (
  invitation_token: string,
): string => {
  const base_invitation_url = envs.BACKEND_URL.trim();
  const normalized_base_url = `${base_invitation_url}/${V1_DEALERSHIP_INVITATIONS}/reject`;
  const separator = normalized_base_url.includes("?") ? "&" : "?";

  return `${normalized_base_url}${separator}token=${encodeURIComponent(invitation_token)}&with_response=false`;
};
