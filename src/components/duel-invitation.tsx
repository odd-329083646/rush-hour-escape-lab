import { useNavigate } from "@tanstack/react-router";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDuelInvitations } from "@/hooks/useDuelInvitations";
import { useI18n } from "@/lib/i18n";
import { formatRoomCode } from "@/engine/tournament";

export function DuelInvitationNotification() {
  const { inbox, dismiss } = useDuelInvitations();
  const { t } = useI18n();
  const navigate = useNavigate();
  const invitation = inbox.invitations[0];
  return <Dialog open={Boolean(invitation)} onOpenChange={open => { if (!open && invitation) void dismiss(invitation.id); }}>
    <DialogContent className="text-center">
      <Swords className="mx-auto h-10 w-10 text-toy-yellow" />
      <DialogTitle>{t("raceInvitation")}</DialogTitle>
      <DialogDescription>{invitation && t("raceInvitationBody", { name: invitation.name, code: formatRoomCode(invitation.code) })}</DialogDescription>
      <Button className="execute" onClick={() => {
        if (!invitation) return;
        void dismiss(invitation.id);
        void navigate({ to: "/competitions", search: { room: invitation.code } });
      }}>{t("raceJoin")}</Button>
      <Button variant="outline" onClick={() => { if (invitation) void dismiss(invitation.id); }}>{t("raceDecline")}</Button>
    </DialogContent>
  </Dialog>;
}