import { Database } from "simpl.db";

export const simpldb = new Database({
  dataFile: `baileys/storage/data.json`,
  collectionsFolder: `baileys/storage`,
  collectionTimestamps: true,
  tabSize: 2,
})
