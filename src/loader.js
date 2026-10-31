// Kinetic Ad Studio - full simulator loader
async function loadFullSimulator() {
  const parts = [
    "./src/main-part1.js",
    "./src/main-part2.js",
    "./src/main-part3.js"
  ];
  let code = "";
  for (const p of parts) {
    const res = await fetch(p);
    code += await res.text();
  }
  // Execute the combined code as a module-like script
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const script = document.createElement("script");
  script.type = "module";
  script.src = url;
  document.body.appendChild(script);
}
loadFullSimulator().catch(err => {
  console.error(err);
  document.body.innerHTML = "<div style=\"color:#00e5ff;padding:40px;font-family:sans-serif\">Failed to load simulator. Please refresh.</div>";
});
