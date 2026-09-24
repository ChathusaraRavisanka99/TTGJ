-- A formal "request a live video call" tag on a chat message, same
-- mechanism as the existing gemstone/jewelry/cart tags.
ALTER TABLE "ChatMessage" ADD COLUMN "isVideoCallRequest" BOOLEAN NOT NULL DEFAULT false;
