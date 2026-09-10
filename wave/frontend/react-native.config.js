module.exports = {
  // Source of truth for the app's custom font - linked into each platform
  // by hand (see android/app/src/main/assets/fonts and ios/frontend/Fonts,
  // plus ios/frontend/Info.plist's UIAppFonts) rather than by re-running
  // this through `npx react-native-asset`, but kept declared here so that
  // command still finds and re-links this folder correctly if it's ever
  // rerun (e.g. after adding another weight).
  assets: ['./assets/fonts/Jost'],
};
