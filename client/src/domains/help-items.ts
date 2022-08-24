import * as ViewModifiers from "@app/shared/view-modifiers";

export const clean = (dbObj: { description: string; [x: string]: any }) => ({
  ...dbObj,
  description: ViewModifiers.markdown.render(dbObj.description),
});
