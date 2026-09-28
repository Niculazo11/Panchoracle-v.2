import { asset } from "../lib/asset.js";
import rawCatalog from "./dataset.json";

// Cosmetics catalog with each image path resolved against Vite's base.
const catalog = rawCatalog.map((item) => ({ ...item, image: asset(item.image) }));

export default catalog;
