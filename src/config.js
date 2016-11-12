const config = {};

config.oauth2 = process.env.oauth2 || "";
config.owner = process.env.owner || "babel";
config.repo = process.env.repo || "babel";
config.startPr = process.env.startPr || 0;
config.endPr = process.env.endPr || 0;

export default config;
