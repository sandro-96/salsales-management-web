import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createTicket } from "../../api/supportApi.js";

const CATEGORY_VALUES = [
  "GENERAL",
  "ORDER",
  "PRODUCT",
  "PAYMENT",
  "ACCOUNT",
  "OTHER",
];

const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function CreateTicketModal({ open, onOpenChange, onCreated }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setCategory("GENERAL");
    setPriority("MEDIUM");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error(t("pages.support.createTicket.toastRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await createTicket({ subject, message, category, priority });
      if (res.data?.success) {
        toast.success(t("pages.support.createTicket.toastSuccess"));
        resetForm();
        onOpenChange(false);
        onCreated?.();
      } else {
        toast.error(
          res.data?.message || t("pages.support.createTicket.toastFail"),
        );
      }
    } catch (err) {
      console.error("Create ticket error:", err);
      toast.error(t("pages.support.createTicket.toastError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("pages.support.createTicket.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("pages.support.createTicket.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">
              {t("pages.support.createTicket.subject")}
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("pages.support.createTicket.subjectPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("pages.support.createTicket.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_VALUES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`pages.support.category.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("pages.support.createTicket.priority")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_VALUES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`pages.support.priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              {t("pages.support.createTicket.message")}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("pages.support.createTicket.messagePlaceholder")}
              rows={5}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} variant="success">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("pages.support.createTicket.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
