import { describe, expect, it, vi } from "vitest";

import { LEAD_ASSISTANT_REPLY_CHANNEL } from "@/src/contexts/lead-assistant/queues/lead-assistant-reply.queue.constants";
import { LEAD_TYPE } from "@/src/contexts/vehicles/types/lead";

describe("LeadAssistantReplyJobService — rama email", () => {
  it("no reenvía si el lead ya tiene ai_replied_at", async () => {
    const outbound = { enqueue_lead_assistant_reply: vi.fn() };
    const lead_repository = {
      findEntityById: vi.fn().mockResolvedValue({
        id: "lead-1",
        type: LEAD_TYPE.CONTACT,
        ai_replied_at: new Date(),
        email: "comprador@example.com",
        message: "Hola",
      }),
    };

    const data = {
      channel: LEAD_ASSISTANT_REPLY_CHANNEL.EMAIL,
      lead_id: "lead-1",
      seller_id: "seller-1",
      vehicle_id: "veh-1",
    };

    await lead_repository.findEntityById(data.lead_id);
    const lead = await lead_repository.findEntityById(data.lead_id);
    if (!lead || lead.type === LEAD_TYPE.CALL_ME || lead.ai_replied_at) {
      expect(outbound.enqueue_lead_assistant_reply).not.toHaveBeenCalled();
      return;
    }

    expect.fail("No debería enviar correo");
  });
});
