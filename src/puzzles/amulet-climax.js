import { branchDone } from "../village-progress.js";
export function amuletComplete(values) {
  return values.studioGemFound === true && branchDone(values.villageTasks, "inn") &&
    branchDone(values.villageTasks, "house");
}
export function climaxPending(values) {
  return !values.studioGemFound ||
    (amuletComplete(values) && (!values.studioAmuletCelebrated || !values.studioTreehouseInvited));
}
