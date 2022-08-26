export const clean = (dbObj: { description: string; [x: string]: any }) => ({
  ...dbObj,
  // remove the Z from the tiemzone info for the client
  end_at: dbObj.end_at?.replace("Z", ""),
});
