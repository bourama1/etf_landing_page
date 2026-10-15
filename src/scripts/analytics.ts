// Loaded on every page from Base.astro. No website ID (local, previews) → nothing is loaded.
import { loadUmami } from '../lib/track.ts';
loadUmami();
