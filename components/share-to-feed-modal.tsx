"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ShareToFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (description: string) => Promise<void>;
  title: string;
  descriptionText: string;
}

export function ShareToFeedModal({
  isOpen,
  onClose,
  onShare,
  title,
  descriptionText,
}: ShareToFeedModalProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShare = async () => {
    try {
      setIsSubmitting(true);
      if (description) {
        await onShare(description);
      } else {
        await onShare(""); 
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Write a custom message... (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="resize-none h-24"
          />
        </div>
        <DialogFooter className="flex sm:justify-between w-full flex-row">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Skip
          </Button>
          <Button onClick={handleShare} disabled={isSubmitting}>
            {isSubmitting ? "Sharing..." : "Share to Feed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
