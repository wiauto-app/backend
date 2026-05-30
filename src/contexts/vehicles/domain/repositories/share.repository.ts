import { Share } from "../entities/share";

export abstract class ShareRepository {
  abstract record(share: Share): Promise<void>;
}
