import "./body-evolution-direct-fix.js?v=3";
import { displayName } from "./exercise-rename-translate.js";
import {
  readWorkoutData,
  writeWorkoutData,
} from "./lib/workout-state.js";

const DB =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const USER_KEY = "mayfit_user";
const CATALOG_KEY = "mayfit_exercise_catalog_v1";
const NAME_PREFIX = "mayfit_workout_name_";
let loading = false,
  allExercises = [];

const css = `
#mse-modal{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:14px;background:rgba(0,0,0,.82)}
`;
