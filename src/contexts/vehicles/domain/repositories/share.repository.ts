import { Share } from "../entities/share";

export abstract class ShareRepository {
  abstract save(share: Share): Promise<void>;
}
