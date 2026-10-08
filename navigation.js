/* =====================================================
   navigation.js — Slide switching + progress
===================================================== */
const Navigation = (() => {
  let current = 0;
  let total = 0;
  let onChange = null;

  function init(opts = {}) {
    onChange = opts.onChange;
    const slides = document.querySelector